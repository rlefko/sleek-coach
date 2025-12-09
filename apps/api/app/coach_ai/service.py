"""Coach service for AI Coach operations."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from datetime import datetime
from typing import TYPE_CHECKING

import structlog
from sqlmodel import select

from app.coach_ai.context_builder import CoachContext, ContextBuilder
from app.coach_ai.models import AISession, SessionStatus
from app.coach_ai.orchestrator import CoachOrchestrator
from app.coach_ai.policies.engine import SafetyPolicyEngine
from app.coach_ai.schemas import (
    ChatMessage,
    ChatResponse,
    DataGap,
    InsightItem,
    InsightsResponse,
    StreamEvent,
    ToolTrace,
    WeeklyPlanResponse,
)

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger()


class CoachService:
    """Business logic service for AI coach operations."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize the coach service.

        Args:
            session: Database session.
        """
        self.session = session
        self.context_builder = ContextBuilder(session)
        self.policy_engine = SafetyPolicyEngine(session)
        self.orchestrator = CoachOrchestrator(session)

    async def chat(
        self,
        user_id: uuid.UUID,
        message: str,
        session_id: uuid.UUID | None = None,
    ) -> ChatResponse:
        """Process a chat message and return response.

        Args:
            user_id: The user's ID.
            message: The user's message.
            session_id: Optional existing session ID.

        Returns:
            ChatResponse with the coach's response.
        """
        # Get or create session
        ai_session = await self._get_or_create_session(user_id, session_id)

        # Build user context
        user_context = await self.context_builder.build_context(user_id)
        policy_context = user_context.to_policy_context()

        # Check input against safety policies
        input_check = await self.policy_engine.check_input(message, policy_context)
        if input_check.message and input_check.action.value in ("block", "flag"):
            # Return safety message without calling LLM
            return ChatResponse(
                message=input_check.message,
                session_id=ai_session.id,
                confidence=1.0,
                tokens_used=0,
            )

        # Get conversation history from session
        conversation_history: list[ChatMessage] | None = None
        if ai_session.conversation_history:
            conversation_history = [
                ChatMessage(role=msg["role"], content=msg["content"])
                for msg in ai_session.conversation_history
            ]

        # Execute orchestrator
        result = await self.orchestrator.process_message(
            user_id=user_id,
            message=message,
            user_context=user_context,
            session=ai_session,
            conversation_history=conversation_history,
        )

        # Check output against safety policies
        output_check = await self.policy_engine.check_output(result.response, policy_context)

        final_response = output_check.modified_content or result.response

        # Update session
        ai_session.message_count += 2  # User + assistant
        ai_session.tokens_used += result.tokens_used
        ai_session.last_message_at = datetime.utcnow()

        # Store conversation history
        if ai_session.conversation_history is None:
            ai_session.conversation_history = []

        ai_session.conversation_history.append({"role": "user", "content": message})
        ai_session.conversation_history.append({"role": "assistant", "content": final_response})

        # Keep only last 20 messages to manage context size
        if len(ai_session.conversation_history) > 20:
            ai_session.conversation_history = ai_session.conversation_history[-20:]

        await self.session.commit()

        # Build tool traces
        tool_traces = [
            ToolTrace(
                tool_name=tc["name"],
                tool_description=tc["description"],
                input_summary=tc["input_summary"],
                output_summary=tc["output_summary"],
                latency_ms=tc["latency_ms"],
                cached=tc.get("cached", False),
            )
            for tc in result.tool_calls
        ]

        # Calculate confidence
        confidence = self._calculate_confidence(user_context)

        # Identify data gaps
        data_gaps = self._identify_data_gaps(user_context)

        return ChatResponse(
            message=final_response,
            session_id=ai_session.id,
            tool_trace=tool_traces if tool_traces else None,
            confidence=confidence,
            data_gaps=data_gaps if data_gaps else None,
            tokens_used=result.tokens_used,
        )

    async def chat_stream(
        self,
        user_id: uuid.UUID,
        message: str,
        session_id: uuid.UUID | None = None,
    ) -> AsyncIterator[StreamEvent]:
        """Stream a chat response.

        Args:
            user_id: The user's ID.
            message: The user's message.
            session_id: Optional existing session ID.

        Yields:
            StreamEvent objects with response chunks.
        """
        # Get or create session
        ai_session = await self._get_or_create_session(user_id, session_id)

        # Build user context
        user_context = await self.context_builder.build_context(user_id)
        policy_context = user_context.to_policy_context()

        # Check input against safety policies
        input_check = await self.policy_engine.check_input(message, policy_context)
        if input_check.message and input_check.action.value in ("block", "flag"):
            yield StreamEvent(type="token", data=input_check.message)
            yield StreamEvent(type="done", data={"session_id": str(ai_session.id)})
            return

        # Get conversation history
        conversation_history: list[ChatMessage] | None = None
        if ai_session.conversation_history:
            conversation_history = [
                ChatMessage(role=msg["role"], content=msg["content"])
                for msg in ai_session.conversation_history
            ]

        # Stream from orchestrator
        accumulated_response = ""
        async for event in self.orchestrator.process_message_stream(
            user_id=user_id,
            message=message,
            user_context=user_context,
            session=ai_session,
            conversation_history=conversation_history,
        ):
            if event.type == "token" and isinstance(event.data, str):
                accumulated_response += event.data
            yield event

        # Update session after streaming completes
        ai_session.message_count += 2
        ai_session.last_message_at = datetime.utcnow()

        if ai_session.conversation_history is None:
            ai_session.conversation_history = []

        ai_session.conversation_history.append({"role": "user", "content": message})
        ai_session.conversation_history.append(
            {"role": "assistant", "content": accumulated_response}
        )

        if len(ai_session.conversation_history) > 20:
            ai_session.conversation_history = ai_session.conversation_history[-20:]

        await self.session.commit()

    async def generate_weekly_plan(
        self,
        user_id: uuid.UUID,
        start_date: datetime | None = None,
        preferences: dict[str, str] | None = None,
    ) -> WeeklyPlanResponse:
        """Generate a weekly plan for the user.

        Args:
            user_id: The user's ID.
            start_date: Optional start date for the plan.
            preferences: Optional user preferences.

        Returns:
            WeeklyPlanResponse with the generated plan.
        """
        user_context = await self.context_builder.build_context(user_id)

        plan = await self.orchestrator.generate_plan(
            user_id=user_id,
            user_context=user_context,
            start_date=start_date or datetime.utcnow(),
            preferences=preferences,
        )

        return plan

    async def get_insights(self, user_id: uuid.UUID) -> InsightsResponse:
        """Get pre-computed insights for the user.

        Args:
            user_id: The user's ID.

        Returns:
            InsightsResponse with generated insights.
        """
        user_context = await self.context_builder.build_context(user_id)

        insights: list[InsightItem] = []

        # Weight trend insight
        if user_context.weight_trend:
            trend = user_context.weight_trend
            rate = trend.get("weekly_rate_of_change_kg")
            if rate is not None:
                if rate < -0.1:
                    insights.append(
                        InsightItem(
                            type="trend",
                            title="Weight Trending Down",
                            description=f"You're losing {abs(rate):.2f} kg per week on average.",
                            data={"rate": rate, "direction": "down"},
                            action="Keep up the great work! Ensure you're hitting protein targets.",
                        )
                    )
                elif rate > 0.1:
                    insights.append(
                        InsightItem(
                            type="trend",
                            title="Weight Trending Up",
                            description=f"You're gaining {rate:.2f} kg per week on average.",
                            data={"rate": rate, "direction": "up"},
                        )
                    )
                else:
                    insights.append(
                        InsightItem(
                            type="trend",
                            title="Weight Stable",
                            description="Your weight has been relatively stable recently.",
                            data={"rate": rate, "direction": "stable"},
                        )
                    )

        # Adherence insights
        if user_context.adherence_metrics:
            metrics = user_context.adherence_metrics
            checkin_rate = metrics.get("checkin_completion_rate", 0)
            streak = metrics.get("current_streak", 0)

            if checkin_rate >= 0.8:
                insights.append(
                    InsightItem(
                        type="achievement",
                        title="Consistent Check-ins!",
                        description=f"You've logged {int(checkin_rate * 100)}% of your check-ins.",
                        data={"rate": checkin_rate},
                    )
                )
            elif checkin_rate < 0.5:
                insights.append(
                    InsightItem(
                        type="recommendation",
                        title="More Check-ins Needed",
                        description="Regular check-ins help track your progress accurately.",
                        action="Try to log your weight at the same time each day.",
                    )
                )

            if streak >= 7:
                insights.append(
                    InsightItem(
                        type="achievement",
                        title=f"{streak}-Day Streak!",
                        description=f"You've checked in {streak} days in a row!",
                        data={"streak": streak},
                    )
                )

        # Nutrition insights
        if user_context.recent_nutrition and user_context.calculated_targets:
            target_calories = user_context.calculated_targets.get("target_calories", 2000)
            target_protein = user_context.calculated_targets.get("protein_g", 150)

            # Calculate averages
            calories: list[float] = [
                float(cal)
                for n in user_context.recent_nutrition
                if (cal := n.get("calories")) is not None
            ]
            proteins: list[float] = [
                float(prot)
                for n in user_context.recent_nutrition
                if (prot := n.get("protein_g")) is not None
            ]

            if calories:
                avg_calories = sum(calories) / len(calories)
                diff_pct = (avg_calories - target_calories) / target_calories * 100

                if abs(diff_pct) < 10:
                    insights.append(
                        InsightItem(
                            type="achievement",
                            title="On Target with Calories",
                            description=f"Averaging {int(avg_calories)} cal/day, right on target!",
                        )
                    )
                elif diff_pct < -15:
                    insights.append(
                        InsightItem(
                            type="warning",
                            title="Under-eating",
                            description=f"Averaging {int(avg_calories)} cal/day, {int(-diff_pct)}% below target.",
                            action="Make sure you're fueling adequately for your goals.",
                        )
                    )

            if proteins:
                avg_protein: float = sum(proteins) / len(proteins)
                if avg_protein < target_protein * 0.8:
                    insights.append(
                        InsightItem(
                            type="recommendation",
                            title="Protein Opportunity",
                            description=f"Averaging {int(avg_protein)}g protein, aim for {target_protein}g.",
                            action="Add a protein source to each meal.",
                        )
                    )

        # Data quality score
        data_quality = self._calculate_data_quality(user_context)

        return InsightsResponse(
            generated_at=datetime.utcnow(),
            insights=insights,
            data_quality_score=data_quality,
        )

    async def _get_or_create_session(
        self,
        user_id: uuid.UUID,
        session_id: uuid.UUID | None,
    ) -> AISession:
        """Get existing session or create new one.

        Args:
            user_id: The user's ID.
            session_id: Optional session ID to resume.

        Returns:
            AISession (existing or new).
        """
        if session_id:
            result = await self.session.execute(
                select(AISession).where(
                    AISession.id == session_id,
                    AISession.user_id == user_id,
                    AISession.status == SessionStatus.ACTIVE,
                )
            )
            existing = result.scalar_one_or_none()
            if existing:
                return existing

        # Create new session
        new_session = AISession(user_id=user_id)
        self.session.add(new_session)
        await self.session.commit()
        await self.session.refresh(new_session)
        return new_session

    def _calculate_confidence(self, context: CoachContext) -> float:
        """Calculate confidence score based on data completeness."""
        scores = []

        # Check-in data (weight data especially)
        if context.recent_checkins:
            with_weight = sum(1 for c in context.recent_checkins if c.get("weight_kg"))
            if with_weight >= 7:
                scores.append(1.0)
            else:
                scores.append(with_weight / 7)
        else:
            scores.append(0.0)

        # Nutrition data
        if context.recent_nutrition:
            if len(context.recent_nutrition) >= 7:
                scores.append(1.0)
            else:
                scores.append(len(context.recent_nutrition) / 7)
        else:
            scores.append(0.0)

        # Profile completeness
        if context.user_profile:
            if context.user_profile.get("height_cm") and context.user_profile.get("sex"):
                scores.append(1.0)
            elif context.user_profile.get("height_cm") or context.user_profile.get("sex"):
                scores.append(0.5)
            else:
                scores.append(0.25)
        else:
            scores.append(0.0)

        return sum(scores) / len(scores) if scores else 0.3

    def _identify_data_gaps(self, context: CoachContext) -> list[DataGap]:
        """Identify what data would improve recommendations."""
        gaps = []

        if not context.recent_checkins or len(context.recent_checkins) < 7:
            gaps.append(
                DataGap(
                    field="check_ins",
                    description="Limited check-in data available",
                    suggestion="Log your weight daily for more accurate trend analysis",
                )
            )

        if not context.recent_nutrition or len(context.recent_nutrition) < 7:
            gaps.append(
                DataGap(
                    field="nutrition",
                    description="Limited nutrition data available",
                    suggestion="Log your daily calories and macros for personalized recommendations",
                )
            )

        if context.user_profile:
            if not context.user_profile.get("height_cm"):
                gaps.append(
                    DataGap(
                        field="profile.height",
                        description="Height not set",
                        suggestion="Add your height in settings for accurate TDEE calculations",
                    )
                )
            if not context.user_profile.get("activity_level"):
                gaps.append(
                    DataGap(
                        field="profile.activity_level",
                        description="Activity level not set",
                        suggestion="Set your activity level for better calorie recommendations",
                    )
                )

        return gaps

    def _calculate_data_quality(self, context: CoachContext) -> float:
        """Calculate overall data quality score."""
        scores = []

        # Check-in quality
        if context.recent_checkins:
            with_weight = sum(1 for c in context.recent_checkins if c.get("weight_kg"))
            scores.append(min(with_weight / 14, 1.0))
        else:
            scores.append(0.0)

        # Nutrition quality
        if context.recent_nutrition:
            scores.append(min(len(context.recent_nutrition) / 14, 1.0))
        else:
            scores.append(0.0)

        # Profile quality
        if context.user_profile:
            completeness = 0.0
            if context.user_profile.get("height_cm"):
                completeness += 0.25
            if context.user_profile.get("sex"):
                completeness += 0.25
            if context.user_profile.get("birth_year"):
                completeness += 0.25
            if context.user_profile.get("activity_level"):
                completeness += 0.25
            scores.append(completeness)
        else:
            scores.append(0.0)

        return sum(scores) / len(scores) if scores else 0.0
