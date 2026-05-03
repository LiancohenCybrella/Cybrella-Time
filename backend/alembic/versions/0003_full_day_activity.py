"""extend attendance day_type with full_day_activity

Revision ID: 0003_full_day_activity
Revises: 0002_allowed_emails
Create Date: 2026-04-29

"""
from typing import Sequence, Union

from alembic import op


revision: str = "0003_full_day_activity"
down_revision: Union[str, None] = "0002_allowed_emails"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE attendance_records "
        "DROP CONSTRAINT IF EXISTS attendance_day_type_check"
    )
    op.create_check_constraint(
        "attendance_day_type_check",
        "attendance_records",
        "day_type IN ('work', 'vacation', 'sick', 'reserve', 'holiday', "
        "'other_absence', 'full_day_activity')",
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE attendance_records "
        "DROP CONSTRAINT IF EXISTS attendance_day_type_check"
    )
    op.create_check_constraint(
        "attendance_day_type_check",
        "attendance_records",
        "day_type IN ('work', 'vacation', 'sick', 'reserve', 'holiday', 'other_absence')",
    )
