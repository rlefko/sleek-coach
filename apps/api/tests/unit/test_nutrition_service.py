"""Tests for nutrition service."""

import uuid
from datetime import date, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.nutrition.models import NutritionSource
from app.nutrition.schemas import NutritionDayCreate
from app.nutrition.service import NutritionService


@pytest.fixture
def user_id() -> uuid.UUID:
    """Generate a test user ID."""
    return uuid.uuid4()


@pytest.fixture
def service(db_session: AsyncSession) -> NutritionService:
    """Create a nutrition service instance."""
    return NutritionService(db_session)


class TestCreateOrUpdate:
    """Tests for create_or_update method."""

    @pytest.mark.asyncio
    async def test_create_nutrition_day(
        self, service: NutritionService, user_id: uuid.UUID
    ) -> None:
        """Test creating a new nutrition day."""
        data = NutritionDayCreate(
            date=date.today(),
            calories=2000,
            protein_g=150.0,
            carbs_g=200.0,
            fat_g=70.0,
            fiber_g=30.0,
        )

        nutrition = await service.create_or_update(user_id, data)

        assert nutrition.id is not None
        assert nutrition.user_id == user_id
        assert nutrition.date == date.today()
        assert nutrition.calories == 2000
        assert float(nutrition.protein_g) == 150.0  # type: ignore[arg-type]
        assert float(nutrition.carbs_g) == 200.0  # type: ignore[arg-type]
        assert float(nutrition.fat_g) == 70.0  # type: ignore[arg-type]
        assert float(nutrition.fiber_g) == 30.0  # type: ignore[arg-type]
        assert nutrition.source == NutritionSource.MANUAL

    @pytest.mark.asyncio
    async def test_update_existing_nutrition_day(
        self, service: NutritionService, user_id: uuid.UUID
    ) -> None:
        """Test updating an existing nutrition day."""
        # Create initial entry
        initial_data = NutritionDayCreate(
            date=date.today(),
            calories=1800,
            protein_g=140.0,
        )
        await service.create_or_update(user_id, initial_data)

        # Update with new data
        updated_data = NutritionDayCreate(
            date=date.today(),
            calories=2000,
            protein_g=150.0,
            carbs_g=200.0,
        )
        nutrition = await service.create_or_update(user_id, updated_data)

        assert nutrition.calories == 2000
        assert float(nutrition.protein_g) == 150.0  # type: ignore[arg-type]
        assert float(nutrition.carbs_g) == 200.0  # type: ignore[arg-type]

    @pytest.mark.asyncio
    async def test_create_with_partial_data(
        self, service: NutritionService, user_id: uuid.UUID
    ) -> None:
        """Test creating nutrition with only some fields."""
        data = NutritionDayCreate(
            date=date.today(),
            calories=1500,
        )

        nutrition = await service.create_or_update(user_id, data)

        assert nutrition.calories == 1500
        assert nutrition.protein_g is None
        assert nutrition.carbs_g is None
        assert nutrition.fat_g is None

    @pytest.mark.asyncio
    async def test_create_with_notes(
        self, service: NutritionService, user_id: uuid.UUID
    ) -> None:
        """Test creating nutrition with notes."""
        data = NutritionDayCreate(
            date=date.today(),
            calories=2000,
            notes="High carb day for training",
        )

        nutrition = await service.create_or_update(user_id, data)

        assert nutrition.notes == "High carb day for training"


