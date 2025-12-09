"""Adherence tracking tools for AI Coach."""

from __future__ import annotations

from datetime import date, timedelta
from typing import TYPE_CHECKING, Any

from app.coach_ai.tools.base import BaseTool, ToolResult

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


class GetAdherenceMetricsTool(BaseTool):
    """Tool to calculate adherence metrics for a user."""

    name = "get_adherence_metrics"
    description = (
        "Calculate adherence metrics including check-in completion rate, nutrition logging rate, "
        "and target adherence. Use this to understand how consistently the user is tracking "
        "their progress and following their plan."
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
            "properties": {
                "days": {
                    "type": "integer",
                    "description": "Number of days to analyze",
                    "minimum": 7,
                    "maximum": 90,
                    "default": 14,
                },
            },
            "required": [],
        }

    async def execute(self, user_id: str, days: int = 14, **_kwargs: Any) -> ToolResult:
        """Execute the tool to get adherence metrics."""
        try:
            import uuid as uuid_module

            from app.checkins.service import CheckInService
            from app.nutrition.service import NutritionService

            from_date = date.today() - timedelta(days=days)
            to_date = date.today()
            user_uuid = uuid_module.UUID(user_id)

            # Get check-in data
            checkin_service = CheckInService(self.session)
            checkins, total_checkins = await checkin_service.get_by_date_range(
                user_id=user_uuid,
                from_date=from_date,
                to_date=to_date,
                limit=days,
                offset=0,
            )

            # Get nutrition data
            nutrition_service = NutritionService(self.session)
            nutrition_stats = await nutrition_service.get_aggregated_stats(
                user_id=user_uuid,
                from_date=from_date,
                to_date=to_date,
            )

            # Calculate check-in completion rate
            checkin_completion_rate = total_checkins / days if days > 0 else 0

            # Calculate weight logging rate (check-ins with weight)
            checkins_with_weight = sum(1 for c in checkins if c.weight_kg is not None)
            weight_logging_rate = checkins_with_weight / days if days > 0 else 0

            # Calculate nutrition logging rate
            nutrition_days = int(nutrition_stats.get("logged_days", 0) or 0)
            nutrition_logging_rate = nutrition_days / days if days > 0 else 0

            # Calculate streak (consecutive days with check-ins from today backwards)
            sorted_checkins = sorted(checkins, key=lambda x: x.date, reverse=True)
            streak = 0
            expected_date = date.today()
            for checkin in sorted_checkins:
                if checkin.date == expected_date:
                    streak += 1
                    expected_date -= timedelta(days=1)
                else:
                    break

            # Calculate average adherence score if available
            adherence_scores = [
                float(c.adherence_score) for c in checkins if c.adherence_score is not None
            ]
            avg_adherence_score = (
                sum(adherence_scores) / len(adherence_scores) if adherence_scores else None
            )

            return ToolResult(
                success=True,
                data={
                    "days_analyzed": days,
                    "checkin_completion_rate": round(checkin_completion_rate, 2),
                    "weight_logging_rate": round(weight_logging_rate, 2),
                    "nutrition_logging_rate": round(nutrition_logging_rate, 2),
                    "current_streak": streak,
                    "avg_adherence_score": round(avg_adherence_score, 2)
                    if avg_adherence_score
                    else None,
                    "total_checkins": total_checkins,
                    "checkins_with_weight": checkins_with_weight,
                    "nutrition_days_logged": nutrition_days,
                },
            )

        except Exception as e:
            return ToolResult(success=False, data=None, error=str(e))
