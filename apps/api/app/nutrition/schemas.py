"""Nutrition request/response schemas."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class NutritionDayCreate(BaseModel):
    """Create or update nutrition for a day."""

    date: date
    calories: int | None = Field(None, ge=0, le=50000)
    protein_g: float | None = Field(None, ge=0, le=2000)
    carbs_g: float | None = Field(None, ge=0, le=2000)
    fat_g: float | None = Field(None, ge=0, le=1000)
    fiber_g: float | None = Field(None, ge=0, le=500)
    notes: str | None = Field(None, max_length=2000)


class NutritionDayResponse(BaseModel):
    """Single day nutrition response."""

    id: uuid.UUID
    date: date
    calories: int | None
    protein_g: float | None
    carbs_g: float | None
    fat_g: float | None
    fiber_g: float | None
    source: str
    notes: str | None
    created_at: datetime
    updated_at: datetime


class NutritionListResponse(BaseModel):
    """List of nutrition days response."""

    items: list[NutritionDayResponse]
    total: int
    from_date: date
    to_date: date


class NutritionAggregateResponse(BaseModel):
    """Aggregated nutrition statistics response."""

    from_date: date
    to_date: date
    total_days: int
    logged_days: int
    avg_calories: float | None
    avg_protein_g: float | None
    avg_carbs_g: float | None
    avg_fat_g: float | None
    avg_fiber_g: float | None
    total_calories: int | None


class MFPImportResponse(BaseModel):
    """MFP CSV import result response."""

    total_rows: int
    imported: int
    skipped: int
    errors: list[str]
    date_range_start: date | None
    date_range_end: date | None


class MacroTargetsRequest(BaseModel):
    """Request for macro target calculation."""

    weight_kg: float = Field(ge=20, le=500)
    height_cm: float = Field(ge=50, le=300)
    age: int = Field(ge=10, le=120)
    sex: str = Field(pattern="^(male|female)$")
    activity_level: str = Field(pattern="^(sedentary|light|moderate|active|very_active)$")
    goal_type: str = Field(pattern="^(fat_loss|muscle_gain|maintenance|recomp|performance)$")
    pace: str = Field(default="moderate", pattern="^(slow|moderate|aggressive)$")


class MacroTargetsResponse(BaseModel):
    """Calculated macro targets response."""

    tdee: int
    bmr: int
    target_calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    deficit_surplus: int
    warnings: list[str]
