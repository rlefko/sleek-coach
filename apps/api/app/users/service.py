"""User profile business logic service."""

import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.users.models import DietPreferences, User, UserGoal, UserProfile

from .schemas import (
    DietPreferencesUpdate,
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
        result = await self.session.execute(
            select(UserGoal).where(UserGoal.user_id == user_id)
        )
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
