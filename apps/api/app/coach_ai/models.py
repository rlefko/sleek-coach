"""AI Coach database models."""

from __future__ import annotations

import datetime
import uuid
from enum import Enum
from typing import Any

from sqlalchemy import Column, ForeignKey, Index, Integer, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlmodel import Field, SQLModel


class SessionStatus(str, Enum):
    """AI session status."""

    ACTIVE = "active"
    COMPLETED = "completed"
    EXPIRED = "expired"


class ToolCallStatus(str, Enum):
    """Tool call execution status."""

    SUCCESS = "success"
    FAILED = "failed"
    BLOCKED = "blocked"


class PolicyViolationType(str, Enum):
    """Types of policy violations."""

    CALORIE_MINIMUM = "calorie_minimum"
    CALORIE_MAXIMUM = "calorie_maximum"
    PROTEIN_MINIMUM = "protein_minimum"
    WEIGHT_LOSS_RATE = "weight_loss_rate"
    EATING_DISORDER_SIGNAL = "eating_disorder_signal"
    MEDICAL_CLAIM = "medical_claim"
    UNSAFE_CONTENT = "unsafe_content"


class AISession(SQLModel, table=True):
    """AI conversation session tracking."""

    __tablename__ = "ai_session"
    __table_args__ = (Index("ix_ai_session_user_id", "user_id"),)

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, nullable=False),
    )
    user_id: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    status: SessionStatus = Field(default=SessionStatus.ACTIVE)
    started_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
    last_message_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
    )
    message_count: int = Field(
        default=0,
        sa_column=Column(Integer, nullable=False, server_default="0"),
    )
    tokens_used: int = Field(
        default=0,
        sa_column=Column(Integer, nullable=False, server_default="0"),
    )
    model_tier: str = Field(default="standard", max_length=20)
    context_summary: str | None = Field(default=None, sa_column=Column(Text))
    conversation_history: list[dict[str, str]] | None = Field(default=None, sa_column=Column(JSONB))
    session_metadata: dict[str, str] | None = Field(
        default=None, sa_column=Column(JSONB, name="metadata")
    )
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )


class AIToolCallLog(SQLModel, table=True):
    """Log of AI tool calls for auditability and debugging."""

    __tablename__ = "ai_tool_call_log"
    __table_args__ = (
        Index("ix_ai_tool_call_log_session_id", "session_id"),
        Index("ix_ai_tool_call_log_user_id", "user_id"),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, nullable=False),
    )
    session_id: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("ai_session.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    user_id: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    tool_name: str = Field(max_length=100)
    tool_category: str = Field(max_length=50)
    input_hash: str = Field(max_length=64)
    input_summary: str | None = Field(default=None, max_length=500)
    output_summary: str | None = Field(default=None, sa_column=Column(Text))
    status: ToolCallStatus = Field(default=ToolCallStatus.SUCCESS)
    error_message: str | None = Field(default=None, max_length=500)
    latency_ms: int = Field(default=0)
    cached: bool = Field(default=False)
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )


class AIPolicyViolationLog(SQLModel, table=True):
    """Log of safety policy violations for monitoring."""

    __tablename__ = "ai_policy_violation_log"
    __table_args__ = (Index("ix_ai_policy_violation_log_user_id", "user_id"),)

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, nullable=False),
    )
    session_id: uuid.UUID | None = Field(
        default=None,
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("ai_session.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    user_id: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    violation_type: PolicyViolationType
    severity: str = Field(max_length=20)
    trigger_content: str | None = Field(default=None, sa_column=Column(Text))
    action_taken: str = Field(max_length=100)
    details: dict[str, Any] | None = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
