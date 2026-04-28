from datetime import date, datetime, time

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    Time,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    check_in: Mapped[time | None] = mapped_column(Time, nullable=True)
    check_out: Mapped[time | None] = mapped_column(Time, nullable=True)
    day_type: Mapped[str] = mapped_column(String, nullable=False)
    note: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, server_default=text("'draft'"))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    user = relationship("User", back_populates="attendance_records")

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_attendance_user_date"),
        CheckConstraint(
            "day_type IN ('work', 'vacation', 'sick', 'reserve', 'holiday', 'other_absence')",
            name="attendance_day_type_check",
        ),
        CheckConstraint(
            "status IN ('draft', 'submitted', 'approved', 'rejected')",
            name="attendance_status_check",
        ),
        Index("ix_attendance_user_date", "user_id", "date"),
        Index("ix_attendance_date", "date"),
        Index("ix_attendance_status", "status"),
    )
