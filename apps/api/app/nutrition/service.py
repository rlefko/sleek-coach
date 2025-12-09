"""Nutrition business logic service."""

import uuid
from datetime import date, datetime

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.integrations.mfp_parser import MFPParseResult, parse_mfp_zip

from .models import NutritionDay, NutritionSource
from .schemas import MFPImportResponse, NutritionDayCreate


class NutritionService:
    """Nutrition service."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize nutrition service with database session.

        Args:
            session: The async database session.
        """
        self.session = session

    async def create_or_update(
        self,
        user_id: uuid.UUID,
        data: NutritionDayCreate,
    ) -> NutritionDay:
        """Create or update nutrition for a day (upsert by date).

        Args:
            user_id: The user's unique identifier.
            data: The nutrition data.

        Returns:
            The created or updated nutrition day.
        """
        result = await self.session.execute(
            select(NutritionDay).where(
                NutritionDay.user_id == user_id,
                NutritionDay.date == data.date,
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
            nutrition = NutritionDay(user_id=user_id, **data.model_dump())
            self.session.add(nutrition)
            await self.session.commit()
            await self.session.refresh(nutrition)
            return nutrition

    async def get_by_date(
        self,
        user_id: uuid.UUID,
        target_date: date,
    ) -> NutritionDay | None:
        """Get nutrition for a specific date.

        Args:
            user_id: The user's unique identifier.
            target_date: The date to retrieve.

        Returns:
            The nutrition day or None if not found.
        """
        result = await self.session.execute(
            select(NutritionDay).where(
                NutritionDay.user_id == user_id,
                NutritionDay.date == target_date,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_date_range(
        self,
        user_id: uuid.UUID,
        from_date: date,
        to_date: date,
    ) -> list[NutritionDay]:
        """Get nutrition days within date range.

        Args:
            user_id: The user's unique identifier.
            from_date: Start date (inclusive).
            to_date: End date (inclusive).

        Returns:
            List of nutrition days within the range.
        """
        result = await self.session.execute(
            select(NutritionDay)
            .where(
                NutritionDay.user_id == user_id,
                NutritionDay.date >= from_date,
                NutritionDay.date <= to_date,
            )
            .order_by(NutritionDay.date.desc())  # type: ignore[attr-defined]
        )
        return list(result.scalars().all())

    async def get_aggregated_stats(
        self,
        user_id: uuid.UUID,
        from_date: date,
        to_date: date,
    ) -> dict[str, int | float | None]:
        """Get aggregated nutrition statistics.

        Args:
            user_id: The user's unique identifier.
            from_date: Start date (inclusive).
            to_date: End date (inclusive).

        Returns:
            Dictionary with aggregated statistics.
        """
        result = await self.session.execute(
            select(  # type: ignore[call-overload]
                func.count().label("logged_days"),
                func.avg(NutritionDay.calories).label("avg_calories"),
                func.avg(NutritionDay.protein_g).label("avg_protein"),
                func.avg(NutritionDay.carbs_g).label("avg_carbs"),
                func.avg(NutritionDay.fat_g).label("avg_fat"),
                func.avg(NutritionDay.fiber_g).label("avg_fiber"),
                func.sum(NutritionDay.calories).label("total_calories"),
            ).where(
                NutritionDay.user_id == user_id,
                NutritionDay.date >= from_date,
                NutritionDay.date <= to_date,
            )
        )
        row = result.one()

        # Calculate total days in range
        total_days = (to_date - from_date).days + 1

        return {
            "total_days": total_days,
            "logged_days": row.logged_days or 0,
            "avg_calories": round(float(row.avg_calories), 1) if row.avg_calories else None,
            "avg_protein_g": round(float(row.avg_protein), 1) if row.avg_protein else None,
            "avg_carbs_g": round(float(row.avg_carbs), 1) if row.avg_carbs else None,
            "avg_fat_g": round(float(row.avg_fat), 1) if row.avg_fat else None,
            "avg_fiber_g": round(float(row.avg_fiber), 1) if row.avg_fiber else None,
            "total_calories": int(row.total_calories) if row.total_calories else None,
        }

    async def import_mfp_data(
        self,
        user_id: uuid.UUID,
        zip_content: bytes,
        overwrite_existing: bool = False,
        date_format: str | None = None,
    ) -> MFPImportResponse:
        """Import MFP ZIP export data.

        Args:
            user_id: The user's unique identifier.
            zip_content: Raw bytes of the ZIP file.
            overwrite_existing: Whether to overwrite existing entries.
            date_format: Optional date format (auto-detects if None).

        Returns:
            Import result with counts and any errors.
        """
        parse_result: MFPParseResult = parse_mfp_zip(zip_content, date_format)

        imported = 0
        skipped = 0
        dates: list[date] = []

        for row in parse_result.rows:
            # Check if exists
            existing = await self.get_by_date(user_id, row.date)

            if existing and not overwrite_existing:
                skipped += 1
                continue

            if existing:
                # Update existing
                existing.calories = row.calories
                existing.protein_g = row.protein_g
                existing.carbs_g = row.carbs_g
                existing.fat_g = row.fat_g
                existing.fiber_g = row.fiber_g
                existing.source = NutritionSource.MFP_IMPORT
                existing.updated_at = datetime.utcnow()
            else:
                # Create new
                nutrition = NutritionDay(
                    user_id=user_id,
                    date=row.date,
                    calories=row.calories,
                    protein_g=row.protein_g,
                    carbs_g=row.carbs_g,
                    fat_g=row.fat_g,
                    fiber_g=row.fiber_g,
                    source=NutritionSource.MFP_IMPORT,
                )
                self.session.add(nutrition)

            imported += 1
            dates.append(row.date)

        await self.session.commit()

        # Determine date range
        date_range_start = min(dates) if dates else None
        date_range_end = max(dates) if dates else None

        return MFPImportResponse(
            total_rows=parse_result.total_rows,
            imported=imported,
            skipped=skipped,
            errors=parse_result.errors[:50],  # Limit errors returned
            date_range_start=date_range_start,
            date_range_end=date_range_end,
        )

    async def delete_by_date(
        self,
        user_id: uuid.UUID,
        target_date: date,
    ) -> bool:
        """Delete nutrition for a specific date.

        Args:
            user_id: The user's unique identifier.
            target_date: The date to delete.

        Returns:
            True if deleted, False if not found.
        """
        nutrition = await self.get_by_date(user_id, target_date)
        if nutrition:
            await self.session.delete(nutrition)
            await self.session.commit()
            return True
        return False
