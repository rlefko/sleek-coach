"""Create check-in and progress photo tables.

Revision ID: 0003_checkins_photos
Revises: 0002_user_auth
Create Date: 2024-12-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0003_checkins_photos"
down_revision: str | None = "0002_user_auth"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create check_in and progress_photo tables."""
    # Create check_in table
    op.create_table(
        "check_in",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("weight_kg", sa.Numeric(5, 2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("energy_level", sa.SmallInteger(), nullable=True),
        sa.Column("sleep_quality", sa.SmallInteger(), nullable=True),
        sa.Column("mood", sa.SmallInteger(), nullable=True),
        sa.Column("adherence_score", sa.Numeric(3, 2), nullable=True),
        sa.Column("client_updated_at", sa.DateTime(), nullable=True),
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

    # Create indexes for check_in
    op.create_index("ix_check_in_user_id", "check_in", ["user_id"])
    op.create_index(
        "ix_check_in_user_date",
        "check_in",
        ["user_id", "date"],
        unique=True,
    )

    # Create progress_photo table
    op.create_table(
        "progress_photo",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("s3_key", sa.String(500), unique=True, nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=True),
        sa.Column(
            "visibility",
            sa.String(20),
            nullable=False,
            server_default="private",
        ),
        sa.Column("photo_metadata", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    # Create indexes for progress_photo
    op.create_index("ix_progress_photo_user_id", "progress_photo", ["user_id"])
    op.create_index(
        "ix_progress_photo_user_date",
        "progress_photo",
        ["user_id", "date"],
    )
    op.create_index(
        "ix_progress_photo_s3_key",
        "progress_photo",
        ["s3_key"],
        unique=True,
    )


def downgrade() -> None:
    """Drop check_in and progress_photo tables."""
    op.drop_index("ix_progress_photo_s3_key", table_name="progress_photo")
    op.drop_index("ix_progress_photo_user_date", table_name="progress_photo")
    op.drop_index("ix_progress_photo_user_id", table_name="progress_photo")
    op.drop_table("progress_photo")

    op.drop_index("ix_check_in_user_date", table_name="check_in")
    op.drop_index("ix_check_in_user_id", table_name="check_in")
    op.drop_table("check_in")
