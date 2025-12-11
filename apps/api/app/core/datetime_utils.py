"""Datetime utility functions."""

from datetime import UTC, datetime


def normalize_to_naive_utc(dt: datetime | None) -> datetime | None:
    """Convert timezone-aware datetime to naive UTC.

    The app stores all datetimes as naive UTC (TIMESTAMP WITHOUT TIME ZONE).
    This function normalizes incoming timezone-aware datetimes by:
    1. Converting to UTC
    2. Stripping the timezone info

    Args:
        dt: A datetime that may or may not have timezone info.

    Returns:
        A naive datetime in UTC, or None if input was None.
    """
    if dt is None:
        return None
    if dt.tzinfo is not None:
        # Convert to UTC first, then strip timezone
        dt_utc = dt.astimezone(UTC)
        return dt_utc.replace(tzinfo=None)
    return dt
