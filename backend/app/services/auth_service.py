import re
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_reset_token,
    hash_password,
    hash_reset_token,
    verify_password,
)
from app.models.reset_token import PasswordResetToken
from app.models.user import User
from app.schemas.user import (
    ChangePasswordIn,
    ForgotPasswordIn,
    LoginIn,
    ResetPasswordIn,
    TokenOut,
    UserOut,
    UserRegister,
)
from app.utils.email import send_password_reset_email


def _email_domain_ok(email: str) -> bool:
    pattern = rf"^[^@]+@{re.escape(settings.ALLOWED_EMAIL_DOMAIN)}$"
    return bool(re.match(pattern, email, re.IGNORECASE))


def register_user(db: Session, payload: UserRegister) -> TokenOut:
    if not _email_domain_ok(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"email must end with @{settings.ALLOWED_EMAIL_DOMAIN}",
        )

    existing = db.query(User).filter(User.email == payload.email).one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="email already registered",
        )

    role = "admin" if payload.email.lower() == settings.INITIAL_ADMIN_EMAIL.lower() else "user"

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        job_title=payload.job_title,
        department=payload.department,
        employment_type=payload.employment_type,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


def login(db: Session, payload: LoginIn) -> TokenOut:
    user = db.query(User).filter(User.email == payload.email).one_or_none()
    if user is None or not user.is_active or not verify_password(
        payload.password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid credentials",
        )
    token = create_access_token(subject=user.id, role=user.role)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


def forgot_password(db: Session, payload: ForgotPasswordIn) -> None:
    user = db.query(User).filter(User.email == payload.email).one_or_none()
    if user is None or not user.is_active:
        return  # don't leak existence

    raw_token, token_hash = generate_reset_token()
    expires = datetime.now(timezone.utc) + timedelta(
        minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES
    )
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires,
        )
    )
    db.commit()

    reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/{raw_token}"
    send_password_reset_email(to=user.email, reset_url=reset_url)


def reset_password(db: Session, payload: ResetPasswordIn) -> None:
    token_hash = hash_reset_token(payload.token)
    record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_hash)
        .one_or_none()
    )
    now = datetime.now(timezone.utc)
    if record is None or record.used_at is not None or record.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid or expired token",
        )

    user = db.get(User, record.user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid or expired token",
        )

    user.password_hash = hash_password(payload.new_password)
    record.used_at = now
    db.commit()


def change_password(db: Session, user: User, payload: ChangePasswordIn) -> None:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="current password is incorrect",
        )
    user.password_hash = hash_password(payload.new_password)
    db.commit()
