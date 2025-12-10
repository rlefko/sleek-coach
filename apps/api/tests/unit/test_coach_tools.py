"""Unit tests for Coach AI tools."""

import uuid
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.coach_ai.tools.adherence_tools import GetAdherenceMetricsTool
from app.coach_ai.tools.base import ToolResult
from app.coach_ai.tools.user_tools import GetUserProfileTool


class TestGetUserProfileTool:
    """Tests for GetUserProfileTool."""

    @pytest.fixture
    def mock_session(self) -> AsyncMock:
        """Create a mock database session."""
        return AsyncMock(spec=AsyncSession)

    @pytest.fixture
    def tool(self, mock_session: AsyncMock) -> GetUserProfileTool:
        """Create a GetUserProfileTool instance."""
        return GetUserProfileTool(mock_session)

    def test_tool_metadata(self, tool: GetUserProfileTool) -> None:
        """Test tool metadata."""
        assert tool.name == "get_user_profile"
        assert tool.category == "internal"
        assert tool.requires_consent is False
        assert tool.cacheable is True

    def test_get_parameters_schema(self, tool: GetUserProfileTool) -> None:
        """Test parameters schema is empty."""
        schema = tool.get_parameters_schema()
        assert schema["type"] == "object"
        assert schema["properties"] == {}
        assert schema["required"] == []

    @pytest.mark.asyncio
    async def test_execute_user_not_found(self, tool: GetUserProfileTool) -> None:
        """Test execute when user not found."""
        user_id = str(uuid.uuid4())

        with patch("app.users.service.UserService") as mock_svc:
            mock_svc.return_value.get_user_with_relations = AsyncMock(return_value=None)
            result = await tool.execute(user_id)

        assert result.success is False
        assert result.error == "User not found"

    @pytest.mark.asyncio
    async def test_execute_user_with_full_profile(self, tool: GetUserProfileTool) -> None:
        """Test execute with user that has all relations."""
        user_id = str(uuid.uuid4())

        # Create mock user with full profile
        mock_user = MagicMock()
        mock_user.email = "test@example.com"
        mock_user.is_verified = True

        mock_user.profile = MagicMock()
        mock_user.profile.display_name = "Test User"
        mock_user.profile.height_cm = 175.0
        mock_user.profile.sex = MagicMock(value="male")
        mock_user.profile.birth_year = 1990
        mock_user.profile.activity_level = MagicMock(value="moderate")
        mock_user.profile.timezone = "America/New_York"

        mock_user.goal = MagicMock()
        mock_user.goal.goal_type = MagicMock(value="fat_loss")
        mock_user.goal.target_weight_kg = 75.0
        mock_user.goal.pace_preference = MagicMock(value="moderate")
        mock_user.goal.target_date = date(2024, 12, 31)

        mock_user.diet_preferences = MagicMock()
        mock_user.diet_preferences.diet_type = MagicMock(value="balanced")
        mock_user.diet_preferences.allergies = ["nuts"]
        mock_user.diet_preferences.disliked_foods = ["broccoli"]
        mock_user.diet_preferences.meals_per_day = 3
        mock_user.diet_preferences.macro_targets = {"protein": 150}

        with patch("app.users.service.UserService") as mock_svc:
            mock_svc.return_value.get_user_with_relations = AsyncMock(
                return_value=mock_user
            )
            result = await tool.execute(user_id)

        assert result.success is True
        assert result.data["email"] == "test@example.com"
        assert result.data["profile"]["display_name"] == "Test User"
        assert result.data["goal"]["goal_type"] == "fat_loss"
        assert result.data["diet_preferences"]["allergies"] == ["nuts"]

    @pytest.mark.asyncio
    async def test_execute_user_minimal_profile(self, tool: GetUserProfileTool) -> None:
        """Test execute with user that has minimal data."""
        user_id = str(uuid.uuid4())

        mock_user = MagicMock()
        mock_user.email = "test@example.com"
        mock_user.is_verified = False
        mock_user.profile = None
        mock_user.goal = None
        mock_user.diet_preferences = None

        with patch("app.users.service.UserService") as mock_svc:
            mock_svc.return_value.get_user_with_relations = AsyncMock(
                return_value=mock_user
            )
            result = await tool.execute(user_id)

        assert result.success is True
        assert result.data["email"] == "test@example.com"
        assert "profile" not in result.data
        assert "goal" not in result.data

    @pytest.mark.asyncio
    async def test_execute_handles_exception(self, tool: GetUserProfileTool) -> None:
        """Test execute handles exceptions gracefully."""
        user_id = str(uuid.uuid4())

        with patch("app.users.service.UserService") as mock_svc:
            mock_svc.return_value.get_user_with_relations = AsyncMock(
                side_effect=Exception("Database error")
            )
            result = await tool.execute(user_id)

        assert result.success is False
        assert "Database error" in result.error


