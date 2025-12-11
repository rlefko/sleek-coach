"""Unit tests for CheckInService."""

import uuid
from datetime import UTC, date, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.checkins.models import CheckIn
from app.checkins.schemas import CheckInCreate, CheckInSyncItem
from app.checkins.service import CheckInService


@pytest.fixture
def user_id() -> uuid.UUID:
    """Generate a test user ID."""
    return uuid.uuid4()


@pytest.fixture
def service(db_session: AsyncSession) -> CheckInService:
    """Create a CheckInService instance."""
    return CheckInService(db_session)


@pytest.mark.asyncio
async def test_create_checkin(
    service: CheckInService,
    user_id: uuid.UUID,
) -> None:
    """Test creating a new check-in."""
    data = CheckInCreate(
        date=date.today(),
        weight_kg=75.5,
        notes="Feeling good!",
        energy_level=4,
    )

    checkin = await service.create_or_update(user_id, data)

    assert checkin.id is not None
    assert checkin.user_id == user_id
    assert checkin.date == date.today()
    assert float(checkin.weight_kg) == 75.5  # type: ignore[arg-type]
    assert checkin.notes == "Feeling good!"
    assert checkin.energy_level == 4


@pytest.mark.asyncio
async def test_update_existing_checkin(
    service: CheckInService,
    user_id: uuid.UUID,
) -> None:
    """Test updating an existing check-in for the same date."""
    # Create initial check-in
    initial_data = CheckInCreate(
        date=date.today(),
        weight_kg=75.0,
        notes="Morning weight",
    )
    initial = await service.create_or_update(user_id, initial_data)
    initial_id = initial.id

    # Update the check-in
    update_data = CheckInCreate(
        date=date.today(),
        weight_kg=74.8,
        notes="Evening weight",
        mood=5,
    )
    updated = await service.create_or_update(user_id, update_data)

    # Should be same record
    assert updated.id == initial_id
    assert float(updated.weight_kg) == 74.8  # type: ignore[arg-type]
    assert updated.notes == "Evening weight"
    assert updated.mood == 5


@pytest.mark.asyncio
async def test_get_by_date_range(
    service: CheckInService,
    user_id: uuid.UUID,
    db_session: AsyncSession,
) -> None:
    """Test retrieving check-ins within a date range."""
    # Create check-ins for different dates
    today = date.today()
    for i in range(5):
        checkin = CheckIn(
            user_id=user_id,
            date=today - timedelta(days=i),
            weight_kg=75.0 + i * 0.1,
        )
        db_session.add(checkin)
    await db_session.commit()

    # Get all
    items, total = await service.get_by_date_range(
        user_id,
        from_date=today - timedelta(days=10),
        to_date=today,
    )

    assert total == 5
    assert len(items) == 5
    # Should be ordered by date descending
    assert items[0].date == today


@pytest.mark.asyncio
async def test_get_by_date_range_with_pagination(
    service: CheckInService,
    user_id: uuid.UUID,
    db_session: AsyncSession,
) -> None:
    """Test pagination in date range query."""
    today = date.today()
    for i in range(10):
        checkin = CheckIn(
            user_id=user_id,
            date=today - timedelta(days=i),
            weight_kg=75.0,
        )
        db_session.add(checkin)
    await db_session.commit()

    # Get with limit
    items, total = await service.get_by_date_range(
        user_id,
        from_date=today - timedelta(days=30),
        to_date=today,
        limit=3,
        offset=2,
    )

    assert total == 10
    assert len(items) == 3


@pytest.mark.asyncio
async def test_get_latest(
    service: CheckInService,
    user_id: uuid.UUID,
    db_session: AsyncSession,
) -> None:
    """Test getting the most recent check-in."""
    today = date.today()
    for i in range(3):
        checkin = CheckIn(
            user_id=user_id,
            date=today - timedelta(days=i),
            weight_kg=75.0 + i,
        )
        db_session.add(checkin)
    await db_session.commit()

    latest = await service.get_latest(user_id)

    assert latest is not None
    assert latest.date == today
    assert float(latest.weight_kg) == 75.0  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_get_latest_no_data(
    service: CheckInService,
    user_id: uuid.UUID,
) -> None:
    """Test getting latest when no check-ins exist."""
    latest = await service.get_latest(user_id)
    assert latest is None


