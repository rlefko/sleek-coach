"""Unit tests for datetime utility functions."""

from datetime import UTC, datetime, timedelta, timezone

from app.core.datetime_utils import normalize_to_naive_utc


class TestNormalizeToNaiveUtc:
    """Tests for normalize_to_naive_utc function."""

    def test_none_returns_none(self) -> None:
        """Test that None input returns None."""
        assert normalize_to_naive_utc(None) is None

    def test_naive_datetime_unchanged(self) -> None:
        """Test that naive datetime passes through unchanged."""
        naive_dt = datetime(2025, 12, 11, 17, 9, 13)
        result = normalize_to_naive_utc(naive_dt)

        assert result == naive_dt
        assert result.tzinfo is None

    def test_utc_aware_datetime_normalized(self) -> None:
        """Test that UTC timezone-aware datetime is normalized to naive."""
        aware_dt = datetime(2025, 12, 11, 17, 9, 13, tzinfo=UTC)
        result = normalize_to_naive_utc(aware_dt)

        assert result == datetime(2025, 12, 11, 17, 9, 13)
        assert result.tzinfo is None

    def test_non_utc_timezone_converted_to_utc(self) -> None:
        """Test that non-UTC timezone is first converted to UTC, then stripped."""
        # Create a datetime in UTC+5 timezone
        plus5_tz = timezone(timedelta(hours=5))
        aware_dt = datetime(2025, 12, 11, 22, 9, 13, tzinfo=plus5_tz)

        result = normalize_to_naive_utc(aware_dt)

        # 22:09 in UTC+5 should become 17:09 in UTC
        assert result == datetime(2025, 12, 11, 17, 9, 13)
        assert result.tzinfo is None

    def test_negative_timezone_converted_to_utc(self) -> None:
        """Test that negative UTC offset is properly converted."""
        # Create a datetime in UTC-8 timezone (e.g., PST)
        minus8_tz = timezone(timedelta(hours=-8))
        aware_dt = datetime(2025, 12, 11, 9, 9, 13, tzinfo=minus8_tz)

        result = normalize_to_naive_utc(aware_dt)

        # 09:09 in UTC-8 should become 17:09 in UTC
        assert result == datetime(2025, 12, 11, 17, 9, 13)
        assert result.tzinfo is None

    def test_microseconds_preserved(self) -> None:
        """Test that microseconds are preserved during conversion."""
        aware_dt = datetime(2025, 12, 11, 17, 9, 13, 341000, tzinfo=UTC)
        result = normalize_to_naive_utc(aware_dt)

        assert result == datetime(2025, 12, 11, 17, 9, 13, 341000)
        assert result.tzinfo is None


class TestSchemaValidators:
    """Tests for datetime validation in Pydantic schemas."""

    def test_checkin_create_with_timezone_aware_datetime(self) -> None:
        """Test CheckInCreate handles timezone-aware client_updated_at."""
        from datetime import date

        from app.checkins.schemas import CheckInCreate

        aware_dt = datetime(2025, 12, 11, 17, 9, 13, tzinfo=UTC)

        checkin = CheckInCreate(
            date=date(2025, 12, 11),
            weight_kg=75.5,
            client_updated_at=aware_dt,
        )

        assert checkin.client_updated_at is not None
        assert checkin.client_updated_at.tzinfo is None
        assert checkin.client_updated_at == datetime(2025, 12, 11, 17, 9, 13)

    def test_checkin_create_with_iso_string(self) -> None:
        """Test CheckInCreate handles ISO 8601 string with timezone."""
        from datetime import date

        from app.checkins.schemas import CheckInCreate

        # This is what the mobile client sends
        iso_string = "2025-12-11T17:09:13.341000Z"

        checkin = CheckInCreate(
            date=date(2025, 12, 11),
            weight_kg=75.5,
            client_updated_at=iso_string,  # type: ignore[arg-type]
        )

        assert checkin.client_updated_at is not None
        assert checkin.client_updated_at.tzinfo is None

    def test_checkin_sync_item_with_timezone_aware_datetime(self) -> None:
        """Test CheckInSyncItem handles timezone-aware client_updated_at."""
        from datetime import date

        from app.checkins.schemas import CheckInSyncItem

        aware_dt = datetime(2025, 12, 11, 17, 9, 13, tzinfo=UTC)

        sync_item = CheckInSyncItem(
            date=date(2025, 12, 11),
            weight_kg=75.5,
            client_updated_at=aware_dt,
        )

        assert sync_item.client_updated_at.tzinfo is None
        assert sync_item.client_updated_at == datetime(2025, 12, 11, 17, 9, 13)

    def test_user_goal_update_with_timezone_aware_datetime(self) -> None:
        """Test UserGoalUpdate handles timezone-aware target_date."""
        from app.users.schemas import UserGoalUpdate

        aware_dt = datetime(2025, 6, 15, 12, 0, 0, tzinfo=UTC)

        goal = UserGoalUpdate(target_date=aware_dt)

        assert goal.target_date is not None
        assert goal.target_date.tzinfo is None
        assert goal.target_date == datetime(2025, 6, 15, 12, 0, 0)

    def test_weekly_plan_request_with_timezone_aware_datetime(self) -> None:
        """Test WeeklyPlanRequest handles timezone-aware start_date."""
        from app.coach_ai.schemas import WeeklyPlanRequest

        aware_dt = datetime(2025, 12, 16, 0, 0, 0, tzinfo=UTC)

        request = WeeklyPlanRequest(start_date=aware_dt)

        assert request.start_date is not None
        assert request.start_date.tzinfo is None
        assert request.start_date == datetime(2025, 12, 16, 0, 0, 0)

    def test_chat_message_with_timezone_aware_datetime(self) -> None:
        """Test ChatMessage handles timezone-aware timestamp."""
        from app.coach_ai.schemas import ChatMessage

        aware_dt = datetime(2025, 12, 11, 17, 9, 13, tzinfo=UTC)

        message = ChatMessage(
            role="user",
            content="Hello",
            timestamp=aware_dt,
        )

        assert message.timestamp is not None
        assert message.timestamp.tzinfo is None
        assert message.timestamp == datetime(2025, 12, 11, 17, 9, 13)
