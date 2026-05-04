from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints


EmploymentType = Literal["full_time", "part_time", "hourly"]
Role = Literal["user", "admin"]


class UserBase(BaseModel):
    email: EmailStr
    full_name: Annotated[str, StringConstraints(min_length=1, max_length=200)]
    phone: str | None = None
    job_title: str | None = None
    department: str | None = None
    employment_type: EmploymentType


class UserRegister(UserBase):
    password: Annotated[str, StringConstraints(min_length=8, max_length=128)]


class UserUpdate(BaseModel):
    full_name: Annotated[str, StringConstraints(min_length=1, max_length=200)] | None = None
    phone: str | None = None
    job_title: str | None = None
    department: str | None = None
    employment_type: EmploymentType | None = None


class UserAdminUpdate(UserUpdate):
    role: Role | None = None
    is_active: bool | None = None


class UserOut(UserBase):
    id: int
    role: Role
    is_active: bool
    must_change_password: bool = False
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminPasswordResetOut(BaseModel):
    user_id: int
    email: str
    temp_password: str
    message: str = "סיסמה זמנית נוצרה. שלח אותה למשתמש."


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: Annotated[str, StringConstraints(min_length=8, max_length=128)]


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: Annotated[str, StringConstraints(min_length=8, max_length=128)]


class MessageOut(BaseModel):
    message: str = Field(default="ok")
