from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceOut,
    AttendanceRangeCreate,
    AttendanceRangeResult,
    AttendanceUpdate,
    MonthAttendanceOut,
)
from app.schemas.user import MessageOut
from app.services import attendance_service


router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("/my", response_model=MonthAttendanceOut)
def my_month(
    month: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthAttendanceOut:
    return attendance_service.list_my_month(db, current_user, month)


@router.post("", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
def create_record(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AttendanceOut:
    return attendance_service.create_record(db, current_user, payload)


@router.post(
    "/range",
    response_model=AttendanceRangeResult,
    status_code=status.HTTP_201_CREATED,
)
def create_range(
    payload: AttendanceRangeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AttendanceRangeResult:
    return attendance_service.create_range(db, current_user, payload)


@router.put("/{record_id}", response_model=AttendanceOut)
def update_record(
    record_id: int,
    payload: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AttendanceOut:
    return attendance_service.update_record(db, current_user, record_id, payload)


@router.delete("/{record_id}", response_model=MessageOut)
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageOut:
    attendance_service.delete_record(db, current_user, record_id)
    return MessageOut(message="deleted")


@router.post("/month/{month}/submit", response_model=MonthAttendanceOut)
def submit_month(
    month: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthAttendanceOut:
    return attendance_service.submit_month(db, current_user, month)
