from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.approval import MonthlyAttendanceApproval
from app.models.attendance import AttendanceRecord
from app.models.user import User
from app.services.attendance_service import month_bounds, parse_month


def _get_or_create_approval(
    db: Session, user_id: int, month_first
) -> MonthlyAttendanceApproval:
    approval = (
        db.query(MonthlyAttendanceApproval)
        .filter(
            MonthlyAttendanceApproval.user_id == user_id,
            MonthlyAttendanceApproval.month == month_first,
        )
        .one_or_none()
    )
    if approval is None:
        approval = MonthlyAttendanceApproval(
            user_id=user_id, month=month_first, status="submitted", locked=False
        )
        db.add(approval)
        db.flush()
    return approval


def approve_month(db: Session, *, admin: User, user_id: int, month: str) -> dict:
    month_first = parse_month(month)
    start, end = month_bounds(month_first)
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="user not found")

    approval = _get_or_create_approval(db, user_id, month_first)
    approval.status = "approved"
    approval.approved_by = admin.id
    approval.approved_at = datetime.now(timezone.utc)
    approval.reject_reason = None
    approval.locked = True

    db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == user_id,
        AttendanceRecord.date >= start,
        AttendanceRecord.date <= end,
    ).update({AttendanceRecord.status: "approved"}, synchronize_session=False)

    db.commit()
    return {"status": "approved", "month": month_first.strftime("%Y-%m"), "locked": True}


def reject_month(
    db: Session, *, admin: User, user_id: int, month: str, reason: str | None
) -> dict:
    month_first = parse_month(month)
    start, end = month_bounds(month_first)
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="user not found")

    approval = _get_or_create_approval(db, user_id, month_first)
    approval.status = "rejected"
    approval.approved_by = admin.id
    approval.approved_at = datetime.now(timezone.utc)
    approval.reject_reason = reason
    approval.locked = False

    db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == user_id,
        AttendanceRecord.date >= start,
        AttendanceRecord.date <= end,
    ).update({AttendanceRecord.status: "draft"}, synchronize_session=False)

    db.commit()
    return {"status": "rejected", "month": month_first.strftime("%Y-%m"), "reason": reason}


def unlock_month(db: Session, *, admin: User, user_id: int, month: str) -> dict:
    month_first = parse_month(month)
    start, end = month_bounds(month_first)
    approval = (
        db.query(MonthlyAttendanceApproval)
        .filter(
            MonthlyAttendanceApproval.user_id == user_id,
            MonthlyAttendanceApproval.month == month_first,
        )
        .one_or_none()
    )
    if approval is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="no approval row")

    approval.locked = False
    approval.status = "submitted"
    db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == user_id,
        AttendanceRecord.date >= start,
        AttendanceRecord.date <= end,
    ).update({AttendanceRecord.status: "draft"}, synchronize_session=False)

    db.commit()
    return {"status": "unlocked", "month": month_first.strftime("%Y-%m")}
