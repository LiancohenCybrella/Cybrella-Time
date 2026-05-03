from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.allowed_email import AllowedEmail
from app.models.user import User


def _query_by_email(db: Session, email: str):
    return db.query(AllowedEmail).filter(
        func.lower(AllowedEmail.email) == email.lower()
    )


def lookup(db: Session, email: str) -> AllowedEmail | None:
    return _query_by_email(db, email).one_or_none()


def is_email_allowed(db: Session, email: str) -> bool:
    if email.lower() == settings.INITIAL_ADMIN_EMAIL.lower():
        return True
    return lookup(db, email) is not None


def resolve_role(db: Session, email: str) -> str:
    if email.lower() == settings.INITIAL_ADMIN_EMAIL.lower():
        return "admin"
    entry = lookup(db, email)
    return entry.default_role if entry is not None else "user"


def list_entries(db: Session) -> list[AllowedEmail]:
    return db.query(AllowedEmail).order_by(AllowedEmail.created_at.desc()).all()


def add_entry(
    db: Session,
    *,
    email: str,
    default_role: str,
    note: str | None,
    admin: User,
) -> AllowedEmail:
    if lookup(db, email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="email already allowed",
        )
    entry = AllowedEmail(
        email=email,
        default_role=default_role,
        note=note,
        created_by_user_id=admin.id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def update_entry(
    db: Session,
    *,
    entry_id: int,
    default_role: str | None,
    note: str | None,
) -> AllowedEmail:
    entry = db.get(AllowedEmail, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="not found"
        )
    if default_role is not None:
        entry.default_role = default_role
    if note is not None:
        entry.note = note
    db.commit()
    db.refresh(entry)
    return entry


def remove_entry(db: Session, entry_id: int) -> None:
    entry = db.get(AllowedEmail, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="not found"
        )
    db.delete(entry)
    db.commit()
