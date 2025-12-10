"""User profile API endpoints."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import CurrentUser
from app.auth.schemas import MessageResponse
from app.database import get_session

from .consent_service import UserConsentService
from .models import ConsentType
from .schemas import (
    ConsentRequest,
    ConsentResponse,
    ConsentsListResponse,
    DietPreferencesResponse,
    DietPreferencesUpdate,
    UserDataExport,
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


@router.get("/me/export", response_model=UserDataExport)
async def export_data(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> UserDataExport:
    """Export all user data for GDPR compliance.

    Returns complete user data including profile, goals, preferences,
    check-ins, and nutrition records. Photos are not included but
    a count is provided.
    """
    service = UserService(session)

    # Get user with relations
    user = await service.get_user_with_relations(current_user.id)

    # Build user response
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

    user_response = UserResponse(
        id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        profile=profile_response,
        goal=goal_response,
        preferences=preferences_response,
    )

    # Get export data
    check_ins, nutrition_days, photo_count = await service.export_user_data(current_user.id)

    return UserDataExport(
        user=user_response,
        check_ins=check_ins,
        nutrition_days=nutrition_days,
        photo_count=photo_count,
        exported_at=datetime.utcnow(),
    )


@router.delete("/me", response_model=MessageResponse)
async def delete_account(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MessageResponse:
    """Delete current user's account and all associated data.

    This action is irreversible. All user data including profile,
    goals, preferences, check-ins, nutrition records, and photo
    metadata will be permanently deleted.
    """
    service = UserService(session)
    await service.delete_user(current_user.id)

    return MessageResponse(message="Account deleted successfully")


# Consent endpoints
@router.get("/me/consents", response_model=ConsentsListResponse)
async def get_consents(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ConsentsListResponse:
    """Get all consent records for the current user.

    Returns a list of all consent records including terms of service,
    privacy policy, and optional consents like web search and analytics.
    """
    service = UserConsentService(session)
    consents = await service.get_user_consents(current_user.id)

    return ConsentsListResponse(
        consents=[
            ConsentResponse(
                consent_type=c.consent_type,
                granted=c.granted,
                version=c.version,
                granted_at=c.granted_at,
                revoked_at=c.revoked_at,
            )
            for c in consents
        ]
    )


@router.post("/me/consents", response_model=ConsentResponse)
async def grant_consent(
    data: ConsentRequest,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ConsentResponse:
    """Grant or update a user consent.

    Records the user's consent for a specific consent type (e.g., web search,
    analytics). If consent already exists, it will be updated.
    """
    from app.legal.router import (
        PRIVACY_POLICY_VERSION,
        TERMS_OF_SERVICE_VERSION,
    )

    # Determine version based on consent type
    version_map = {
        ConsentType.TERMS_OF_SERVICE: TERMS_OF_SERVICE_VERSION,
        ConsentType.PRIVACY_POLICY: PRIVACY_POLICY_VERSION,
        ConsentType.WEB_SEARCH: "1.0",
        ConsentType.ANALYTICS: "1.0",
        ConsentType.PHOTO_AI_ACCESS: "1.0",
    }
    version = version_map.get(data.consent_type, "1.0")

    service = UserConsentService(session)

    if data.granted:
        consent = await service.grant_consent(
            user_id=current_user.id,
            consent_type=data.consent_type,
            version=version,
        )
    else:
        consent = await service.revoke_consent(
            user_id=current_user.id,
            consent_type=data.consent_type,
        )
        if consent is None:
            # Create a revoked consent record if none exists
            consent = await service.grant_consent(
                user_id=current_user.id,
                consent_type=data.consent_type,
                version=version,
            )
            consent = await service.revoke_consent(
                user_id=current_user.id,
                consent_type=data.consent_type,
            )

    return ConsentResponse(
        consent_type=consent.consent_type,
        granted=consent.granted,
        version=consent.version,
        granted_at=consent.granted_at,
        revoked_at=consent.revoked_at,
    )


@router.delete("/me/consents/{consent_type}", response_model=ConsentResponse)
async def revoke_consent(
    consent_type: ConsentType,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ConsentResponse:
    """Revoke a specific user consent.

    Marks the specified consent as revoked. Note that revoking certain
    consents (like web search) may affect available features.
    """
    from fastapi import HTTPException

    service = UserConsentService(session)
    consent = await service.revoke_consent(
        user_id=current_user.id,
        consent_type=consent_type,
    )

    if consent is None:
        raise HTTPException(
            status_code=404,
            detail=f"No consent record found for type: {consent_type}",
        )

    return ConsentResponse(
        consent_type=consent.consent_type,
        granted=consent.granted,
        version=consent.version,
        granted_at=consent.granted_at,
        revoked_at=consent.revoked_at,
    )
