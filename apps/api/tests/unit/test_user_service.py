"""Unit tests for UserService."""

import uuid
from datetime import date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.checkins.models import CheckIn
from app.nutrition.models import NutritionDay
from app.users.models import DietPreferences, User, UserGoal, UserProfile
from app.users.schemas import DietPreferencesUpdate, UserGoalUpdate, UserProfileUpdate
from app.users.service import UserService


class TestUserServiceInit:
    """Tests for UserService initialization."""

    def test_init_stores_session(self) -> None:
        """Test that init stores the session."""
        mock_session = AsyncMock(spec=AsyncSession)
        service = UserService(mock_session)
        assert service.session is mock_session


class TestUserServiceGetUserWithRelations:
    """Tests for UserService.get_user_with_relations method."""

    @pytest.mark.asyncio
    async def test_get_user_found(self) -> None:
        """Test getting a user that exists."""
        mock_session = AsyncMock(spec=AsyncSession)

        user = User(email="test@example.com", hashed_password="hash")
        user.id = uuid.uuid4()
        user.profile = UserProfile(user_id=user.id)
        user.goal = UserGoal(user_id=user.id)
        user.diet_preferences = DietPreferences(user_id=user.id)

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_session.execute.return_value = mock_result

        service = UserService(mock_session)
        result = await service.get_user_with_relations(user.id)

        assert result == user
        assert result.profile is not None
        assert result.goal is not None
        assert result.diet_preferences is not None

    @pytest.mark.asyncio
    async def test_get_user_not_found(self) -> None:
        """Test getting a user that doesn't exist."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        service = UserService(mock_session)
        result = await service.get_user_with_relations(uuid.uuid4())

        assert result is None


class TestUserServiceUpdateProfile:
    """Tests for UserService.update_profile method."""

    @pytest.fixture
    def mock_profile(self) -> UserProfile:
        """Create a mock user profile."""
        profile = UserProfile(user_id=uuid.uuid4())
        profile.display_name = "Old Name"
        profile.height_cm = 170.0
        return profile

    @pytest.mark.asyncio
    async def test_update_profile_success(self, mock_profile: UserProfile) -> None:
        """Test successful profile update."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = mock_profile
        mock_session.execute.return_value = mock_result

        service = UserService(mock_session)
        data = UserProfileUpdate(display_name="New Name", height_cm=175.0)

        result = await service.update_profile(mock_profile.user_id, data)

        assert result.display_name == "New Name"
        assert result.height_cm == 175.0
        assert mock_session.commit.called
        assert mock_session.refresh.called

    @pytest.mark.asyncio
    async def test_update_profile_partial(self, mock_profile: UserProfile) -> None:
        """Test partial profile update."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = mock_profile
        mock_session.execute.return_value = mock_result

        service = UserService(mock_session)
        data = UserProfileUpdate(display_name="New Name")  # Only update name

        result = await service.update_profile(mock_profile.user_id, data)

        assert result.display_name == "New Name"
        assert result.height_cm == 170.0  # Unchanged


class TestUserServiceUpdateGoal:
    """Tests for UserService.update_goal method."""

    @pytest.fixture
    def mock_goal(self) -> UserGoal:
        """Create a mock user goal."""
        goal = UserGoal(user_id=uuid.uuid4())
        goal.goal_type = "weight_loss"
        goal.target_weight_kg = 70.0
        return goal

    @pytest.mark.asyncio
    async def test_update_goal_success(self, mock_goal: UserGoal) -> None:
        """Test successful goal update."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = mock_goal
        mock_session.execute.return_value = mock_result

        service = UserService(mock_session)
        data = UserGoalUpdate(goal_type="muscle_gain", target_weight_kg=80.0)

        result = await service.update_goal(mock_goal.user_id, data)

        assert result.goal_type == "muscle_gain"
        assert result.target_weight_kg == 80.0
        assert mock_session.commit.called

    @pytest.mark.asyncio
    async def test_update_goal_partial(self, mock_goal: UserGoal) -> None:
        """Test partial goal update."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = mock_goal
        mock_session.execute.return_value = mock_result

        service = UserService(mock_session)
        data = UserGoalUpdate(target_weight_kg=75.0)  # Only update weight

        result = await service.update_goal(mock_goal.user_id, data)

        assert result.goal_type == "weight_loss"  # Unchanged
        assert result.target_weight_kg == 75.0


class TestUserServiceUpdatePreferences:
    """Tests for UserService.update_preferences method."""

    @pytest.fixture
    def mock_preferences(self) -> DietPreferences:
        """Create mock diet preferences."""
        prefs = DietPreferences(user_id=uuid.uuid4())
        prefs.diet_type = "balanced"
        prefs.meals_per_day = 3
        return prefs

    @pytest.mark.asyncio
    async def test_update_preferences_success(
        self, mock_preferences: DietPreferences
    ) -> None:
        """Test successful preferences update."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = mock_preferences
        mock_session.execute.return_value = mock_result

        service = UserService(mock_session)
        data = DietPreferencesUpdate(diet_type="keto", meals_per_day=4)

        result = await service.update_preferences(mock_preferences.user_id, data)

        assert result.diet_type == "keto"
        assert result.meals_per_day == 4
        assert mock_session.commit.called

    @pytest.mark.asyncio
    async def test_update_preferences_partial(
        self, mock_preferences: DietPreferences
    ) -> None:
        """Test partial preferences update."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = mock_preferences
        mock_session.execute.return_value = mock_result

        service = UserService(mock_session)
        data = DietPreferencesUpdate(meals_per_day=5)

        result = await service.update_preferences(mock_preferences.user_id, data)

        assert result.diet_type == "balanced"  # Unchanged
        assert result.meals_per_day == 5


class TestUserServiceExportUserData:
    """Tests for UserService.export_user_data method."""

    @pytest.mark.asyncio
    async def test_export_with_data(self) -> None:
        """Test exporting user data with check-ins and nutrition."""
        mock_session = AsyncMock(spec=AsyncSession)
        user_id = uuid.uuid4()

        # Create mock check-ins
        checkin1 = MagicMock(spec=CheckIn)
        checkin1.date = date(2024, 1, 15)
        checkin1.weight_kg = 80.0
        checkin1.notes = "Feeling good"
        checkin1.energy_level = 7
        checkin1.sleep_quality = 8
        checkin1.mood = 8
        checkin1.created_at = datetime(2024, 1, 15, 10, 0, 0)

        # Create mock nutrition days
        nutrition1 = MagicMock(spec=NutritionDay)
        nutrition1.date = date(2024, 1, 15)
        nutrition1.calories = 2000
        nutrition1.protein_g = 150.0
        nutrition1.carbs_g = 200.0
        nutrition1.fat_g = 70.0
        nutrition1.fiber_g = 25.0
        nutrition1.source = "manual"
        nutrition1.notes = "Good day"
        nutrition1.created_at = datetime(2024, 1, 15, 20, 0, 0)

        # Mock check-ins result
        checkins_result = MagicMock()
        checkins_result.scalars.return_value.all.return_value = [checkin1]

        # Mock nutrition result
        nutrition_result = MagicMock()
        nutrition_result.scalars.return_value.all.return_value = [nutrition1]

        # Mock photo count
        photo_count_result = MagicMock()
        photo_count_result.scalar.return_value = 5

        mock_session.execute.side_effect = [
            checkins_result,
            nutrition_result,
            photo_count_result,
        ]

        service = UserService(mock_session)
        checkins, nutrition, photo_count = await service.export_user_data(user_id)

        assert len(checkins) == 1
        assert checkins[0].date == date(2024, 1, 15)
        assert checkins[0].weight_kg == 80.0

        assert len(nutrition) == 1
        assert nutrition[0].date == date(2024, 1, 15)
        assert nutrition[0].calories == 2000

        assert photo_count == 5

    @pytest.mark.asyncio
    async def test_export_empty_data(self) -> None:
        """Test exporting user data when user has no data."""
        mock_session = AsyncMock(spec=AsyncSession)
        user_id = uuid.uuid4()

        # Mock empty results
        checkins_result = MagicMock()
        checkins_result.scalars.return_value.all.return_value = []

        nutrition_result = MagicMock()
        nutrition_result.scalars.return_value.all.return_value = []

        photo_count_result = MagicMock()
        photo_count_result.scalar.return_value = 0

        mock_session.execute.side_effect = [
            checkins_result,
            nutrition_result,
            photo_count_result,
        ]

        service = UserService(mock_session)
        checkins, nutrition, photo_count = await service.export_user_data(user_id)

        assert len(checkins) == 0
        assert len(nutrition) == 0
        assert photo_count == 0

    @pytest.mark.asyncio
    async def test_export_handles_none_values(self) -> None:
        """Test export handles None values in check-ins."""
        mock_session = AsyncMock(spec=AsyncSession)
        user_id = uuid.uuid4()

        # Create check-in with None values
        checkin = MagicMock(spec=CheckIn)
        checkin.date = date(2024, 1, 15)
        checkin.weight_kg = None  # No weight logged
        checkin.notes = None
        checkin.energy_level = None
        checkin.sleep_quality = None
        checkin.mood = None
        checkin.created_at = datetime(2024, 1, 15, 10, 0, 0)

        checkins_result = MagicMock()
        checkins_result.scalars.return_value.all.return_value = [checkin]

        nutrition_result = MagicMock()
        nutrition_result.scalars.return_value.all.return_value = []

        photo_count_result = MagicMock()
        photo_count_result.scalar.return_value = 0

        mock_session.execute.side_effect = [
            checkins_result,
            nutrition_result,
            photo_count_result,
        ]

        service = UserService(mock_session)
        checkins, _, _ = await service.export_user_data(user_id)

        assert len(checkins) == 1
        assert checkins[0].weight_kg is None


class TestUserServiceDeleteUser:
    """Tests for UserService.delete_user method."""

    @pytest.mark.asyncio
    async def test_delete_user_success(self) -> None:
        """Test successful user deletion."""
        mock_session = AsyncMock(spec=AsyncSession)

        user = User(email="test@example.com", hashed_password="hash")
        user.id = uuid.uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_session.execute.return_value = mock_result

        service = UserService(mock_session)
        await service.delete_user(user.id)

        mock_session.delete.assert_called_once_with(user)
        assert mock_session.commit.called

    @pytest.mark.asyncio
    async def test_delete_user_not_found(self) -> None:
        """Test deleting non-existent user (no error)."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        service = UserService(mock_session)
        await service.delete_user(uuid.uuid4())

        # Should not call delete or commit
        assert not mock_session.delete.called
        assert not mock_session.commit.called
