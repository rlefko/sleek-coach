"""Create user consent tracking table.

Revision ID: 0007_consent_tracking
Revises: 0006_performance_indexes
Create Date: 2024-12-10

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0007_consent_tracking"
down_revision: str | None = "0006_performance_indexes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create user consent tracking table."""
    # Create user_consent table
    op.create_table(
        "user_consent",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "consent_type",
            sa.String(50),
            nullable=False,
        ),
        sa.Column(
            "granted",
            sa.Boolean(),
            nullable=False,
            server_default="true",
        ),
        sa.Column(
            "version",
            sa.String(20),
            nullable=False,
        ),
        sa.Column(
            "granted_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "revoked_at",
            sa.DateTime(),
            nullable=True,
        ),
        sa.Column(
            "ip_address",
            sa.String(45),
            nullable=True,
        ),
        sa.Column(
            "user_agent",
            sa.String(500),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    # Index on user_id for efficient queries
    op.create_index("ix_user_consent_user_id", "user_consent", ["user_id"])
    # Unique constraint to ensure one active consent per type per user
    op.create_index(
        "ix_user_consent_user_type_unique",
        "user_consent",
        ["user_id", "consent_type"],
        unique=True,
    )


def downgrade() -> None:
    """Drop user consent tracking table."""
    op.drop_index("ix_user_consent_user_type_unique", table_name="user_consent")
    op.drop_index("ix_user_consent_user_id", table_name="user_consent")
    op.drop_table("user_consent")
