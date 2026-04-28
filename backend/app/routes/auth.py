from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordIn,
    LoginIn,
    MessageOut,
    ResetPasswordIn,
    TokenOut,
    UserOut,
    UserRegister,
)
from app.services import auth_service


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)) -> TokenOut:
    return auth_service.register_user(db, payload)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    return auth_service.login(db, payload)


@router.post("/forgot-password", response_model=MessageOut)
def forgot_password(payload: ForgotPasswordIn, db: Session = Depends(get_db)) -> MessageOut:
    auth_service.forgot_password(db, payload)
    return MessageOut(message="if the email exists, a reset link has been sent")


@router.post("/reset-password", response_model=MessageOut)
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)) -> MessageOut:
    auth_service.reset_password(db, payload)
    return MessageOut(message="password updated")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)
