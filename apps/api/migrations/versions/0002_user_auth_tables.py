"""Create user and auth tables.

Revision ID: 0002_user_auth
Revises: 0001_initial
Create Date: 2024-12-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0002_user_auth"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create user and auth tables."""
    # Create user table
    op.create_table(
        "user",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, default=False),
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

    # Create user_profile table
    op.create_table(
        "user_profile",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("display_name", sa.String(100), nullable=True),
        sa.Column("height_cm", sa.Float(), nullable=True),
        sa.Column("sex", sa.String(20), nullable=True),
        sa.Column("birth_year", sa.Integer(), nullable=True),
        sa.Column("activity_level", sa.String(20), nullable=True),
        sa.Column("timezone", sa.String(50), nullable=False, default="UTC"),
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

    # Create user_goal table
    op.create_table(
        "user_goal",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("goal_type", sa.String(20), nullable=False, default="maintenance"),
        sa.Column("target_weight_kg", sa.Float(), nullable=True),
        sa.Column("pace_preference", sa.String(20), nullable=False, default="moderate"),
        sa.Column("target_date", sa.DateTime(), nullable=True),
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

    # Create diet_preferences table
    op.create_table(
        "diet_preferences",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("diet_type", sa.String(20), nullable=False, default="none"),
        sa.Column("allergies", postgresql.JSONB(), nullable=True),
        sa.Column("disliked_foods", postgresql.JSONB(), nullable=True),
        sa.Column("meals_per_day", sa.Integer(), nullable=False, default=3),
        sa.Column("macro_targets", postgresql.JSONB(), nullable=True),
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

    # Create refresh_token table
    op.create_table(
        "refresh_token",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(255), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
    )

    # Create indexes
    op.create_index("ix_refresh_token_user_id", "refresh_token", ["user_id"])
    op.create_index("ix_refresh_token_token_hash", "refresh_token", ["token_hash"])


def downgrade() -> None:
    """Drop user and auth tables."""
    op.drop_index("ix_refresh_token_token_hash", table_name="refresh_token")
    op.drop_index("ix_refresh_token_user_id", table_name="refresh_token")
    op.drop_table("refresh_token")
    op.drop_table("diet_preferences")
    op.drop_table("user_goal")
    op.drop_table("user_profile")
    op.drop_table("user")