@pytest.mark.asyncio
async def test_calculate_weight_trend(
    service: CheckInService,
    user_id: uuid.UUID,
    db_session: AsyncSession,
) -> None:
    """Test weight trend calculation."""
    today = date.today()
    # Create weight entries showing a 1kg loss over 14 days
    for i in range(14):
        checkin = CheckIn(
            user_id=user_id,
            date=today - timedelta(days=13 - i),
            weight_kg=80.0 - (i * 0.071),  # ~1kg loss
        )
        db_session.add(checkin)
    await db_session.commit()

    trend = await service.calculate_weight_trend(user_id, days=30)

    assert len(trend.data) == 14
    assert trend.start_weight is not None
    assert trend.current_weight is not None
    assert trend.total_change is not None
    assert trend.weekly_rate_of_change is not None
    # Should show weight loss
    assert trend.total_change < 0


@pytest.mark.asyncio
async def test_calculate_weight_trend_empty(
    service: CheckInService,
    user_id: uuid.UUID,
) -> None:
    """Test weight trend with no data."""
    trend = await service.calculate_weight_trend(user_id, days=30)

    assert len(trend.data) == 0
    assert trend.start_weight is None
    assert trend.current_weight is None
    assert trend.weekly_rate_of_change is None


@pytest.mark.asyncio
async def test_calculate_weight_trend_moving_average(
    service: CheckInService,
    user_id: uuid.UUID,
    db_session: AsyncSession,
) -> None:
    """Test that moving average is calculated correctly."""
    today = date.today()
    weights = [80.0, 80.2, 79.8, 80.1, 79.9, 80.0, 79.7]

    for i, weight in enumerate(weights):
        checkin = CheckIn(
            user_id=user_id,
            date=today - timedelta(days=len(weights) - 1 - i),
            weight_kg=weight,
        )
        db_session.add(checkin)
    await db_session.commit()

    trend = await service.calculate_weight_trend(user_id, days=30)

    # Last data point should have 7-day moving average
    assert trend.data[-1].moving_average_7d is not None
    # First few points shouldn't have MA (less than 3 data points in window)
    # But actually the logic shows MA is calculated if window >= 3
    # Check the 7th point has full 7-day average
    expected_avg = sum(weights) / len(weights)
    assert abs(trend.data[-1].moving_average_7d - expected_avg) < 0.01


@pytest.mark.asyncio
async def test_sync_checkins_create_new(
    service: CheckInService,
    user_id: uuid.UUID,
) -> None:
    """Test sync creates new check-ins."""
    from datetime import datetime

    items = [
        CheckInSyncItem(
            date=date.today(),
            weight_kg=75.0,
            client_updated_at=datetime.utcnow(),
        ),
    ]

    results = await service.sync_checkins(user_id, items)

    assert len(results) == 1
    assert results[0]["status"] == "created"
    assert results[0]["server_version"] is not None


@pytest.mark.asyncio
async def test_sync_checkins_conflict(
    service: CheckInService,
    user_id: uuid.UUID,
    db_session: AsyncSession,
) -> None:
    """Test sync detects conflicts when server is newer."""

    # Create existing check-in
    existing = CheckIn(
        user_id=user_id,
        date=date.today(),
        weight_kg=75.0,
    )
    db_session.add(existing)
    await db_session.commit()
    await db_session.refresh(existing)

    # Try to sync with older client timestamp
    items = [
        CheckInSyncItem(
            date=date.today(),
            weight_kg=74.0,
            client_updated_at=existing.updated_at - timedelta(minutes=5),
        ),
    ]

    results = await service.sync_checkins(user_id, items)

    assert len(results) == 1
    assert results[0]["status"] == "conflict"


