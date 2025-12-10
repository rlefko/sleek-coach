"""User request/response schemas."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from .models import ActivityLevel, ConsentType, DietType, GoalType, PacePreference, Sex


# Profile Schemas
class UserProfileResponse(BaseModel):
    """User profile response."""

    display_name: str | None
    height_cm: float | None
    sex: Sex | None
    birth_year: int | None
    activity_level: ActivityLevel | None
    timezone: str


class UserProfileUpdate(BaseModel):
    """User profile update request."""

    display_name: str | None = Field(None, max_length=100)
    height_cm: float | None = Field(None, ge=50, le=300)
    sex: Sex | None = None
    birth_year: int | None = Field(None, ge=1900, le=2100)
    activity_level: ActivityLevel | None = None
    timezone: str | None = Field(None, max_length=50)


# Goal Schemas
class UserGoalResponse(BaseModel):
    """User goal response."""

    goal_type: GoalType
    target_weight_kg: float | None
    pace_preference: PacePreference
    target_date: datetime | None


class UserGoalUpdate(BaseModel):
    """User goal update request."""

    goal_type: GoalType | None = None
    target_weight_kg: float | None = Field(None, ge=20, le=500)
    pace_preference: PacePreference | None = None
    target_date: datetime | None = None


# Diet Preferences Schemas
class DietPreferencesResponse(BaseModel):
    """Diet preferences response."""

    diet_type: DietType
    allergies: list[str]
    disliked_foods: list[str]
    meals_per_day: int
    macro_targets: dict[str, int] | None


class DietPreferencesUpdate(BaseModel):
    """Diet preferences update request."""

    diet_type: DietType | None = None
    allergies: list[str] | None = None
    disliked_foods: list[str] | None = None
    meals_per_day: int | None = Field(None, ge=1, le=10)
    macro_targets: dict[str, int] | None = None


# Combined User Response
class UserResponse(BaseModel):
    """Complete user response with all related data."""

    id: uuid.UUID
    email: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    profile: UserProfileResponse | None
    goal: UserGoalResponse | None
    preferences: DietPreferencesResponse | None


# Data Export Schemas
class ExportCheckIn(BaseModel):
    """Check-in data for export."""

    date: date
    weight_kg: float | None
    notes: str | None
    energy_level: int | None
    sleep_quality: int | None
    mood: int | None
    created_at: datetime


class ExportNutritionDay(BaseModel):
    """Nutrition day data for export."""

    date: date
    calories: int | None
    protein_g: float | None
    carbs_g: float | None
    fat_g: float | None
    fiber_g: float | None
    source: str
    notes: str | None
    created_at: datetime


class UserDataExport(BaseModel):
    """Complete user data export for GDPR compliance."""

    user: UserResponse
    check_ins: list[ExportCheckIn]
    nutrition_days: list[ExportNutritionDay]
    photo_count: int
    exported_at: datetime


# Consent Schemas
class ConsentResponse(BaseModel):
    """User consent response."""

    consent_type: ConsentType
    granted: bool
    version: str
    granted_at: datetime
    revoked_at: datetime | None


class ConsentRequest(BaseModel):
    """User consent grant/update request."""

    consent_type: ConsentType
    granted: bool = True


class ConsentsListResponse(BaseModel):
    """List of user consents response."""

    consents: list[ConsentResponse]
