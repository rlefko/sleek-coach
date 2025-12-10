"""Add performance indexes.

Revision ID: 0006_performance_indexes
Revises: 0005_ai_coach
Create Date: 2024-12-10

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0006_performance_indexes"
down_revision: str | None = "0005_ai_coach"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add performance indexes for frequently queried columns."""
    # User profile/goal/preferences tables have unique constraints on user_id
    # but explicit indexes can still help with query planning
    op.create_index("ix_user_profile_user_id", "user_profile", ["user_id"])
    op.create_index("ix_user_goal_user_id", "user_goal", ["user_id"])
    op.create_index("ix_diet_preferences_user_id", "diet_preferences", ["user_id"])

    # AI session status index for filtered queries (active sessions)
    op.create_index("ix_ai_session_status", "ai_session", ["status"])

    # AI session composite index for user's active sessions
    op.create_index(
        "ix_ai_session_user_status",
        "ai_session",
        ["user_id", "status"],
    )

    # Check-in date index for range queries without user filter
    op.create_index("ix_check_in_date", "check_in", ["date"])

    # Nutrition day date index for range queries
    op.create_index("ix_nutrition_day_date", "nutrition_day", ["date"])

    # Tool call log created_at for time-based queries
    op.create_index("ix_ai_tool_call_log_created_at", "ai_tool_call_log", ["created_at"])


def downgrade() -> None:
    """Remove performance indexes."""
    op.drop_index("ix_ai_tool_call_log_created_at", table_name="ai_tool_call_log")
    op.drop_index("ix_nutrition_day_date", table_name="nutrition_day")
    op.drop_index("ix_check_in_date", table_name="check_in")
    op.drop_index("ix_ai_session_user_status", table_name="ai_session")
    op.drop_index("ix_ai_session_status", table_name="ai_session")
    op.drop_index("ix_diet_preferences_user_id", table_name="diet_preferences")
    op.drop_index("ix_user_goal_user_id", table_name="user_goal")
    op.drop_index("ix_user_profile_user_id", table_name="user_profile")
