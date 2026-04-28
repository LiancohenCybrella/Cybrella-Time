from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints


class HolidayBase(BaseModel):
    date: date
    title: Annotated[str, StringConstraints(min_length=1, max_length=200)]
    description: Annotated[str | None, StringConstraints(max_length=2000)] = None


class HolidayCreate(HolidayBase):
    pass


class HolidayUpdate(BaseModel):
    date: date | None = None
    title: Annotated[str | None, StringConstraints(min_length=1, max_length=200)] = None
    description: Annotated[str | None, StringConstraints(max_length=2000)] = None


class HolidayOut(HolidayBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