@pytest.mark.asyncio
async def test_sync_checkins_update(
    service: CheckInService,
    user_id: uuid.UUID,
    db_session: AsyncSession,
) -> None:
    """Test sync updates when client is newer."""

    # Create existing check-in
    existing = CheckIn(
        user_id=user_id,
        date=date.today(),
        weight_kg=75.0,
    )
    db_session.add(existing)
    await db_session.commit()
    await db_session.refresh(existing)

    # Sync with newer client timestamp
    items = [
        CheckInSyncItem(
            date=date.today(),
            weight_kg=74.0,
            notes="Updated from client",
            client_updated_at=existing.updated_at + timedelta(minutes=5),
        ),
    ]

    results = await service.sync_checkins(user_id, items)

    assert len(results) == 1
    assert results[0]["status"] == "updated"
    server_version = results[0]["server_version"]
    assert server_version is not None
    assert isinstance(server_version, CheckIn)
    assert float(server_version.weight_kg) == 74.0  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_create_checkin_with_timezone_aware_datetime(
    service: CheckInService,
    user_id: uuid.UUID,
) -> None:
    """Test creating a check-in with timezone-aware client_updated_at."""
    # This simulates what the mobile client sends (ISO 8601 with timezone)
    aware_dt = datetime(2025, 12, 11, 17, 9, 13, tzinfo=UTC)

    data = CheckInCreate(
        date=date.today(),
        weight_kg=75.5,
        client_updated_at=aware_dt,
    )

    # Should not raise an error
    checkin = await service.create_or_update(user_id, data)

    assert checkin.id is not None
    assert checkin.client_updated_at is not None
    # The datetime should be stored as naive UTC
    assert checkin.client_updated_at.tzinfo is None


@pytest.mark.asyncio
async def test_sync_checkins_with_timezone_aware_datetime(
    service: CheckInService,
    user_id: uuid.UUID,
    db_session: AsyncSession,
) -> None:
    """Test sync handles timezone-aware client_updated_at without errors."""
    # Create existing check-in
    existing = CheckIn(
        user_id=user_id,
        date=date.today(),
        weight_kg=75.0,
    )
    db_session.add(existing)
    await db_session.commit()
    await db_session.refresh(existing)

    # Sync with timezone-aware timestamp (simulating mobile client)
    aware_dt = existing.updated_at + timedelta(minutes=5)
    # Convert to timezone-aware to simulate what client sends
    aware_dt = aware_dt.replace(tzinfo=UTC)

    items = [
        CheckInSyncItem(
            date=date.today(),
            weight_kg=74.0,
            client_updated_at=aware_dt,
        ),
    ]

    # Should not raise an error about naive/aware datetime comparison
    results = await service.sync_checkins(user_id, items)

    assert len(results) == 1
    assert results[0]["status"] == "updated"


@pytest.mark.asyncio
async def test_sync_checkins_conflict_with_timezone_aware_datetime(
    service: CheckInService,
    user_id: uuid.UUID,
    db_session: AsyncSession,
) -> None:
    """Test sync detects conflicts correctly with timezone-aware datetime."""
    # Create existing check-in
    existing = CheckIn(
        user_id=user_id,
        date=date.today(),
        weight_kg=75.0,
    )
    db_session.add(existing)
    await db_session.commit()
    await db_session.refresh(existing)

    # Try to sync with older timezone-aware timestamp
    older_dt = existing.updated_at - timedelta(minutes=5)
    # Convert to timezone-aware to simulate what client sends
    older_dt_aware = older_dt.replace(tzinfo=UTC)

    items = [
        CheckInSyncItem(
            date=date.today(),
            weight_kg=74.0,
            client_updated_at=older_dt_aware,
        ),
    ]

    # Should detect conflict without error
    results = await service.sync_checkins(user_id, items)

    assert len(results) == 1
    assert results[0]["status"] == "conflict"
