"""Nutrition tools for AI Coach."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING, Any

from app.coach_ai.tools.base import BaseTool, ToolResult

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


class GetNutritionSummaryTool(BaseTool):
    """Tool to retrieve nutrition summary for a user."""

    name = "get_nutrition_summary"
    description = (
        "Retrieve aggregated nutrition statistics including average calories and macros. "
        "Use this to understand the user's eating patterns and nutritional adherence."
    )
    category = "internal"
    requires_consent = False
    cacheable = True
    cache_ttl_seconds = 120  # 2 minutes

    def __init__(self, session: AsyncSession) -> None:
        """Initialize with database session."""
        self.session = session

    def get_parameters_schema(self) -> dict[str, Any]:
        """Return JSON Schema for tool parameters."""
        return {
            "type": "object",
            "properties": {
                "days": {
                    "type": "integer",
                    "description": "Number of days to analyze",
                    "minimum": 1,
                    "maximum": 90,
                    "default": 14,
                },
            },
            "required": [],
        }

    async def execute(self, user_id: str, days: int = 14, **_kwargs: Any) -> ToolResult:
        """Execute the tool to get nutrition summary."""
        try:
            import uuid as uuid_module

            from app.nutrition.service import NutritionService

            service = NutritionService(self.session)
            from_date = date.today() - timedelta(days=days)
            to_date = date.today()
            user_uuid = uuid_module.UUID(user_id)

            stats = await service.get_aggregated_stats(
                user_id=user_uuid,
                from_date=from_date,
                to_date=to_date,
            )

            return ToolResult(
                success=True,
                data={
                    "days_logged": stats.get("logged_days", 0),
                    "avg_calories": stats.get("avg_calories"),
                    "avg_protein_g": stats.get("avg_protein_g"),
                    "avg_carbs_g": stats.get("avg_carbs_g"),
                    "avg_fat_g": stats.get("avg_fat_g"),
                    "avg_fiber_g": stats.get("avg_fiber_g"),
                    "total_calories": stats.get("total_calories"),
                    "days_analyzed": days,
                },
            )

        except Exception as e:
            return ToolResult(success=False, data=None, error=str(e))


class CalculateTDEETool(BaseTool):
    """Tool to calculate TDEE and macro targets for a user."""

    name = "calculate_tdee"
    description = (
        "Calculate the user's Total Daily Energy Expenditure (TDEE) and recommended macro targets "
        "based on their profile, goals, and activity level. Use this to provide personalized "
        "nutrition recommendations."
    )
    category = "internal"
    requires_consent = False
    cacheable = True
    cache_ttl_seconds = 600  # 10 minutes - profile doesn't change often

    def __init__(self, session: AsyncSession) -> None:
        """Initialize with database session."""
        self.session = session

    def get_parameters_schema(self) -> dict[str, Any]:
        """Return JSON Schema for tool parameters."""
        return {
            "type": "object",
            "properties": {
                "weight_kg": {
                    "type": "number",
                    "description": "Current weight in kg (optional, uses latest check-in if not provided)",
                },
            },
            "required": [],
        }

    async def execute(
        self, user_id: str, weight_kg: float | None = None, **_kwargs: Any
    ) -> ToolResult:
        """Execute the tool to calculate TDEE."""
        try:
            import uuid as uuid_module

            from app.nutrition.calculator import (
                calculate_bmr,
                calculate_macro_targets,
                calculate_tdee,
            )
            from app.users.service import UserService

            user_uuid = uuid_module.UUID(user_id)
            user_service = UserService(self.session)
            user = await user_service.get_user_with_relations(user_uuid)

            if not user or not user.profile:
                return ToolResult(
                    success=False,
                    data=None,
                    error="User profile not found",
                )

            # Get current weight from parameter or latest check-in
            current_weight = weight_kg
            if not current_weight:
                from app.checkins.service import CheckInService

                checkin_service = CheckInService(self.session)
                latest = await checkin_service.get_latest(user_uuid)
                if latest and latest.weight_kg:
                    current_weight = float(latest.weight_kg)

            if not current_weight:
                return ToolResult(
                    success=False,
                    data=None,
                    error="No weight data available. Please log a check-in with your weight.",
                )

            # Calculate age from birth year
            current_year = datetime.now().year
            age = current_year - user.profile.birth_year if user.profile.birth_year else 30

            # Get sex and activity level
            sex = user.profile.sex.value if user.profile.sex else "male"
            activity_level = (
                user.profile.activity_level.value if user.profile.activity_level else "moderate"
            )
            height_cm = float(user.profile.height_cm) if user.profile.height_cm else 170

            # Calculate BMR and TDEE
            bmr = calculate_bmr(
                weight_kg=current_weight,
                height_cm=height_cm,
                age=age,
                sex=sex,
            )
            tdee = calculate_tdee(bmr=bmr, activity_level=activity_level)

            # Get goal and pace
            goal_type = user.goal.goal_type.value if user.goal else "maintenance"
            pace = user.goal.pace_preference.value if user.goal else "moderate"

            # Calculate macro targets
            targets = calculate_macro_targets(
                tdee=tdee,
                weight_kg=current_weight,
                goal_type=goal_type,
                pace=pace,
                sex=sex,
            )

            return ToolResult(
                success=True,
                data={
                    "bmr": round(targets.bmr),
                    "tdee": round(targets.tdee),
                    "target_calories": round(targets.target_calories),
                    "protein_g": round(targets.protein_g),
                    "carbs_g": round(targets.carbs_g),
                    "fat_g": round(targets.fat_g),
                    "deficit_surplus": round(targets.deficit_surplus),
                    "warnings": targets.warnings,
                    "inputs": {
                        "weight_kg": current_weight,
                        "height_cm": height_cm,
                        "age": age,
                        "sex": sex,
                        "activity_level": activity_level,
                        "goal_type": goal_type,
                        "pace": pace,
                    },
                },
            )

        except Exception as e:
            return ToolResult(success=False, data=None, error=str(e))
