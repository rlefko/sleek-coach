"""User profile business logic service."""

import uuid
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.checkins.models import CheckIn
from app.nutrition.models import NutritionDay
from app.photos.models import ProgressPhoto
from app.users.models import DietPreferences, User, UserGoal, UserProfile

from .schemas import (
    DietPreferencesUpdate,
    ExportCheckIn,
    ExportNutritionDay,
    UserGoalUpdate,
    UserProfileUpdate,
)


class UserService:
    """User profile service."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize user service with database session.

        Args:
            session: The async database session.
        """
        self.session = session

    async def get_user_with_relations(self, user_id: uuid.UUID) -> User | None:
        """Get user with all related data.

        Args:
            user_id: The user's unique identifier.

        Returns:
            User with loaded relations or None if not found.
        """
        result = await self.session.execute(
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.profile),  # type: ignore[arg-type]
                selectinload(User.goal),  # type: ignore[arg-type]
                selectinload(User.diet_preferences),  # type: ignore[arg-type]
            )
        )
        return result.scalar_one_or_none()

    async def update_profile(
        self,
        user_id: uuid.UUID,
        data: UserProfileUpdate,
    ) -> UserProfile:
        """Update user profile.

        Args:
            user_id: The user's unique identifier.
            data: The profile update data.

        Returns:
            The updated user profile.
        """
        result = await self.session.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = result.scalar_one()

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)

        profile.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(profile)

        return profile

    async def update_goal(
        self,
        user_id: uuid.UUID,
        data: UserGoalUpdate,
    ) -> UserGoal:
        """Update user goal.

        Args:
            user_id: The user's unique identifier.
            data: The goal update data.

        Returns:
            The updated user goal.
        """
        result = await self.session.execute(select(UserGoal).where(UserGoal.user_id == user_id))
        goal = result.scalar_one()

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(goal, field, value)

        goal.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(goal)

        return goal

    async def update_preferences(
        self,
        user_id: uuid.UUID,
        data: DietPreferencesUpdate,
    ) -> DietPreferences:
        """Update diet preferences.

        Args:
            user_id: The user's unique identifier.
            data: The preferences update data.

        Returns:
            The updated diet preferences.
        """
        result = await self.session.execute(
            select(DietPreferences).where(DietPreferences.user_id == user_id)
        )
        preferences = result.scalar_one()

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(preferences, field, value)

        preferences.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(preferences)

        return preferences

    async def export_user_data(
        self,
        user_id: uuid.UUID,
    ) -> tuple[
        list[ExportCheckIn],
        list[ExportNutritionDay],
        int,
    ]:
        """Export all user data for GDPR compliance.

        Args:
            user_id: The user's unique identifier.

        Returns:
            Tuple of (check_ins, nutrition_days, photo_count).
        """
        # Get all check-ins
        checkins_result = await self.session.execute(
            select(CheckIn).where(CheckIn.user_id == user_id).order_by(CheckIn.date.desc())  # type: ignore[attr-defined]
        )
        checkins = checkins_result.scalars().all()

        export_checkins = [
            ExportCheckIn(
                date=c.date,
                weight_kg=float(c.weight_kg) if c.weight_kg else None,
                notes=c.notes,
                energy_level=c.energy_level,
                sleep_quality=c.sleep_quality,
                mood=c.mood,
                created_at=c.created_at,
            )
            for c in checkins
        ]

        # Get all nutrition days
        nutrition_result = await self.session.execute(
            select(NutritionDay)
            .where(NutritionDay.user_id == user_id)
            .order_by(NutritionDay.date.desc())  # type: ignore[attr-defined]
        )
        nutrition_days = nutrition_result.scalars().all()

        export_nutrition = [
            ExportNutritionDay(
                date=n.date,
                calories=n.calories,
                protein_g=float(n.protein_g) if n.protein_g else None,
                carbs_g=float(n.carbs_g) if n.carbs_g else None,
                fat_g=float(n.fat_g) if n.fat_g else None,
                fiber_g=float(n.fiber_g) if n.fiber_g else None,
                source=n.source.value if hasattr(n.source, "value") else str(n.source),
                notes=n.notes,
                created_at=n.created_at,
            )
            for n in nutrition_days
        ]

        # Get photo count
        photo_count_result = await self.session.execute(
            select(func.count()).select_from(ProgressPhoto).where(ProgressPhoto.user_id == user_id)
        )
        photo_count = photo_count_result.scalar() or 0

        return export_checkins, export_nutrition, photo_count

    async def delete_user(self, user_id: uuid.UUID) -> None:
        """Delete user and all associated data.

        This performs a hard delete of the user account and all related data
        including profile, goals, preferences, check-ins, nutrition days,
        and photo metadata.

        Note: Photos stored in S3 should be cleaned up separately.

        Args:
            user_id: The user's unique identifier.
        """
        # Get user
        result = await self.session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            return

        # Delete user (cascades to profile, goal, preferences via FK)
        # CheckIn, NutritionDay, ProgressPhoto also have CASCADE delete
        await self.session.delete(user)
        await self.session.commit()
