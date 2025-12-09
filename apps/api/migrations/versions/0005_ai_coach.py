"""Create AI Coach tables.

Revision ID: 0005_ai_coach
Revises: 0004_nutrition
Create Date: 2024-12-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0005_ai_coach"
down_revision: str | None = "0004_nutrition"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create AI Coach tables."""
    # Create ai_session table
    op.create_table(
        "ai_session",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "started_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("last_message_at", sa.DateTime(), nullable=True),
        sa.Column("message_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tokens_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("model_tier", sa.String(20), nullable=False, server_default="standard"),
        sa.Column("context_summary", sa.Text(), nullable=True),
        sa.Column("conversation_history", postgresql.JSONB(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_ai_session_user_id", "ai_session", ["user_id"])

    # Create ai_tool_call_log table
    op.create_table(
        "ai_tool_call_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ai_session.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("tool_name", sa.String(100), nullable=False),
        sa.Column("tool_category", sa.String(50), nullable=False),
        sa.Column("input_hash", sa.String(64), nullable=False),
        sa.Column("input_summary", sa.String(500), nullable=True),
        sa.Column("output_summary", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="success"),
        sa.Column("error_message", sa.String(500), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cached", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_ai_tool_call_log_session_id", "ai_tool_call_log", ["session_id"])
    op.create_index("ix_ai_tool_call_log_user_id", "ai_tool_call_log", ["user_id"])

    # Create ai_policy_violation_log table
    op.create_table(
        "ai_policy_violation_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ai_session.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("violation_type", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("trigger_content", sa.Text(), nullable=True),
        sa.Column("action_taken", sa.String(100), nullable=False),
        sa.Column("details", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_ai_policy_violation_log_user_id", "ai_policy_violation_log", ["user_id"])


def downgrade() -> None:
    """Drop AI Coach tables."""
    # Drop ai_policy_violation_log
    op.drop_index("ix_ai_policy_violation_log_user_id", table_name="ai_policy_violation_log")
    op.drop_table("ai_policy_violation_log")

    # Drop ai_tool_call_log
    op.drop_index("ix_ai_tool_call_log_user_id", table_name="ai_tool_call_log")
    op.drop_index("ix_ai_tool_call_log_session_id", table_name="ai_tool_call_log")
    op.drop_table("ai_tool_call_log")

    # Drop ai_session
    op.drop_index("ix_ai_session_user_id", table_name="ai_session")
    op.drop_table("ai_session")
