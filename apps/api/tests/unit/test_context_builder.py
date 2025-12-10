"""Unit tests for ContextBuilder and CoachContext."""

import uuid
from datetime import datetime
from unittest.mock import AsyncMock

import pytest

from app.coach_ai.context_builder import CoachContext, ContextBuilder
from app.coach_ai.policies.base import UserContext


class TestCoachContext:
    """Tests for CoachContext dataclass."""

    @pytest.fixture
    def sample_context(self) -> CoachContext:
        """Create a sample coach context."""
        return CoachContext(
            user_id=uuid.uuid4(),
            user_profile={
                "display_name": "Test User",
                "height_cm": 175.0,
                "sex": "male",
                "birth_year": 1990,
                "activity_level": "moderate",
            },
            user_goal={
                "goal_type": "fat_loss",
                "target_weight_kg": 75.0,
                "pace_preference": "moderate",
            },
            diet_preferences={
                "diet_type": "balanced",
                "allergies": ["nuts"],
                "disliked_foods": ["broccoli"],
                "meals_per_day": 3,
            },
            recent_checkins=[
                {"date": "2024-01-15", "weight_kg": 80.0, "energy_level": 7},
                {"date": "2024-01-14", "weight_kg": 80.2, "energy_level": 6},
            ],
            recent_nutrition=[
                {"date": "2024-01-15", "calories": 2000, "protein_g": 150.0},
            ],
            weight_trend={
                "weekly_rate_of_change_kg": -0.5,
                "current_weight_kg": 80.0,
                "start_weight_kg": 82.0,
            },
            adherence_metrics={
                "checkin_completion_rate": 0.85,
                "current_streak": 5,
            },
            calculated_targets={
                "target_calories": 2000,
                "protein_g": 150,
                "tdee": 2500,
            },
        )

    @pytest.fixture
    def minimal_context(self) -> CoachContext:
        """Create a minimal coach context."""
        return CoachContext(user_id=uuid.uuid4())

    def test_to_policy_context_full(self, sample_context: CoachContext) -> None:
        """Test converting full context to policy context."""
        policy_ctx = sample_context.to_policy_context()

        assert isinstance(policy_ctx, UserContext)
        assert policy_ctx.user_id == str(sample_context.user_id)
        assert policy_ctx.sex == "male"
        assert policy_ctx.age == datetime.now().year - 1990
        assert policy_ctx.current_weight_kg == 80.0
        assert policy_ctx.goal_type == "fat_loss"
        assert policy_ctx.target_calories == 2000
        assert policy_ctx.target_weight_kg == 75.0

    def test_to_policy_context_minimal(self, minimal_context: CoachContext) -> None:
        """Test converting minimal context to policy context."""
        policy_ctx = minimal_context.to_policy_context()

        assert isinstance(policy_ctx, UserContext)
        assert policy_ctx.user_id == str(minimal_context.user_id)
        assert policy_ctx.sex is None
        assert policy_ctx.age is None
        assert policy_ctx.current_weight_kg is None

    def test_calculate_age_with_birth_year(self, sample_context: CoachContext) -> None:
        """Test age calculation with birth year."""
        age = sample_context._calculate_age()
        expected_age = datetime.now().year - 1990
        assert age == expected_age

    def test_calculate_age_without_birth_year(self, minimal_context: CoachContext) -> None:
        """Test age calculation without birth year."""
        age = minimal_context._calculate_age()
        assert age is None

    def test_get_current_weight_from_trend(self, sample_context: CoachContext) -> None:
        """Test getting weight from weight trend."""
        weight = sample_context._get_current_weight()
        assert weight == 80.0

    def test_get_current_weight_from_checkins(self) -> None:
        """Test getting weight from recent check-ins when no trend."""
        context = CoachContext(
            user_id=uuid.uuid4(),
            recent_checkins=[
                {"date": "2024-01-15", "weight_kg": 79.5},
                {"date": "2024-01-14", "weight_kg": 80.0},
            ],
        )
        weight = context._get_current_weight()
        assert weight == 79.5  # First checkin with weight

    def test_get_current_weight_no_data(self, minimal_context: CoachContext) -> None:
        """Test getting weight when no data available."""
        weight = minimal_context._get_current_weight()
        assert weight is None

    def test_get_context_summary_full(self, sample_context: CoachContext) -> None:
        """Test context summary generation."""
        summary = sample_context.get_context_summary()

        assert "Test User" in summary
        assert "175" in summary
        assert "male" in summary
        assert "fat_loss" in summary
        assert "80" in summary  # Current weight
        assert "0.50" in summary  # Rate of change
        assert "85%" in summary  # Adherence rate
        assert "5 days" in summary  # Streak

    def test_get_context_summary_minimal(self, minimal_context: CoachContext) -> None:
        """Test context summary with minimal data."""
        summary = minimal_context.get_context_summary()
        # Should return empty or minimal string
        assert summary == "" or "User" not in summary

    def test_get_context_summary_weight_trend_up(self) -> None:
        """Test context summary with weight trending up."""
        context = CoachContext(
            user_id=uuid.uuid4(),
            weight_trend={
                "weekly_rate_of_change_kg": 0.3,
                "current_weight_kg": 80.0,
            },
        )
        summary = context.get_context_summary()
        assert "gaining" in summary

    def test_get_context_summary_weight_trend_down(self) -> None:
        """Test context summary with weight trending down."""
        context = CoachContext(
            user_id=uuid.uuid4(),
            weight_trend={
                "weekly_rate_of_change_kg": -0.5,
                "current_weight_kg": 80.0,
            },
        )
        summary = context.get_context_summary()
        assert "losing" in summary