class TestGetAdherenceMetricsTool:
    """Tests for GetAdherenceMetricsTool."""

    @pytest.fixture
    def mock_session(self) -> AsyncMock:
        """Create a mock database session."""
        return AsyncMock(spec=AsyncSession)

    @pytest.fixture
    def tool(self, mock_session: AsyncMock) -> GetAdherenceMetricsTool:
        """Create a GetAdherenceMetricsTool instance."""
        return GetAdherenceMetricsTool(mock_session)

    def test_tool_metadata(self, tool: GetAdherenceMetricsTool) -> None:
        """Test tool metadata."""
        assert tool.name == "get_adherence_metrics"
        assert tool.category == "internal"
        assert tool.requires_consent is False
        assert tool.cacheable is True

    def test_get_parameters_schema(self, tool: GetAdherenceMetricsTool) -> None:
        """Test parameters schema defines days parameter."""
        schema = tool.get_parameters_schema()
        assert schema["type"] == "object"
        assert "days" in schema["properties"]
        assert schema["properties"]["days"]["minimum"] == 7
        assert schema["properties"]["days"]["maximum"] == 90

    @pytest.mark.asyncio
    async def test_execute_with_data(self, tool: GetAdherenceMetricsTool) -> None:
        """Test execute with check-in and nutrition data."""
        user_id = str(uuid.uuid4())

        # Create mock check-ins
        today = date.today()
        mock_checkins = [
            MagicMock(date=today, weight_kg=80.0, adherence_score=0.8),
            MagicMock(date=today - timedelta(days=1), weight_kg=80.1, adherence_score=0.9),
            MagicMock(date=today - timedelta(days=2), weight_kg=None, adherence_score=None),
        ]

        # Mock nutrition stats
        mock_nutrition_stats = {"logged_days": 5}

        with patch("app.checkins.service.CheckInService") as mock_checkin_svc:
            with patch("app.nutrition.service.NutritionService") as mock_nutrition_svc:
                mock_checkin_svc.return_value.get_by_date_range = AsyncMock(
                    return_value=(mock_checkins, 3)
                )
                mock_nutrition_svc.return_value.get_aggregated_stats = AsyncMock(
                    return_value=mock_nutrition_stats
                )

                result = await tool.execute(user_id, days=14)

        assert result.success is True
        assert result.data["days_analyzed"] == 14
        assert result.data["total_checkins"] == 3
        assert result.data["checkins_with_weight"] == 2
        assert result.data["nutrition_days_logged"] == 5
        assert result.data["current_streak"] == 3  # 3 consecutive days

    @pytest.mark.asyncio
    async def test_execute_calculates_streak_correctly(
        self, tool: GetAdherenceMetricsTool
    ) -> None:
        """Test streak calculation with gap in check-ins."""
        user_id = str(uuid.uuid4())
        today = date.today()

        # Check-ins with a gap (streak should be 1)
        mock_checkins = [
            MagicMock(date=today, weight_kg=80.0, adherence_score=None),
            # Gap on day -1
            MagicMock(date=today - timedelta(days=2), weight_kg=80.1, adherence_score=None),
            MagicMock(date=today - timedelta(days=3), weight_kg=80.2, adherence_score=None),
        ]

        with patch("app.checkins.service.CheckInService") as mock_checkin_svc:
            with patch("app.nutrition.service.NutritionService") as mock_nutrition_svc:
                mock_checkin_svc.return_value.get_by_date_range = AsyncMock(
                    return_value=(mock_checkins, 3)
                )
                mock_nutrition_svc.return_value.get_aggregated_stats = AsyncMock(
                    return_value={"logged_days": 0}
                )

                result = await tool.execute(user_id, days=7)

        assert result.success is True
        assert result.data["current_streak"] == 1  # Only today counts

    @pytest.mark.asyncio
    async def test_execute_no_checkins(self, tool: GetAdherenceMetricsTool) -> None:
        """Test execute with no check-ins."""
        user_id = str(uuid.uuid4())

        with patch("app.checkins.service.CheckInService") as mock_checkin_svc:
            with patch("app.nutrition.service.NutritionService") as mock_nutrition_svc:
                mock_checkin_svc.return_value.get_by_date_range = AsyncMock(
                    return_value=([], 0)
                )
                mock_nutrition_svc.return_value.get_aggregated_stats = AsyncMock(
                    return_value={"logged_days": 0}
                )

                result = await tool.execute(user_id, days=14)

        assert result.success is True
        assert result.data["current_streak"] == 0
        assert result.data["total_checkins"] == 0

    @pytest.mark.asyncio
    async def test_execute_handles_exception(
        self, tool: GetAdherenceMetricsTool
    ) -> None:
        """Test execute handles exceptions gracefully."""
        user_id = str(uuid.uuid4())

        with patch("app.checkins.service.CheckInService") as mock_svc:
            mock_svc.return_value.get_by_date_range = AsyncMock(
                side_effect=Exception("Database error")
            )
            result = await tool.execute(user_id, days=14)

        assert result.success is False
        assert "Database error" in result.error

    @pytest.mark.asyncio
    async def test_execute_calculates_average_adherence(
        self, tool: GetAdherenceMetricsTool
    ) -> None:
        """Test average adherence score calculation."""
        user_id = str(uuid.uuid4())
        today = date.today()

        mock_checkins = [
            MagicMock(date=today, weight_kg=80.0, adherence_score=0.8),
            MagicMock(
                date=today - timedelta(days=1), weight_kg=80.1, adherence_score=0.9
            ),
            MagicMock(
                date=today - timedelta(days=2), weight_kg=80.2, adherence_score=0.7
            ),
        ]

        with patch("app.checkins.service.CheckInService") as mock_checkin_svc:
            with patch("app.nutrition.service.NutritionService") as mock_nutrition_svc:
                mock_checkin_svc.return_value.get_by_date_range = AsyncMock(
                    return_value=(mock_checkins, 3)
                )
                mock_nutrition_svc.return_value.get_aggregated_stats = AsyncMock(
                    return_value={"logged_days": 3}
                )

                result = await tool.execute(user_id, days=14)

        assert result.success is True
        # Average of 0.8, 0.9, 0.7 = 0.8
        assert result.data["avg_adherence_score"] == 0.8


class TestToolResult:
    """Tests for ToolResult dataclass."""

    def test_success_result(self) -> None:
        """Test creating a successful result."""
        result = ToolResult(success=True, data={"key": "value"})
        assert result.success is True
        assert result.data == {"key": "value"}
        assert result.error is None

    def test_error_result(self) -> None:
        """Test creating an error result."""
        result = ToolResult(success=False, data=None, error="Something went wrong")
        assert result.success is False
        assert result.data is None
        assert result.error == "Something went wrong"
