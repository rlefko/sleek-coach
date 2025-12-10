"""Coach fixtures for testing."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING

import pytest

from app.checkins.models import CheckIn
from app.coach_ai.context_builder import CoachContext
from app.coach_ai.models import AISession, SessionStatus
from app.coach_ai.policies.base import UserContext
from app.nutrition.models import NutritionDay
from app.users.models import DietPreferences, User, UserGoal, UserProfile

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
def sample_user_context() -> UserContext:
    """Create a sample user context for policy tests."""
    return UserContext(
        user_id=str(uuid.uuid4()),
        sex="male",
        age=30,
        current_weight_kg=80.0,
        goal_type="fat_loss",
        target_calories=2000,
        target_weight_kg=75.0,
    )


@pytest.fixture
def sample_user_context_female() -> UserContext:
    """Create a sample female user context for policy tests."""
    return UserContext(
        user_id=str(uuid.uuid4()),
        sex="female",
        age=28,
        current_weight_kg=65.0,
        goal_type="fat_loss",
        target_calories=1600,
        target_weight_kg=58.0,
    )


@pytest.fixture
def sample_user_context_no_weight() -> UserContext:
    """Create a user context without weight data."""
    return UserContext(
        user_id=str(uuid.uuid4()),
        sex="male",
        age=30,
        current_weight_kg=None,
        goal_type="fat_loss",
        target_calories=2000,
        target_weight_kg=None,
    )


@pytest.fixture
def sample_coach_context() -> CoachContext:
    """Create a sample coach context."""
    return CoachContext(
        user_id=str(uuid.uuid4()),
        user_profile={
            "display_name": "Test User",
            "height_cm": 175,
            "sex": "male",
            "birth_year": 1993,
            "activity_level": "moderate",
            "timezone": "America/New_York",
        },
        user_goal={
            "goal_type": "fat_loss",
            "target_weight_kg": 75.0,
            "pace_preference": "moderate",
            "target_date": None,
        },
        diet_preferences={
            "diet_type": "none",
            "allergies": [],
            "disliked_foods": [],
            "meals_per_day": 3,
        },
        recent_checkins=[
            {
                "date": str(date.today() - timedelta(days=i)),
                "weight_kg": 80.0 - (i * 0.1),
                "notes": None,
                "energy_level": 4,
                "sleep_quality": 4,
                "mood": 4,
            }
            for i in range(7)
        ],
        weight_trend={
            "start_weight": 80.7,
            "current_weight": 80.0,
            "total_change": -0.7,
            "weekly_rate_of_change_kg": -0.5,
        },
        recent_nutrition=[
            {
                "date": str(date.today() - timedelta(days=i)),
                "calories": 1800,
                "protein_g": 150,
                "carbs_g": 200,
                "fat_g": 70,
            }
            for i in range(7)
        ],
        adherence_metrics={
            "checkin_completion_rate": 0.85,
            "nutrition_logging_rate": 0.80,
            "current_streak": 5,
        },
        calculated_targets={
            "bmr": 1800,
            "tdee": 2500,
            "target_calories": 2000,
            "protein_g": 160,
            "carbs_g": 200,
            "fat_g": 67,
        },
    )


@pytest.fixture
def sample_coach_context_minimal() -> CoachContext:
    """Create a minimal coach context with limited data."""
    return CoachContext(
        user_id=str(uuid.uuid4()),
        user_profile=None,
        user_goal=None,
        diet_preferences=None,
        recent_checkins=[],
        weight_trend=None,
        recent_nutrition=[],
        adherence_metrics=None,
        calculated_targets=None,
    )


@pytest.fixture
def sample_coach_context_partial() -> CoachContext:
    """Create a partial coach context with some data missing."""
    return CoachContext(
        user_id=str(uuid.uuid4()),
        user_profile={
            "display_name": "Partial User",
            "height_cm": None,
            "sex": "female",
            "birth_year": None,
            "activity_level": None,
            "timezone": None,
        },
        user_goal={
            "goal_type": "fat_loss",
            "target_weight_kg": None,
            "pace_preference": "moderate",
            "target_date": None,
        },
        diet_preferences=None,
        recent_checkins=[
            {
                "date": str(date.today()),
                "weight_kg": 65.0,
                "notes": None,
            }
        ],
        weight_trend=None,
        recent_nutrition=[
            {
                "date": str(date.today()),
                "calories": 1400,
                "protein_g": 100,
                "carbs_g": 150,
                "fat_g": 50,
            }
        ],
        adherence_metrics={
            "checkin_completion_rate": 0.3,
            "nutrition_logging_rate": 0.2,
            "current_streak": 1,
        },
        calculated_targets=None,
    )


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user with full profile."""
    user = User(
        email="testuser@example.com",
        hashed_password="$argon2id$v=19$m=65536,t=3,p=4$hashedpassword",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Add profile
    profile = UserProfile(
        user_id=user.id,
        display_name="Test User",
        height_cm=175,
        sex="male",
        birth_year=1993,
        activity_level="moderate",
        timezone="America/New_York",
    )
    db_session.add(profile)

    # Add goal
    goal = UserGoal(
        user_id=user.id,
        goal_type="fat_loss",
        target_weight_kg=75.0,
        pace_preference="moderate",
    )
    db_session.add(goal)

    # Add diet preferences
    preferences = DietPreferences(
        user_id=user.id,
        diet_type="none",
        meals_per_day=3,
    )
    db_session.add(preferences)

    await db_session.commit()
    await db_session.refresh(user)

    return user


@pytest.fixture
async def test_user_with_checkins(
    db_session: AsyncSession, test_user: User
) -> tuple[User, list[CheckIn]]:
    """Create a test user with check-in history."""
    checkins = []
    today = date.today()

    for i in range(14):
        checkin = CheckIn(
            user_id=test_user.id,
            date=today - timedelta(days=i),
            weight_kg=80.0 - (i * 0.05),
            energy_level=4,
            sleep_quality=4,
            mood=4,
        )
        db_session.add(checkin)
        checkins.append(checkin)

    await db_session.commit()
    return test_user, checkins


@pytest.fixture
async def test_user_with_nutrition(
    db_session: AsyncSession, test_user: User
) -> tuple[User, list[NutritionDay]]:
    """Create a test user with nutrition history."""
    nutrition_days = []
    today = date.today()

    for i in range(14):
        nutrition = NutritionDay(
            user_id=test_user.id,
            date=today - timedelta(days=i),
            calories=1800 + (i % 3) * 100,
            protein_g=150,
            carbs_g=200,
            fat_g=70,
            source="manual",
        )
        db_session.add(nutrition)
        nutrition_days.append(nutrition)

    await db_session.commit()
    return test_user, nutrition_days


@pytest.fixture
async def test_ai_session(db_session: AsyncSession, test_user: User) -> AISession:
    """Create a test AI session."""
    session = AISession(
        user_id=test_user.id,
        status=SessionStatus.ACTIVE,
        message_count=0,
        tokens_used=0,
    )
    db_session.add(session)
    await db_session.commit()
    await db_session.refresh(session)
    return session


@pytest.fixture
async def test_ai_session_with_history(
    db_session: AsyncSession, test_user: User
) -> AISession:
    """Create a test AI session with conversation history."""
    session = AISession(
        user_id=test_user.id,
        status=SessionStatus.ACTIVE,
        message_count=4,
        tokens_used=500,
        last_message_at=datetime.utcnow(),
        conversation_history=[
            {"role": "user", "content": "How much protein should I eat?"},
            {"role": "assistant", "content": "Based on your goals, I recommend 150g of protein daily."},
            {"role": "user", "content": "That sounds like a lot. Is it really necessary?"},
            {"role": "assistant", "content": "Yes, for fat loss while preserving muscle, higher protein is beneficial."},
        ],
    )
    db_session.add(session)
    await db_session.commit()
    await db_session.refresh(session)
    return session
