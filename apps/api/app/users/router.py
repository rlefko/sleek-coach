"""User profile API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import CurrentUser
from app.database import get_session

from .schemas import (
    DietPreferencesResponse,
    DietPreferencesUpdate,
    UserGoalResponse,
    UserGoalUpdate,
    UserProfileResponse,
    UserProfileUpdate,
    UserResponse,
)
from .service import UserService

router = APIRouter(tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> UserResponse:
    """Get current user with profile, goals, and preferences.

    Returns the authenticated user's complete profile including
    their fitness goals and dietary preferences.
    """
    service = UserService(session)
    user = await service.get_user_with_relations(current_user.id)

    # Build response with loaded relations
    profile_response = None
    if user and user.profile:
        profile_response = UserProfileResponse(
            display_name=user.profile.display_name,
            height_cm=user.profile.height_cm,
            sex=user.profile.sex,
            birth_year=user.profile.birth_year,
            activity_level=user.profile.activity_level,
            timezone=user.profile.timezone,
        )

    goal_response = None
    if user and user.goal:
        goal_response = UserGoalResponse(
            goal_type=user.goal.goal_type,
            target_weight_kg=user.goal.target_weight_kg,
            pace_preference=user.goal.pace_preference,
            target_date=user.goal.target_date,
        )

    preferences_response = None
    if user and user.diet_preferences:
        preferences_response = DietPreferencesResponse(
            diet_type=user.diet_preferences.diet_type,
            allergies=user.diet_preferences.allergies or [],
            disliked_foods=user.diet_preferences.disliked_foods or [],
            meals_per_day=user.diet_preferences.meals_per_day,
            macro_targets=user.diet_preferences.macro_targets,
        )

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        profile=profile_response,
        goal=goal_response,
        preferences=preferences_response,
    )


@router.patch("/me/profile", response_model=UserProfileResponse)
async def update_profile(
    data: UserProfileUpdate,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> UserProfileResponse:
    """Update current user's profile.

    Updates profile fields like display name, height, sex, birth year,
    activity level, and timezone.
    """
    service = UserService(session)
    profile = await service.update_profile(current_user.id, data)

    return UserProfileResponse(
        display_name=profile.display_name,
        height_cm=profile.height_cm,
        sex=profile.sex,
        birth_year=profile.birth_year,
        activity_level=profile.activity_level,
        timezone=profile.timezone,
    )


@router.patch("/me/goals", response_model=UserGoalResponse)
async def update_goals(
    data: UserGoalUpdate,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> UserGoalResponse:
    """Update current user's goals.

    Updates fitness goals like goal type, target weight, pace preference,
    and target date.
    """
    service = UserService(session)
    goal = await service.update_goal(current_user.id, data)

    return UserGoalResponse(
        goal_type=goal.goal_type,
        target_weight_kg=goal.target_weight_kg,
        pace_preference=goal.pace_preference,
        target_date=goal.target_date,
    )


@router.patch("/me/preferences", response_model=DietPreferencesResponse)
async def update_preferences(
    data: DietPreferencesUpdate,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DietPreferencesResponse:
    """Update current user's diet preferences.

    Updates dietary preferences like diet type, allergies, disliked foods,
    meals per day, and macro targets.
    """
    service = UserService(session)
    preferences = await service.update_preferences(current_user.id, data)

    return DietPreferencesResponse(
        diet_type=preferences.diet_type,
        allergies=preferences.allergies or [],
        disliked_foods=preferences.disliked_foods or [],
        meals_per_day=preferences.meals_per_day,
        macro_targets=preferences.macro_targets,
    )
