"""Photo domain models."""

from __future__ import annotations

import datetime
import uuid
from enum import Enum
from typing import Any

from sqlalchemy import JSON, Column, Date, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field, SQLModel


class PhotoVisibility(str, Enum):
    """Photo visibility options."""

    PRIVATE = "private"
    COACH_ONLY = "coach_only"


class ProgressPhoto(SQLModel, table=True):
    """Progress photo metadata storage."""

    __tablename__ = "progress_photo"
    __table_args__ = (
        Index("ix_progress_photo_user_id", "user_id"),
        Index("ix_progress_photo_user_date", "user_id", "date"),
        Index("ix_progress_photo_s3_key", "s3_key", unique=True),
    )

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
    date: datetime.date = Field(
        sa_column=Column(Date, nullable=False),
    )
    s3_key: str = Field(
        sa_column=Column(String(500), unique=True, nullable=False),
    )
    content_hash: str | None = Field(
        default=None,
        sa_column=Column(String(64), nullable=True),
    )
    visibility: PhotoVisibility = Field(default=PhotoVisibility.PRIVATE)
    photo_metadata: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
