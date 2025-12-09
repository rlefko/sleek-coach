"""Check-in domain models."""

from __future__ import annotations

import datetime
import uuid

from sqlalchemy import Column, Date, ForeignKey, Index, Numeric, SmallInteger, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field, SQLModel


class CheckIn(SQLModel, table=True):
    """Daily check-in record for weight and wellness tracking."""

    __tablename__ = "check_in"
    __table_args__ = (
        Index("ix_check_in_user_id", "user_id"),
        Index("ix_check_in_user_date", "user_id", "date", unique=True),
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
    weight_kg: float | None = Field(
        default=None,
        sa_column=Column(Numeric(5, 2), nullable=True),
    )
    notes: str | None = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
    )
    energy_level: int | None = Field(
        default=None,
        sa_column=Column(SmallInteger, nullable=True),
    )
    sleep_quality: int | None = Field(
        default=None,
        sa_column=Column(SmallInteger, nullable=True),
    )
    mood: int | None = Field(
        default=None,
        sa_column=Column(SmallInteger, nullable=True),
    )
    adherence_score: float | None = Field(
        default=None,
        sa_column=Column(Numeric(3, 2), nullable=True),
    )
    client_updated_at: datetime.datetime | None = Field(default=None)
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
    updated_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
