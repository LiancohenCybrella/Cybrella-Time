from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr


Role = Literal["user", "admin"]


class AllowedEmailIn(BaseModel):
    email: EmailStr
    default_role: Role = "user"
    note: str | None = None


class AllowedEmailUpdate(BaseModel):
    default_role: Role | None = None
    note: str | None = None


class AllowedEmailOut(BaseModel):
    id: int
    email: str
    default_role: Role
    note: str | None = None
    created_by_user_id: int | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
