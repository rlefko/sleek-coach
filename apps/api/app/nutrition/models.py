"""Nutrition domain models."""

from __future__ import annotations

import datetime
import uuid
from enum import Enum

from sqlalchemy import Column, Date, ForeignKey, Index, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field, SQLModel


class NutritionSource(str, Enum):
    """Source of nutrition data."""

    MANUAL = "manual"
    MFP_IMPORT = "mfp_import"


class NutritionDay(SQLModel, table=True):
    """Daily nutrition record for macro tracking."""

    __tablename__ = "nutrition_day"
    __table_args__ = (
        Index("ix_nutrition_day_user_id", "user_id"),
        Index("ix_nutrition_day_user_date", "user_id", "date", unique=True),
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
    calories: int | None = Field(
        default=None,
        sa_column=Column(Integer, nullable=True),
    )
    protein_g: float | None = Field(
        default=None,
        sa_column=Column(Numeric(6, 2), nullable=True),
    )
    carbs_g: float | None = Field(
        default=None,
        sa_column=Column(Numeric(6, 2), nullable=True),
    )
    fat_g: float | None = Field(
        default=None,
        sa_column=Column(Numeric(6, 2), nullable=True),
    )
    fiber_g: float | None = Field(
        default=None,
        sa_column=Column(Numeric(5, 2), nullable=True),
    )
    source: NutritionSource = Field(
        default=NutritionSource.MANUAL,
        sa_column=Column(String(20), nullable=False, server_default="manual"),
    )
    notes: str | None = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
    )
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
    updated_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
