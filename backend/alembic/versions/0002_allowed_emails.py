"""allowed emails table + drop hardcoded domain check

Revision ID: 0002_allowed_emails
Revises: 0001_initial
Create Date: 2026-04-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_allowed_emails"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_domain_check")

    op.create_table(
        "allowed_emails",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.dialects.postgresql.CITEXT(), nullable=False),
        sa.Column(
            "default_role",
            sa.String(),
            nullable=False,
            server_default=sa.text("'user'"),
        ),
        sa.Column("note", sa.String(), nullable=True),
        sa.Column(
            "created_by_user_id",
            sa.BigInteger(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("email", name="uq_allowed_emails_email"),
        sa.CheckConstraint(
            "default_role IN ('user', 'admin')",
            name="allowed_emails_default_role_check",
        ),
    )


def downgrade() -> None:
    op.drop_table("allowed_emails")
    op.create_check_constraint(
        "users_email_domain_check",
        "users",
        "email ~* '^[^@]+@cybrella\\.io$'",
    )
