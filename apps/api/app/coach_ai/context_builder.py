"""Context builder for AI Coach."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING, Any

from app.coach_ai.policies.base import UserContext

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class CoachContext:
    """Full context for coach interactions."""

    user_id: uuid.UUID
    user_profile: dict[str, Any] | None = None
    user_goal: dict[str, Any] | None = None
    diet_preferences: dict[str, Any] | None = None
    recent_checkins: list[dict[str, Any]] = field(default_factory=list)
    recent_nutrition: list[dict[str, Any]] = field(default_factory=list)
    weight_trend: dict[str, Any] | None = None
    adherence_metrics: dict[str, Any] | None = None
    calculated_targets: dict[str, Any] | None = None

    def to_policy_context(self) -> UserContext:
        """Convert to UserContext for policy evaluation."""
        return UserContext(
            user_id=str(self.user_id),
            sex=self.user_profile.get("sex") if self.user_profile else None,
            age=self._calculate_age(),
            current_weight_kg=self._get_current_weight(),
            goal_type=self.user_goal.get("goal_type") if self.user_goal else None,
            target_calories=self.calculated_targets.get("target_calories")
            if self.calculated_targets
            else None,
            target_weight_kg=self.user_goal.get("target_weight_kg") if self.user_goal else None,
        )

    def _calculate_age(self) -> int | None:
        """Calculate age from birth year."""
        if self.user_profile and self.user_profile.get("birth_year"):
            birth_year: int = self.user_profile["birth_year"]
            return datetime.now().year - birth_year
        return None

    def _get_current_weight(self) -> float | None:
        """Get current weight from recent check-ins."""
        if self.weight_trend and self.weight_trend.get("current_weight_kg"):
            return float(self.weight_trend["current_weight_kg"])
        if self.recent_checkins:
            for checkin in self.recent_checkins:
                if checkin.get("weight_kg"):
                    return float(checkin["weight_kg"])
        return None

    def get_context_summary(self) -> str:
        """Generate a text summary of the context for the LLM."""
        parts = []

        if self.user_profile:
            profile = self.user_profile
            parts.append(f"User Profile: {profile.get('display_name', 'User')}")
            if profile.get("height_cm"):
                parts.append(f"  Height: {profile['height_cm']} cm")
            if profile.get("sex"):
                parts.append(f"  Sex: {profile['sex']}")
            if profile.get("activity_level"):
                parts.append(f"  Activity Level: {profile['activity_level']}")

        if self.user_goal:
            goal = self.user_goal
            parts.append(f"Goal: {goal.get('goal_type', 'Not set')}")
            if goal.get("target_weight_kg"):
                parts.append(f"  Target Weight: {goal['target_weight_kg']} kg")
            if goal.get("pace_preference"):
                parts.append(f"  Pace: {goal['pace_preference']}")

        if self.weight_trend:
            trend = self.weight_trend
            parts.append("Weight Trend:")
            if trend.get("current_weight_kg"):
                parts.append(f"  Current: {trend['current_weight_kg']} kg")
            if trend.get("weekly_rate_of_change_kg"):
                rate = trend["weekly_rate_of_change_kg"]
                direction = "losing" if rate < 0 else "gaining"
                parts.append(f"  Rate: {direction} {abs(rate):.2f} kg/week")

        if self.adherence_metrics:
            metrics = self.adherence_metrics
            parts.append("Adherence:")
            if metrics.get("checkin_completion_rate"):
                parts.append(f"  Check-in rate: {metrics['checkin_completion_rate'] * 100:.0f}%")
            if metrics.get("current_streak"):
                parts.append(f"  Current streak: {metrics['current_streak']} days")

        return "\n".join(parts)


class ContextBuilder:
    """Builds context for coach interactions."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize the context builder.

        Args:
            session: Database session.
        """
        self.session = session

    async def build_context(
        self,
        user_id: uuid.UUID,
        include_nutrition: bool = True,
        include_weight_trend: bool = True,
        include_adherence: bool = True,
        include_targets: bool = True,
        days: int = 14,
    ) -> CoachContext:
        """Build full context for a user.

        Args:
            user_id: The user's ID.
            include_nutrition: Whether to include nutrition data.
            include_weight_trend: Whether to include weight trend analysis.
            include_adherence: Whether to include adherence metrics.
            include_targets: Whether to include calculated targets.
            days: Number of days to look back for data.

        Returns:
            CoachContext with all requested data.
        """
        context = CoachContext(user_id=user_id)

        # Get user profile and related data
        await self._load_user_data(context)

        # Get recent check-ins
        await self._load_checkins(context, days)

        # Get weight trend if requested
        if include_weight_trend:
            await self._load_weight_trend(context, days)

        # Get nutrition data if requested
        if include_nutrition:
            await self._load_nutrition(context, days)

        # Get adherence metrics if requested
        if include_adherence:
            await self._load_adherence(context, days)

        # Calculate targets if requested
        if include_targets:
            await self._load_targets(context)

        return context

    async def _load_user_data(self, context: CoachContext) -> None:
        """Load user profile, goal, and preferences."""
        from app.users.service import UserService

        service = UserService(self.session)
        user = await service.get_user_with_relations(context.user_id)

        if not user:
            return

        if user.profile:
            context.user_profile = {
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
            context.user_goal = {
                "goal_type": user.goal.goal_type.value,
                "target_weight_kg": float(user.goal.target_weight_kg)
                if user.goal.target_weight_kg
                else None,
                "pace_preference": user.goal.pace_preference.value,
                "target_date": str(user.goal.target_date) if user.goal.target_date else None,
            }

        if user.diet_preferences:
            context.diet_preferences = {
                "diet_type": user.diet_preferences.diet_type.value
                if user.diet_preferences.diet_type
                else None,
                "allergies": user.diet_preferences.allergies or [],
                "disliked_foods": user.diet_preferences.disliked_foods or [],
                "meals_per_day": user.diet_preferences.meals_per_day,
            }

    async def _load_checkins(self, context: CoachContext, days: int) -> None:
        """Load recent check-ins."""
        from app.checkins.service import CheckInService

        service = CheckInService(self.session)
        from_date = date.today() - timedelta(days=days)
        to_date = date.today()

        checkins, _ = await service.get_by_date_range(
            user_id=context.user_id,
            from_date=from_date,
            to_date=to_date,
            limit=days,
            offset=0,
        )

        context.recent_checkins = [
            {
                "date": str(c.date),
                "weight_kg": float(c.weight_kg) if c.weight_kg else None,
                "energy_level": c.energy_level,
                "sleep_quality": c.sleep_quality,
                "mood": c.mood,
                "adherence_score": float(c.adherence_score) if c.adherence_score else None,
            }
            for c in checkins
        ]

    async def _load_weight_trend(self, context: CoachContext, days: int) -> None:
        """Load weight trend analysis."""
        from app.checkins.service import CheckInService

        service = CheckInService(self.session)
        try:
            trend = await service.calculate_weight_trend(context.user_id, days)
            context.weight_trend = {
                "weekly_rate_of_change_kg": trend.weekly_rate_of_change,
                "total_change_kg": trend.total_change,
                "start_weight_kg": trend.start_weight,
                "current_weight_kg": trend.current_weight,
                "data_points": len(trend.data),
            }
        except Exception:
            context.weight_trend = None

    async def _load_nutrition(self, context: CoachContext, days: int) -> None:
        """Load recent nutrition data."""
        from app.nutrition.service import NutritionService

        service = NutritionService(self.session)
        from_date = date.today() - timedelta(days=days)
        to_date = date.today()

        nutrition_days = await service.get_by_date_range(
            user_id=context.user_id,
            from_date=from_date,
            to_date=to_date,
        )

        context.recent_nutrition = [
            {
                "date": str(n.date),
                "calories": n.calories,
                "protein_g": float(n.protein_g) if n.protein_g else None,
                "carbs_g": float(n.carbs_g) if n.carbs_g else None,
                "fat_g": float(n.fat_g) if n.fat_g else None,
            }
            for n in nutrition_days
        ]

    async def _load_adherence(self, context: CoachContext, days: int) -> None:
        """Load adherence metrics."""
        # Calculate check-in rate
        total_checkins = len(context.recent_checkins)
        checkin_rate = total_checkins / days if days > 0 else 0

        # Calculate weight logging rate
        checkins_with_weight = sum(1 for c in context.recent_checkins if c.get("weight_kg"))
        weight_rate = checkins_with_weight / days if days > 0 else 0

        # Calculate nutrition logging rate
        nutrition_days = len(context.recent_nutrition)
        nutrition_rate = nutrition_days / days if days > 0 else 0

        # Calculate streak
        sorted_checkins = sorted(context.recent_checkins, key=lambda x: x["date"], reverse=True)
        streak = 0
        expected_date = date.today()
        for checkin in sorted_checkins:
            checkin_date = date.fromisoformat(checkin["date"])
            if checkin_date == expected_date:
                streak += 1
                expected_date -= timedelta(days=1)
            else:
                break

        context.adherence_metrics = {
            "days_analyzed": days,
            "checkin_completion_rate": round(checkin_rate, 2),
            "weight_logging_rate": round(weight_rate, 2),
            "nutrition_logging_rate": round(nutrition_rate, 2),
            "current_streak": streak,
        }

    async def _load_targets(self, context: CoachContext) -> None:
        """Load calculated TDEE and macro targets."""
        from app.nutrition.calculator import calculate_bmr, calculate_macro_targets, calculate_tdee

        if not context.user_profile:
            return

        # Get current weight
        current_weight = None
        if context.weight_trend and context.weight_trend.get("current_weight_kg"):
            current_weight = context.weight_trend["current_weight_kg"]
        elif context.recent_checkins:
            for checkin in context.recent_checkins:
                if checkin.get("weight_kg"):
                    current_weight = checkin["weight_kg"]
                    break

        if not current_weight:
            return

        try:
            # Get profile data
            height_cm = context.user_profile.get("height_cm", 170)
            birth_year = context.user_profile.get("birth_year")
            age = datetime.now().year - birth_year if birth_year else 30
            sex = context.user_profile.get("sex", "male")
            activity_level = context.user_profile.get("activity_level", "moderate")

            goal_type = (
                context.user_goal.get("goal_type", "maintenance")
                if context.user_goal
                else "maintenance"
            )
            pace = (
                context.user_goal.get("pace_preference", "moderate")
                if context.user_goal
                else "moderate"
            )

            # Calculate
            bmr = calculate_bmr(current_weight, height_cm, age, sex)
            tdee = calculate_tdee(bmr, activity_level)
            targets = calculate_macro_targets(tdee, current_weight, goal_type, pace, sex)

            context.calculated_targets = {
                "bmr": round(targets.bmr),
                "tdee": round(targets.tdee),
                "target_calories": round(targets.target_calories),
                "protein_g": round(targets.protein_g),
                "carbs_g": round(targets.carbs_g),
                "fat_g": round(targets.fat_g),
                "deficit_surplus": round(targets.deficit_surplus),
            }
        except Exception:
            context.calculated_targets = None
