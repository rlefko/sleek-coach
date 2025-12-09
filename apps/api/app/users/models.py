"""User domain models."""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import JSON, Column, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field, Relationship, SQLModel


class Sex(str, Enum):
    """Biological sex options."""

    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class ActivityLevel(str, Enum):
    """Activity level options."""

    SEDENTARY = "sedentary"
    LIGHT = "light"
    MODERATE = "moderate"
    ACTIVE = "active"
    VERY_ACTIVE = "very_active"


class GoalType(str, Enum):
    """User goal type options."""

    FAT_LOSS = "fat_loss"
    MUSCLE_GAIN = "muscle_gain"
    RECOMP = "recomp"
    MAINTENANCE = "maintenance"
    PERFORMANCE = "performance"


class PacePreference(str, Enum):
    """Weight change pace preferences."""

    SLOW = "slow"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"


class DietType(str, Enum):
    """Dietary restriction types."""

    NONE = "none"
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    PESCATARIAN = "pescatarian"
    KETO = "keto"
    PALEO = "paleo"
    HALAL = "halal"
    KOSHER = "kosher"


class User(SQLModel, table=True):
    """Core user table for authentication."""

    __tablename__ = "user"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, nullable=False),
    )
    email: str = Field(
        sa_column=Column(String(255), unique=True, index=True, nullable=False),
    )
    hashed_password: str = Field(
        sa_column=Column(String(255), nullable=False),
    )
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )

    # Relationships - use Optional["ClassName"] for SQLAlchemy registry compatibility
    profile: Optional["UserProfile"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"uselist": False, "lazy": "selectin"},
    )
    goal: Optional["UserGoal"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"uselist": False, "lazy": "selectin"},
    )
    diet_preferences: Optional["DietPreferences"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"uselist": False, "lazy": "selectin"},
    )


class UserProfile(SQLModel, table=True):
    """Extended user profile information."""

    __tablename__ = "user_profile"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, nullable=False),
    )
    user_id: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("user.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
    )
    display_name: str | None = Field(default=None, max_length=100)
    height_cm: float | None = Field(default=None, ge=50, le=300)
    sex: Sex | None = Field(default=None)
    birth_year: int | None = Field(default=None, ge=1900, le=2100)
    activity_level: ActivityLevel | None = Field(default=None)
    timezone: str = Field(default="UTC", max_length=50)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )

    # Relationship
    user: User = Relationship(back_populates="profile")


class UserGoal(SQLModel, table=True):
    """User fitness goals."""

    __tablename__ = "user_goal"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, nullable=False),
    )
    user_id: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("user.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
    )
    goal_type: GoalType = Field(default=GoalType.MAINTENANCE)
    target_weight_kg: float | None = Field(default=None, ge=20, le=500)
    pace_preference: PacePreference = Field(default=PacePreference.MODERATE)
    target_date: datetime | None = Field(default=None)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )

    # Relationship
    user: User = Relationship(back_populates="goal")


class DietPreferences(SQLModel, table=True):
    """User dietary preferences."""

    __tablename__ = "diet_preferences"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, nullable=False),
    )
    user_id: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("user.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
    )
    diet_type: DietType = Field(default=DietType.NONE)
    # Use JSON for cross-database compatibility (works with both SQLite and PostgreSQL)
    allergies: list[str] | None = Field(default_factory=list, sa_column=Column(JSON))
    disliked_foods: list[str] | None = Field(default_factory=list, sa_column=Column(JSON))
    meals_per_day: int = Field(default=3, ge=1, le=10)
    macro_targets: dict[str, int] | None = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )

    # Relationship
    user: User = Relationship(back_populates="diet_preferences")
