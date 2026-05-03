from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database import get_db
from app.models.attendance import AttendanceRecord
from app.models.user import User
from app.schemas.attendance import (
    ApprovalActionIn,
    AttendanceOut,
    AttendanceUpdate,
)
from app.schemas.allowed_email import (
    AllowedEmailIn,
    AllowedEmailOut,
    AllowedEmailUpdate,
)
from app.schemas.user import MessageOut, UserAdminUpdate, UserOut
from app.services import allowed_email_service, approval_service, attendance_service
from app.services.export_service import export_month_xlsx


router = APIRouter(prefix="/admin", tags=["admin"])


# ---------- users ----------

@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    department: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
) -> list[UserOut]:
    q = db.query(User)
    if department:
        q = q.filter(User.department == department)
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    return [UserOut.model_validate(u) for u in q.order_by(User.full_name).all()]


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> UserOut:
    u = db.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")
    return UserOut.model_validate(u)


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserAdminUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> UserOut:
    u = db.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(u, k, v)
    db.commit()
    db.refresh(u)
    return UserOut.model_validate(u)


@router.delete("/users/{user_id}", response_model=MessageOut)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> MessageOut:
    u = db.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")
    u.is_active = False
    db.commit()
    return MessageOut(message="user deactivated")


# ---------- attendance ----------

@router.get("/attendance", response_model=list[AttendanceOut])
def list_attendance(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    user_id: int | None = Query(default=None),
    month: str | None = Query(default=None),
    department: str | None = Query(default=None),
    record_status: str | None = Query(default=None, alias="status"),
) -> list[AttendanceOut]:
    q = db.query(AttendanceRecord).join(User, User.id == AttendanceRecord.user_id)
    if user_id is not None:
        q = q.filter(AttendanceRecord.user_id == user_id)
    if month is not None:
        month_first = attendance_service.parse_month(month)
        start, end = attendance_service.month_bounds(month_first)
        q = q.filter(AttendanceRecord.date >= start, AttendanceRecord.date <= end)
    if department:
        q = q.filter(User.department == department)
    if record_status:
        q = q.filter(AttendanceRecord.status == record_status)
    rows = q.order_by(AttendanceRecord.date).all()
    return [
        AttendanceOut(
            **{
                **AttendanceOut.model_validate(r).model_dump(),
                "total_hours": (
                    None
                    if r.check_in is None or r.check_out is None
                    else round(
                        (
                            (r.check_out.hour * 3600 + r.check_out.minute * 60 + r.check_out.second)
                            - (r.check_in.hour * 3600 + r.check_in.minute * 60 + r.check_in.second)
                        )
                        / 3600,
                        2,
                    )
                ),
            }
        )
        for r in rows
    ]


@router.put("/attendance/{record_id}", response_model=AttendanceOut)
def admin_update_record(
    record_id: int,
    payload: AttendanceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> AttendanceOut:
    rec = db.get(AttendanceRecord, record_id)
    if rec is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(rec, k, v)
    if rec.day_type == "work":
        if rec.check_in is None or rec.check_out is None or rec.check_out <= rec.check_in:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="invalid work-day times",
            )
    db.commit()
    db.refresh(rec)
    out = AttendanceOut.model_validate(rec)
    if rec.check_in and rec.check_out:
        delta = (
            (rec.check_out.hour * 3600 + rec.check_out.minute * 60)
            - (rec.check_in.hour * 3600 + rec.check_in.minute * 60)
        )
        out.total_hours = round(delta / 3600, 2)
    return out


# ---------- approval ----------

@router.post("/attendance/month/{user_id}/{month}/approve")
def approve(
    user_id: int,
    month: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict:
    return approval_service.approve_month(db, admin=admin, user_id=user_id, month=month)


@router.post("/attendance/month/{user_id}/{month}/reject")
def reject(
    user_id: int,
    month: str,
    payload: ApprovalActionIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict:
    return approval_service.reject_month(
        db, admin=admin, user_id=user_id, month=month, reason=payload.reason
    )


@router.post("/attendance/month/{user_id}/{month}/unlock")
def unlock(
    user_id: int,
    month: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict:
    return approval_service.unlock_month(db, admin=admin, user_id=user_id, month=month)


# ---------- allowed emails (registration whitelist) ----------

@router.get("/allowed-emails", response_model=list[AllowedEmailOut])
def list_allowed_emails(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[AllowedEmailOut]:
    return [
        AllowedEmailOut.model_validate(e)
        for e in allowed_email_service.list_entries(db)
    ]


@router.post(
    "/allowed-emails",
    response_model=AllowedEmailOut,
    status_code=status.HTTP_201_CREATED,
)
def add_allowed_email(
    payload: AllowedEmailIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> AllowedEmailOut:
    entry = allowed_email_service.add_entry(
        db,
        email=payload.email,
        default_role=payload.default_role,
        note=payload.note,
        admin=admin,
    )
    return AllowedEmailOut.model_validate(entry)


@router.put("/allowed-emails/{entry_id}", response_model=AllowedEmailOut)
def update_allowed_email(
    entry_id: int,
    payload: AllowedEmailUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> AllowedEmailOut:
    entry = allowed_email_service.update_entry(
        db,
        entry_id=entry_id,
        default_role=payload.default_role,
        note=payload.note,
    )
    return AllowedEmailOut.model_validate(entry)


@router.delete("/allowed-emails/{entry_id}", response_model=MessageOut)
def remove_allowed_email(
    entry_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> MessageOut:
    allowed_email_service.remove_entry(db, entry_id)
    return MessageOut(message="removed")


# ---------- export ----------

@router.get("/attendance/export")
def export_month(
    month: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Response:
    content, filename = export_month_xlsx(db, month)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
