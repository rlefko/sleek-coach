"""User profile tools for AI Coach."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from app.coach_ai.tools.base import BaseTool, ToolResult

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


class GetUserProfileTool(BaseTool):
    """Tool to retrieve user profile information."""

    name = "get_user_profile"
    description = (
        "Retrieve the user's profile including demographics, goals, and dietary preferences. "
        "Use this to understand the user's baseline stats, fitness goals, and dietary restrictions."
    )
    category = "internal"
    requires_consent = False
    cacheable = True
    cache_ttl_seconds = 300  # 5 minutes

    def __init__(self, session: AsyncSession) -> None:
        """Initialize with database session."""
        self.session = session

    def get_parameters_schema(self) -> dict[str, Any]:
        """Return JSON Schema for tool parameters."""
        return {
            "type": "object",
            "properties": {},
            "required": [],
        }

    async def execute(self, user_id: str, **_kwargs: Any) -> ToolResult:
        """Execute the tool to get user profile."""
        try:
            import uuid as uuid_module

            from app.users.service import UserService

            service = UserService(self.session)
            user = await service.get_user_with_relations(uuid_module.UUID(user_id))

            if not user:
                return ToolResult(
                    success=False,
                    data=None,
                    error="User not found",
                )

            # Build profile data
            profile_data: dict[str, Any] = {
                "email": user.email,
                "is_verified": user.is_verified,
            }

            if user.profile:
                profile_data["profile"] = {
                    "display_name": user.profile.display_name,
                    "height_cm": float(user.profile.height_cm) if user.profile.height_cm else None,
                    "sex": user.profile.sex.value if user.profile.sex else None,
                    "birth_year": user.profile.birth_year,
                    "activity_level": user.profile.activity_level.value
                    if user.profile.activity_level
                    else None,
                    "timezone": user.profile.timezone,
                }

            if user.goal:
                profile_data["goal"] = {
                    "goal_type": user.goal.goal_type.value,
                    "target_weight_kg": float(user.goal.target_weight_kg)
                    if user.goal.target_weight_kg
                    else None,
                    "pace_preference": user.goal.pace_preference.value,
                    "target_date": str(user.goal.target_date) if user.goal.target_date else None,
                }

            if user.diet_preferences:
                profile_data["diet_preferences"] = {
                    "diet_type": user.diet_preferences.diet_type.value
                    if user.diet_preferences.diet_type
                    else None,
                    "allergies": user.diet_preferences.allergies or [],
                    "disliked_foods": user.diet_preferences.disliked_foods or [],
                    "meals_per_day": user.diet_preferences.meals_per_day,
                    "macro_targets": user.diet_preferences.macro_targets,
                }

            return ToolResult(success=True, data=profile_data)

        except Exception as e:
            return ToolResult(success=False, data=None, error=str(e))
