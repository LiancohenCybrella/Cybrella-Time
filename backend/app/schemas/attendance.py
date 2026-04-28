from __future__ import annotations

from datetime import date, datetime, time
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints, model_validator


DayType = Literal["work", "vacation", "sick", "reserve", "holiday", "other_absence"]
RecordStatus = Literal["draft", "submitted", "approved", "rejected"]
ApprovalStatus = Literal["submitted", "approved", "rejected"]


class AttendanceBase(BaseModel):
    date: date
    check_in: time | None = None
    check_out: time | None = None
    day_type: DayType
    note: Annotated[str | None, StringConstraints(max_length=2000)] = None

    @model_validator(mode="after")
    def _times_only_on_work(self) -> "AttendanceBase":
        if self.day_type == "work":
            if self.check_in is None or self.check_out is None:
                raise ValueError("check_in and check_out required for day_type=work")
            if self.check_out <= self.check_in:
                raise ValueError("check_out must be after check_in")
        return self


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    date: date | None = None
    check_in: time | None = None
    check_out: time | None = None
    day_type: DayType | None = None
    note: Annotated[str | None, StringConstraints(max_length=2000)] = None


class AttendanceOut(AttendanceBase):
    id: int
    user_id: int
    status: RecordStatus
    total_hours: float | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class MonthSummary(BaseModel):
    month: str  # YYYY-MM
    work_days: int
    vacation_days: int
    sick_days: int
    reserve_days: int
    holiday_days: int
    other_absence_days: int
    total_hours: float
    submitted: bool
    approved: bool
    locked: bool


class MonthAttendanceOut(BaseModel):
    records: list[AttendanceOut]
    summary: MonthSummary
    approval_status: ApprovalStatus | None = None


class ApprovalActionIn(BaseModel):
    reason: str | None = None