class TestContextBuilder:
    """Tests for ContextBuilder class."""

    @pytest.fixture
    def mock_session(self) -> AsyncMock:
        """Create a mock database session."""
        return AsyncMock()

    @pytest.fixture
    def builder(self, mock_session: AsyncMock) -> ContextBuilder:
        """Create a ContextBuilder instance."""
        return ContextBuilder(mock_session)

    def test_init(self, builder: ContextBuilder, mock_session: AsyncMock) -> None:
        """Test ContextBuilder initialization."""
        assert builder.session is mock_session

    @pytest.mark.asyncio
    async def test_build_context_creates_coach_context(
        self, builder: ContextBuilder
    ) -> None:
        """Test that build_context returns CoachContext."""
        from unittest.mock import patch

        user_id = uuid.uuid4()

        # Mock all loader methods
        with patch.object(builder, "_load_user_data", new_callable=AsyncMock):
            with patch.object(builder, "_load_checkins", new_callable=AsyncMock):
                with patch.object(builder, "_load_weight_trend", new_callable=AsyncMock):
                    with patch.object(builder, "_load_nutrition", new_callable=AsyncMock):
                        with patch.object(builder, "_load_adherence", new_callable=AsyncMock):
                            with patch.object(builder, "_load_targets", new_callable=AsyncMock):
                                context = await builder.build_context(user_id)

        assert isinstance(context, CoachContext)
        assert context.user_id == user_id

    @pytest.mark.asyncio
    async def test_build_context_calls_all_loaders(
        self, builder: ContextBuilder
    ) -> None:
        """Test that build_context calls all loader methods."""
        from unittest.mock import patch

        user_id = uuid.uuid4()

        with patch.object(builder, "_load_user_data", new_callable=AsyncMock) as mock_load_user:
            with patch.object(builder, "_load_checkins", new_callable=AsyncMock) as mock_load_checkins:
                with patch.object(builder, "_load_weight_trend", new_callable=AsyncMock) as mock_load_trend:
                    with patch.object(builder, "_load_nutrition", new_callable=AsyncMock) as mock_load_nutrition:
                        with patch.object(builder, "_load_adherence", new_callable=AsyncMock) as mock_load_adherence:
                            with patch.object(builder, "_load_targets", new_callable=AsyncMock) as mock_load_targets:
                                await builder.build_context(user_id)

                                mock_load_user.assert_called_once()
                                mock_load_checkins.assert_called_once()
                                mock_load_trend.assert_called_once()
                                mock_load_nutrition.assert_called_once()
                                mock_load_adherence.assert_called_once()
                                mock_load_targets.assert_called_once()

    @pytest.mark.asyncio
    async def test_build_context_respects_flags(
        self, builder: ContextBuilder
    ) -> None:
        """Test that build_context respects include flags."""
        from unittest.mock import patch

        user_id = uuid.uuid4()

        with patch.object(builder, "_load_user_data", new_callable=AsyncMock):
            with patch.object(builder, "_load_checkins", new_callable=AsyncMock):
                with patch.object(builder, "_load_weight_trend", new_callable=AsyncMock) as mock_load_trend:
                    with patch.object(builder, "_load_nutrition", new_callable=AsyncMock) as mock_load_nutrition:
                        with patch.object(builder, "_load_adherence", new_callable=AsyncMock) as mock_load_adherence:
                            with patch.object(builder, "_load_targets", new_callable=AsyncMock) as mock_load_targets:
                                await builder.build_context(
                                    user_id,
                                    include_nutrition=False,
                                    include_weight_trend=False,
                                    include_adherence=False,
                                    include_targets=False,
                                )

                                mock_load_trend.assert_not_called()
                                mock_load_nutrition.assert_not_called()
                                mock_load_adherence.assert_not_called()
                                mock_load_targets.assert_not_called()

    @pytest.mark.asyncio
    async def test_load_adherence_calculates_streak(
        self, builder: ContextBuilder
    ) -> None:
        """Test that _load_adherence calculates streak correctly."""
        from datetime import date, timedelta

        context = CoachContext(user_id=uuid.uuid4())

        # Create checkins for consecutive days
        today = date.today()
        context.recent_checkins = [
            {"date": str(today), "weight_kg": 80.0},
            {"date": str(today - timedelta(days=1)), "weight_kg": 80.1},
            {"date": str(today - timedelta(days=2)), "weight_kg": 80.2},
            # Gap here
            {"date": str(today - timedelta(days=5)), "weight_kg": 80.5},
        ]

        await builder._load_adherence(context, days=14)

        assert context.adherence_metrics is not None
        assert context.adherence_metrics["current_streak"] == 3

    @pytest.mark.asyncio
    async def test_load_adherence_calculates_rates(
        self, builder: ContextBuilder
    ) -> None:
        """Test that _load_adherence calculates completion rates."""
        context = CoachContext(user_id=uuid.uuid4())
        context.recent_checkins = [
            {"date": "2024-01-15", "weight_kg": 80.0},
            {"date": "2024-01-14", "weight_kg": None},  # No weight
            {"date": "2024-01-13", "weight_kg": 80.2},
        ]
        context.recent_nutrition = [
            {"date": "2024-01-15", "calories": 2000},
            {"date": "2024-01-14", "calories": 1800},
        ]

        await builder._load_adherence(context, days=14)

        assert context.adherence_metrics is not None
        # 3 checkins / 14 days
        assert context.adherence_metrics["checkin_completion_rate"] == round(3 / 14, 2)
        # 2 with weight / 14 days
        assert context.adherence_metrics["weight_logging_rate"] == round(2 / 14, 2)
        # 2 nutrition days / 14 days
        assert context.adherence_metrics["nutrition_logging_rate"] == round(2 / 14, 2)
