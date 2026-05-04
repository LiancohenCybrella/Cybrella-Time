from datetime import date as Date, datetime, time
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints, model_validator


DayType = Literal[
    "work",
    "vacation",
    "sick",
    "reserve",
    "holiday",
    "other_absence",
    "full_day_activity",
]
RecordStatus = Literal["draft", "submitted", "approved", "rejected"]
ApprovalStatus = Literal["submitted", "approved", "rejected"]


class AttendanceBase(BaseModel):
    date: Date
    check_in: time | None = None
    check_out: time | None = None
    day_type: DayType
    partial_secondary_type: DayType | None = None
    note: Annotated[str | None, StringConstraints(max_length=2000)] = None


class AttendanceCreate(AttendanceBase):
    @model_validator(mode="after")
    def _validate_times_and_secondary(self) -> "AttendanceCreate":
        if (
            self.partial_secondary_type is not None
            and self.partial_secondary_type == self.day_type
        ):
            raise ValueError("partial_secondary_type must differ from day_type")

        needs_hours = self.day_type == "work" or self.partial_secondary_type == "work"
        if needs_hours:
            if self.check_in is None or self.check_out is None:
                raise ValueError(
                    "check_in and check_out required when day involves work"
                )
            if self.check_out <= self.check_in:
                raise ValueError("check_out must be after check_in")
        return self


class AttendanceRangeCreate(BaseModel):
    start_date: Date
    end_date: Date
    day_type: DayType
    partial_secondary_type: DayType | None = None
    check_in: time | None = None
    check_out: time | None = None
    note: Annotated[str | None, StringConstraints(max_length=2000)] = None
    skip_existing: bool = True

    @model_validator(mode="after")
    def _validate(self) -> "AttendanceRangeCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        if (
            self.partial_secondary_type is not None
            and self.partial_secondary_type == self.day_type
        ):
            raise ValueError("partial_secondary_type must differ from day_type")
        needs_hours = self.day_type == "work" or self.partial_secondary_type == "work"
        if needs_hours:
            if self.check_in is None or self.check_out is None:
                raise ValueError(
                    "check_in and check_out required when day involves work"
                )
            if self.check_out <= self.check_in:
                raise ValueError("check_out must be after check_in")
        return self


class AttendanceUpdate(BaseModel):
    date: Date | None = None
    check_in: time | None = None
    check_out: time | None = None
    day_type: DayType | None = None
    partial_secondary_type: DayType | None = None
    note: Annotated[str | None, StringConstraints(max_length=2000)] = None


class AttendanceOut(AttendanceBase):
    id: int
    user_id: int
    status: RecordStatus
    total_hours: float | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AttendanceRangeResult(BaseModel):
    created: list[AttendanceOut] = []
    skipped_dates: list[Date] = []


class MonthSummary(BaseModel):
    month: str  # YYYY-MM
    work_days: int
    vacation_days: int
    sick_days: int
    reserve_days: int
    holiday_days: int
    other_absence_days: int
    full_day_activity_days: int = 0
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
