from datetime import date, datetime, time, timedelta
from typing import Iterable

from fastapi import HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.approval import MonthlyAttendanceApproval
from app.models.attendance import AttendanceRecord
from app.models.user import User
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceOut,
    AttendanceUpdate,
    MonthAttendanceOut,
    MonthSummary,
)


def parse_month(month: str) -> date:
    """Parse 'YYYY-MM' to date(YYYY, MM, 1)."""
    try:
        year_s, mo_s = month.split("-")
        return date(int(year_s), int(mo_s), 1)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="month must be in YYYY-MM format",
        ) from exc


def month_bounds(month_first: date) -> tuple[date, date]:
    if month_first.month == 12:
        next_month = date(month_first.year + 1, 1, 1)
    else:
        next_month = date(month_first.year, month_first.month + 1, 1)
    return month_first, next_month - timedelta(days=1)


def _calc_total_hours(check_in: time | None, check_out: time | None) -> float | None:
    if check_in is None or check_out is None:
        return None
    base = datetime(2000, 1, 1)
    delta = datetime.combine(base, check_out) - datetime.combine(base, check_in)
    return round(delta.total_seconds() / 3600, 2)


def _to_out(rec: AttendanceRecord) -> AttendanceOut:
    out = AttendanceOut.model_validate(rec)
    out.total_hours = _calc_total_hours(rec.check_in, rec.check_out)
    return out


def _approval(db: Session, user_id: int, month: date) -> MonthlyAttendanceApproval | None:
    return (
        db.query(MonthlyAttendanceApproval)
        .filter(
            MonthlyAttendanceApproval.user_id == user_id,
            MonthlyAttendanceApproval.month == month,
        )
        .one_or_none()
    )


def _ensure_not_locked(db: Session, user_id: int, day: date) -> None:
    month_first = date(day.year, day.month, 1)
    approval = _approval(db, user_id, month_first)
    if approval is not None and approval.locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"month {month_first.isoformat()[:7]} is locked",
        )


def list_my_month(db: Session, user: User, month: str) -> MonthAttendanceOut:
    month_first = parse_month(month)
    start, end = month_bounds(month_first)

    rows: Iterable[AttendanceRecord] = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.user_id == user.id,
            AttendanceRecord.date >= start,
            AttendanceRecord.date <= end,
        )
        .order_by(AttendanceRecord.date)
        .all()
    )
    records = [_to_out(r) for r in rows]

    counts = {
        "work": 0,
        "vacation": 0,
        "sick": 0,
        "reserve": 0,
        "holiday": 0,
        "other_absence": 0,
    }
    total_hours = 0.0
    for r in records:
        counts[r.day_type] = counts.get(r.day_type, 0) + 1
        if r.total_hours:
            total_hours += r.total_hours

    approval = _approval(db, user.id, month_first)
    summary = MonthSummary(
        month=month_first.strftime("%Y-%m"),
        work_days=counts["work"],
        vacation_days=counts["vacation"],
        sick_days=counts["sick"],
        reserve_days=counts["reserve"],
        holiday_days=counts["holiday"],
        other_absence_days=counts["other_absence"],
        total_hours=round(total_hours, 2),
        submitted=approval is not None and approval.status in ("submitted", "approved"),
        approved=approval is not None and approval.status == "approved",
        locked=approval is not None and approval.locked,
    )
    return MonthAttendanceOut(
        records=records,
        summary=summary,
        approval_status=approval.status if approval else None,
    )


def create_record(db: Session, user: User, payload: AttendanceCreate) -> AttendanceOut:
    _ensure_not_locked(db, user.id, payload.date)

    existing = (
        db.query(AttendanceRecord)
        .filter(
            and_(
                AttendanceRecord.user_id == user.id,
                AttendanceRecord.date == payload.date,
            )
        )
        .one_or_none()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"record for {payload.date.isoformat()} already exists",
        )

    rec = AttendanceRecord(
        user_id=user.id,
        date=payload.date,
        check_in=payload.check_in,
        check_out=payload.check_out,
        day_type=payload.day_type,
        note=payload.note,
        status="draft",
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return _to_out(rec)


def update_record(
    db: Session, user: User, record_id: int, payload: AttendanceUpdate
) -> AttendanceOut:
    rec = db.get(AttendanceRecord, record_id)
    if rec is None or rec.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    _ensure_not_locked(db, user.id, rec.date)

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(rec, key, value)

    if rec.day_type == "work":
        if rec.check_in is None or rec.check_out is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="check_in and check_out required for day_type=work",
            )
        if rec.check_out <= rec.check_in:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="check_out must be after check_in",
            )

    rec.status = "draft"
    db.commit()
    db.refresh(rec)
    return _to_out(rec)


def delete_record(db: Session, user: User, record_id: int) -> None:
    rec = db.get(AttendanceRecord, record_id)
    if rec is None or rec.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    _ensure_not_locked(db, user.id, rec.date)
    db.delete(rec)
    db.commit()


def submit_month(db: Session, user: User, month: str) -> MonthAttendanceOut:
    month_first = parse_month(month)
    start, end = month_bounds(month_first)

    approval = _approval(db, user.id, month_first)
    if approval is not None and approval.locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="month is locked"
        )

    records: list[AttendanceRecord] = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.user_id == user.id,
            AttendanceRecord.date >= start,
            AttendanceRecord.date <= end,
        )
        .all()
    )
    if not records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="no records to submit for this month",
        )

    for r in records:
        if r.status == "draft":
            r.status = "submitted"

    if approval is None:
        approval = MonthlyAttendanceApproval(
            user_id=user.id, month=month_first, status="submitted", locked=False
        )
        db.add(approval)
    else:
        approval.status = "submitted"
        approval.reject_reason = None
        approval.approved_by = None
        approval.approved_at = None

    db.commit()
    return list_my_month(db, user, month)
