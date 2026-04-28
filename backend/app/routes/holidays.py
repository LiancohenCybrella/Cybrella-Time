from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin
from app.database import get_db
from app.models.holiday import OrganizationHoliday
from app.models.user import User
from app.schemas.holiday import HolidayCreate, HolidayOut, HolidayUpdate
from app.schemas.user import MessageOut
from app.services.attendance_service import month_bounds, parse_month


router = APIRouter(tags=["holidays"])


@router.get("/holidays", response_model=list[HolidayOut])
def list_holidays(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    month: str | None = Query(default=None),
) -> list[HolidayOut]:
    q = db.query(OrganizationHoliday)
    if month:
        month_first = parse_month(month)
        start, end = month_bounds(month_first)
        q = q.filter(OrganizationHoliday.date >= start, OrganizationHoliday.date <= end)
    return [HolidayOut.model_validate(h) for h in q.order_by(OrganizationHoliday.date).all()]


@router.post(
    "/admin/holidays",
    response_model=HolidayOut,
    status_code=status.HTTP_201_CREATED,
)
def create_holiday(
    payload: HolidayCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> HolidayOut:
    holiday = OrganizationHoliday(
        date=payload.date, title=payload.title, description=payload.description
    )
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    return HolidayOut.model_validate(holiday)


@router.put("/admin/holidays/{holiday_id}", response_model=HolidayOut)
def update_holiday(
    holiday_id: int,
    payload: HolidayUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> HolidayOut:
    holiday = db.get(OrganizationHoliday, holiday_id)
    if holiday is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(holiday, k, v)
    db.commit()
    db.refresh(holiday)
    return HolidayOut.model_validate(holiday)


@router.delete("/admin/holidays/{holiday_id}", response_model=MessageOut)
def delete_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> MessageOut:
    holiday = db.get(OrganizationHoliday, holiday_id)
    if holiday is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    db.delete(holiday)
    db.commit()
    return MessageOut(message="holiday deleted")
