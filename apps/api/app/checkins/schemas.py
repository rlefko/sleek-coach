"""Check-in request/response schemas."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class CheckInCreate(BaseModel):
    """Create or update check-in request."""

    date: date
    weight_kg: float | None = Field(None, ge=20, le=500)
    notes: str | None = Field(None, max_length=2000)
    energy_level: int | None = Field(None, ge=1, le=5)
    sleep_quality: int | None = Field(None, ge=1, le=5)
    mood: int | None = Field(None, ge=1, le=5)
    client_updated_at: datetime | None = None


class CheckInSyncItem(BaseModel):
    """Single check-in for sync request."""

    date: date
    weight_kg: float | None = Field(None, ge=20, le=500)
    notes: str | None = Field(None, max_length=2000)
    energy_level: int | None = Field(None, ge=1, le=5)
    sleep_quality: int | None = Field(None, ge=1, le=5)
    mood: int | None = Field(None, ge=1, le=5)
    client_updated_at: datetime


class CheckInSyncRequest(BaseModel):
    """Batch sync request."""

    checkins: list[CheckInSyncItem]


class CheckInResponse(BaseModel):
    """Check-in response."""

    id: uuid.UUID
    date: date
    weight_kg: float | None
    notes: str | None
    energy_level: int | None
    sleep_quality: int | None
    mood: int | None
    adherence_score: float | None
    client_updated_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CheckInListResponse(BaseModel):
    """List of check-ins response."""

    items: list[CheckInResponse]
    total: int
    limit: int
    offset: int


class WeightTrendData(BaseModel):
    """Weight trend data point."""

    date: date
    weight_kg: float
    moving_average_7d: float | None


class WeightTrendResponse(BaseModel):
    """Weight trend analysis response."""

    data: list[WeightTrendData]
    weekly_rate_of_change: float | None
    total_change: float | None
    start_weight: float | None
    current_weight: float | None


class CheckInSyncResult(BaseModel):
    """Single check-in sync result."""

    date: date
    status: str  # "created", "updated", "conflict", "unchanged"
    server_version: CheckInResponse | None = None


class CheckInSyncResponse(BaseModel):
    """Batch sync response."""

    results: list[CheckInSyncResult]
    conflicts: int