class TestGetByDate:
    """Tests for get_by_date method."""

    @pytest.mark.asyncio
    async def test_get_existing_date(
        self, service: NutritionService, user_id: uuid.UUID
    ) -> None:
        """Test retrieving nutrition for an existing date."""
        data = NutritionDayCreate(date=date.today(), calories=2000)
        await service.create_or_update(user_id, data)

        nutrition = await service.get_by_date(user_id, date.today())

        assert nutrition is not None
        assert nutrition.calories == 2000

    @pytest.mark.asyncio
    async def test_get_nonexistent_date(
        self, service: NutritionService, user_id: uuid.UUID
    ) -> None:
        """Test retrieving nutrition for a date that doesn't exist."""
        nutrition = await service.get_by_date(user_id, date.today())

        assert nutrition is None

    @pytest.mark.asyncio
    async def test_get_date_different_user(
        self, service: NutritionService, user_id: uuid.UUID
    ) -> None:
        """Test that nutrition is user-specific."""
        data = NutritionDayCreate(date=date.today(), calories=2000)
        await service.create_or_update(user_id, data)

        # Different user should not see the data
        other_user_id = uuid.uuid4()
        nutrition = await service.get_by_date(other_user_id, date.today())

        assert nutrition is None


class TestGetByDateRange:
    """Tests for get_by_date_range method."""

    @pytest.mark.asyncio
    async def test_get_date_range(
        self, service: NutritionService, user_id: uuid.UUID
    ) -> None:
        """Test retrieving nutrition for a date range."""
        # Create entries for multiple days
        for i in range(5):
            day = date.today() - timedelta(days=i)
            data = NutritionDayCreate(date=day, calories=2000 + i * 100)
            await service.create_or_update(user_id, data)

        # Get last 3 days
        from_date = date.today() - timedelta(days=2)
        items = await service.get_by_date_range(user_id, from_date, date.today())

        assert len(items) == 3
        # Should be ordered by date descending
        assert items[0].date == date.today()

    @pytest.mark.asyncio
    async def test_get_date_range_empty(
        self, service: NutritionService, user_id: uuid.UUID
    ) -> None:
        """Test retrieving empty date range."""
        from_date = date.today() - timedelta(days=7)
        items = await service.get_by_date_range(user_id, from_date, date.today())

        assert len(items) == 0


class TestGetAggregatedStats:
    """Tests for get_aggregated_stats method."""

    @pytest.mark.asyncio
    async def test_aggregated_stats(
        self, service: NutritionService, user_id: uuid.UUID
    ) -> None:
        """Test aggregated nutrition statistics."""
        # Create entries
        for i in range(3):
            day = date.today() - timedelta(days=i)
            data = NutritionDayCreate(
                date=day,
                calories=2000,
                protein_g=150.0,
                carbs_g=200.0,
                fat_g=70.0,
            )
            await service.create_or_update(user_id, data)

        from_date = date.today() - timedelta(days=6)
        stats = await service.get_aggregated_stats(user_id, from_date, date.today())

        assert stats["logged_days"] == 3
        assert stats["total_days"] == 7  # 7 days in range
        assert stats["avg_calories"] == 2000.0
        assert stats["avg_protein_g"] == 150.0
        assert stats["total_calories"] == 6000

    @pytest.mark.asyncio
    async def test_aggregated_stats_empty(
        self, service: NutritionService, user_id: uuid.UUID
    ) -> None:
        """Test aggregated stats for empty date range."""
        from_date = date.today() - timedelta(days=7)
        stats = await service.get_aggregated_stats(user_id, from_date, date.today())

        assert stats["logged_days"] == 0
        assert stats["avg_calories"] is None
        assert stats["total_calories"] is None


class TestDeleteByDate:
    """Tests for delete_by_date method."""

    @pytest.mark.asyncio
    async def test_delete_existing(
        self, service: NutritionService, user_id: uuid.UUID
    ) -> None:
        """Test deleting an existing nutrition day."""
        data = NutritionDayCreate(date=date.today(), calories=2000)
        await service.create_or_update(user_id, data)

        deleted = await service.delete_by_date(user_id, date.today())

        assert deleted is True
        # Verify it's gone
        nutrition = await service.get_by_date(user_id, date.today())
        assert nutrition is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent(
        self, service: NutritionService, user_id: uuid.UUID
    ) -> None:
        """Test deleting a nonexistent nutrition day."""
        deleted = await service.delete_by_date(user_id, date.today())

        assert deleted is False
