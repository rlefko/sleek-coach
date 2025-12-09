"""Check-in business logic service."""

import uuid
from datetime import date, datetime, timedelta

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from .models import CheckIn
from .schemas import CheckInCreate, CheckInSyncItem, WeightTrendData, WeightTrendResponse


class CheckInService:
    """Check-in service."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize check-in service with database session.

        Args:
            session: The async database session.
        """
        self.session = session

    async def create_or_update(
        self,
        user_id: uuid.UUID,
        data: CheckInCreate,
    ) -> CheckIn:
        """Create or update check-in (upsert by date).

        Args:
            user_id: The user's unique identifier.
            data: The check-in data.

        Returns:
            The created or updated check-in.
        """
        result = await self.session.execute(
            select(CheckIn).where(
                CheckIn.user_id == user_id,
                CheckIn.date == data.date,
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            update_data = data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(existing, field, value)
            existing.updated_at = datetime.utcnow()
            await self.session.commit()
            await self.session.refresh(existing)
            return existing
        else:
            checkin = CheckIn(user_id=user_id, **data.model_dump())
            self.session.add(checkin)
            await self.session.commit()
            await self.session.refresh(checkin)
            return checkin

    async def get_by_date_range(
        self,
        user_id: uuid.UUID,
        from_date: date | None = None,
        to_date: date | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[CheckIn], int]:
        """Get check-ins within date range.

        Args:
            user_id: The user's unique identifier.
            from_date: Start date filter (defaults to 30 days ago).
            to_date: End date filter (defaults to today).
            limit: Maximum number of results.
            offset: Number of results to skip.

        Returns:
            Tuple of (list of check-ins, total count).
        """
        if from_date is None:
            from_date = date.today() - timedelta(days=30)
        if to_date is None:
            to_date = date.today()

        count_query = (
            select(func.count())
            .select_from(CheckIn)
            .where(
                CheckIn.user_id == user_id,
                CheckIn.date >= from_date,
                CheckIn.date <= to_date,
            )
        )
        total_result = await self.session.execute(count_query)
        total_count = total_result.scalar() or 0

        query = (
            select(CheckIn)
            .where(
                CheckIn.user_id == user_id,
                CheckIn.date >= from_date,
                CheckIn.date <= to_date,
            )
            .order_by(CheckIn.date.desc())  # type: ignore[attr-defined]
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return items, total_count

    async def get_latest(self, user_id: uuid.UUID) -> CheckIn | None:
        """Get most recent check-in.

        Args:
            user_id: The user's unique identifier.

        Returns:
            The most recent check-in or None if not found.
        """
        result = await self.session.execute(
            select(CheckIn)
            .where(CheckIn.user_id == user_id)
            .order_by(CheckIn.date.desc())  # type: ignore[attr-defined]
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def calculate_weight_trend(
        self,
        user_id: uuid.UUID,
        days: int = 30,
    ) -> WeightTrendResponse:
        """Calculate weight trend with 7-day moving average.

        Args:
            user_id: The user's unique identifier.
            days: Number of days to analyze.

        Returns:
            Weight trend analysis response.
        """
        from_date = date.today() - timedelta(days=days)

        result = await self.session.execute(
            select(CheckIn)
            .where(
                CheckIn.user_id == user_id,
                CheckIn.date >= from_date,
                CheckIn.weight_kg.isnot(None),  # type: ignore[union-attr]
            )
            .order_by(CheckIn.date.asc())  # type: ignore[attr-defined]
        )
        checkins = list(result.scalars().all())

        if not checkins:
            return WeightTrendResponse(
                data=[],
                weekly_rate_of_change=None,
                total_change=None,
                start_weight=None,
                current_weight=None,
            )

        weights = [float(c.weight_kg) for c in checkins]  # type: ignore[arg-type]
        data: list[WeightTrendData] = []

        for i, checkin in enumerate(checkins):
            window_start = max(0, i - 6)
            window = weights[window_start : i + 1]
            ma_7d = sum(window) / len(window) if len(window) >= 3 else None

            data.append(
                WeightTrendData(
                    date=checkin.date,
                    weight_kg=float(checkin.weight_kg),  # type: ignore[arg-type]
                    moving_average_7d=round(ma_7d, 2) if ma_7d else None,
                )
            )

        first_weight = weights[0]
        last_weight = weights[-1]
        days_elapsed = (checkins[-1].date - checkins[0].date).days

        weekly_rate = None
        if days_elapsed > 0:
            weekly_rate = round((last_weight - first_weight) / days_elapsed * 7, 3)

        return WeightTrendResponse(
            data=data,
            weekly_rate_of_change=weekly_rate,
            total_change=round(last_weight - first_weight, 2),
            start_weight=first_weight,
            current_weight=last_weight,
        )

    async def sync_checkins(
        self,
        user_id: uuid.UUID,
        items: list[CheckInSyncItem],
    ) -> list[dict[str, object]]:
        """Sync batch of check-ins with conflict detection.

        Uses last-write-wins strategy with server timestamp comparison.

        Args:
            user_id: The user's unique identifier.
            items: List of check-ins to sync.

        Returns:
            List of sync results with status for each item.
        """
        results: list[dict[str, object]] = []

        for item in items:
            db_result = await self.session.execute(
                select(CheckIn).where(
                    CheckIn.user_id == user_id,
                    CheckIn.date == item.date,
                )
            )
            existing = db_result.scalar_one_or_none()

            if existing:
                if existing.updated_at > item.client_updated_at:
                    results.append(
                        {
                            "date": item.date,
                            "status": "conflict",
                            "server_version": existing,
                        }
                    )
                elif existing.updated_at == item.client_updated_at:
                    results.append(
                        {
                            "date": item.date,
                            "status": "unchanged",
                            "server_version": existing,
                        }
                    )
                else:
                    update_data = item.model_dump(exclude_unset=True)
                    for field, value in update_data.items():
                        setattr(existing, field, value)
                    existing.updated_at = datetime.utcnow()
                    results.append(
                        {
                            "date": item.date,
                            "status": "updated",
                            "server_version": existing,
                        }
                    )
            else:
                checkin = CheckIn(
                    user_id=user_id,
                    **item.model_dump(),
                )
                self.session.add(checkin)
                results.append(
                    {
                        "date": item.date,
                        "status": "created",
                        "server_version": checkin,
                    }
                )

        await self.session.commit()

        for sync_result in results:
            if sync_result["server_version"]:
                await self.session.refresh(sync_result["server_version"])

        return results
