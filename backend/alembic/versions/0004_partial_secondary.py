"""attendance partial-day secondary type

Revision ID: 0004_partial_secondary
Revises: 0003_full_day_activity
Create Date: 2026-04-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004_partial_secondary"
down_revision: Union[str, None] = "0003_full_day_activity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "attendance_records",
        sa.Column("partial_secondary_type", sa.String(), nullable=True),
    )
    op.create_check_constraint(
        "attendance_partial_secondary_type_check",
        "attendance_records",
        "partial_secondary_type IS NULL OR partial_secondary_type IN ("
        "'work', 'vacation', 'sick', 'reserve', 'holiday', 'other_absence', "
        "'full_day_activity')",
    )
    op.create_check_constraint(
        "attendance_partial_secondary_distinct_check",
        "attendance_records",
        "partial_secondary_type IS NULL OR partial_secondary_type <> day_type",
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE attendance_records "
        "DROP CONSTRAINT IF EXISTS attendance_partial_secondary_distinct_check"
    )
    op.execute(
        "ALTER TABLE attendance_records "
        "DROP CONSTRAINT IF EXISTS attendance_partial_secondary_type_check"
    )
    op.drop_column("attendance_records", "partial_secondary_type")
