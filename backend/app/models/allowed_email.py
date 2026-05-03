from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func, text
from sqlalchemy.dialects.postgresql import CITEXT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AllowedEmail(Base):
    __tablename__ = "allowed_emails"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(CITEXT, unique=True, nullable=False)
    default_role: Mapped[str] = mapped_column(
        String, nullable=False, server_default=text("'user'")
    )
    note: Mapped[str | None] = mapped_column(String, nullable=True)
    created_by_user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    created_by = relationship("User", foreign_keys=[created_by_user_id])
