"""Check-in tools for AI Coach."""

from __future__ import annotations

from datetime import date, timedelta
from typing import TYPE_CHECKING, Any

from app.coach_ai.tools.base import BaseTool, ToolResult

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


class GetRecentCheckinsTool(BaseTool):
    """Tool to retrieve recent check-ins for a user."""

    name = "get_recent_checkins"
    description = (
        "Retrieve the user's recent daily check-ins including weight, energy, sleep, and mood data. "
        "Use this to understand the user's recent progress and wellness patterns."
    )
    category = "internal"
    requires_consent = False
    cacheable = True
    cache_ttl_seconds = 60  # 1 minute - check-ins change frequently

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
                    "description": "Number of days to look back",
                    "minimum": 1,
                    "maximum": 90,
                    "default": 14,
                },
            },
            "required": [],
        }

    async def execute(self, user_id: str, days: int = 14, **_kwargs: Any) -> ToolResult:
        """Execute the tool to get recent check-ins."""
        try:
            import uuid as uuid_module

            from app.checkins.service import CheckInService

            service = CheckInService(self.session)
            from_date = date.today() - timedelta(days=days)
            to_date = date.today()
            user_uuid = uuid_module.UUID(user_id)

            checkins, total = await service.get_by_date_range(
                user_id=user_uuid,
                from_date=from_date,
                to_date=to_date,
                limit=days,
                offset=0,
            )

            data = [
                {
                    "date": str(c.date),
                    "weight_kg": float(c.weight_kg) if c.weight_kg else None,
                    "energy_level": c.energy_level,
                    "sleep_quality": c.sleep_quality,
                    "mood": c.mood,
                    "adherence_score": float(c.adherence_score) if c.adherence_score else None,
                    "notes": c.notes[:200] if c.notes else None,  # Truncate for context
                }
                for c in checkins
            ]

            return ToolResult(
                success=True,
                data={"checkins": data, "total": total, "days_requested": days},
            )

        except Exception as e:
            return ToolResult(success=False, data=None, error=str(e))


class GetWeightTrendTool(BaseTool):
    """Tool to calculate weight trend analysis."""

    name = "get_weight_trend"
    description = (
        "Calculate weight trend analysis including 7-day moving average and weekly rate of change. "
        "Use this to understand if the user is progressing toward their weight goal."
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
                    "maximum": 365,
                    "default": 30,
                },
            },
            "required": [],
        }

    async def execute(self, user_id: str, days: int = 30, **_kwargs: Any) -> ToolResult:
        """Execute the tool to get weight trend."""
        try:
            import uuid as uuid_module

            from app.checkins.service import CheckInService

            service = CheckInService(self.session)
            user_uuid = uuid_module.UUID(user_id)
            trend = await service.calculate_weight_trend(user_uuid, days)

            return ToolResult(
                success=True,
                data={
                    "weekly_rate_of_change_kg": trend.weekly_rate_of_change,
                    "total_change_kg": trend.total_change,
                    "start_weight_kg": trend.start_weight,
                    "current_weight_kg": trend.current_weight,
                    "data_points": len(trend.data),
                    "days_analyzed": days,
                },
            )

        except Exception as e:
            return ToolResult(success=False, data=None, error=str(e))
