"""AI Coach request/response schemas."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    import uuid
    from datetime import datetime


class ChatMessage(BaseModel):
    """Single chat message."""

    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime | None = None


class ToolTrace(BaseModel):
    """Trace of a tool call for explainability."""

    tool_name: str
    tool_description: str
    input_summary: str
    output_summary: str
    source_citations: list[str] | None = None
    latency_ms: int
    cached: bool = False


class DataGap(BaseModel):
    """Information about missing data that could improve response."""

    field: str
    description: str
    suggestion: str


class ChatRequest(BaseModel):
    """Request for coach chat endpoint."""

    message: str = Field(min_length=1, max_length=5000)
    session_id: uuid.UUID | None = None


class ChatResponse(BaseModel):
    """Response from coach chat endpoint."""

    message: str
    session_id: uuid.UUID
    tool_trace: list[ToolTrace] | None = None
    confidence: float = Field(ge=0.0, le=1.0)
    data_gaps: list[DataGap] | None = None
    disclaimers: list[str] | None = None
    tokens_used: int


class StreamEvent(BaseModel):
    """Single event in SSE stream."""

    type: str  # "token", "tool_start", "tool_end", "done", "error"
    data: str | dict[str, Any]


class WeeklyPlanRequest(BaseModel):
    """Request for weekly plan generation."""

    start_date: datetime | None = None
    preferences: dict[str, str] | None = None


class DailyTarget(BaseModel):
    """Daily nutrition target."""

    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int


class WeeklyPlanResponse(BaseModel):
    """Weekly plan response."""

    plan_id: uuid.UUID
    week_start: datetime
    daily_targets: DailyTarget
    focus_areas: list[str]
    recommendations: list[str]
    confidence: float


class InsightItem(BaseModel):
    """Single insight item."""

    type: str  # "trend", "achievement", "recommendation", "warning"
    title: str
    description: str
    data: dict[str, Any] | None = None
    action: str | None = None


class InsightsResponse(BaseModel):
    """Pre-computed weekly insights response."""

    generated_at: datetime
    insights: list[InsightItem]
    data_quality_score: float
