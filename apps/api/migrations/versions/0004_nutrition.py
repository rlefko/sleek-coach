"""Create nutrition_day table.

Revision ID: 0004_nutrition
Revises: 0003_checkins_photos
Create Date: 2024-12-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0004_nutrition"
down_revision: str | None = "0003_checkins_photos"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create nutrition_day table."""
    op.create_table(
        "nutrition_day",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("calories", sa.Integer(), nullable=True),
        sa.Column("protein_g", sa.Numeric(6, 2), nullable=True),
        sa.Column("carbs_g", sa.Numeric(6, 2), nullable=True),
        sa.Column("fat_g", sa.Numeric(6, 2), nullable=True),
        sa.Column("fiber_g", sa.Numeric(5, 2), nullable=True),
        sa.Column(
            "source",
            sa.String(20),
            nullable=False,
            server_default="manual",
        ),
        sa.Column("notes", sa.Text(), nullable=True),
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

    # Create indexes
    op.create_index("ix_nutrition_day_user_id", "nutrition_day", ["user_id"])
    op.create_index(
        "ix_nutrition_day_user_date",
        "nutrition_day",
        ["user_id", "date"],
        unique=True,
    )


def downgrade() -> None:
    """Drop nutrition_day table."""
    op.drop_index("ix_nutrition_day_user_date", table_name="nutrition_day")
    op.drop_index("ix_nutrition_day_user_id", table_name="nutrition_day")
    op.drop_table("nutrition_day")
