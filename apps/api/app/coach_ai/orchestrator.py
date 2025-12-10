"""Coach orchestrator for coordinating LLM interactions."""

from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

import structlog

from app.coach_ai.models import AISession, AIToolCallLog, ToolCallStatus
from app.coach_ai.prompts.system_prompts import get_system_prompt
from app.coach_ai.providers.base import Message
from app.coach_ai.providers.model_config import get_model_config
from app.coach_ai.providers.openai_provider import OpenAIProvider, parse_tool_arguments
from app.coach_ai.schemas import ChatMessage, DailyTarget, StreamEvent, WeeklyPlanResponse
from app.coach_ai.tools.adherence_tools import GetAdherenceMetricsTool
from app.coach_ai.tools.checkin_tools import GetRecentCheckinsTool, GetWeightTrendTool
from app.coach_ai.tools.nutrition_tools import CalculateTDEETool, GetNutritionSummaryTool
from app.coach_ai.tools.registry import ToolRegistry
from app.coach_ai.tools.user_tools import GetUserProfileTool
from app.config import get_settings

if TYPE_CHECKING:
    from collections.abc import AsyncIterator
    from typing import Any

    from sqlalchemy.ext.asyncio import AsyncSession

    from app.coach_ai.context_builder import CoachContext
    from app.coach_ai.tools.base import BaseTool

logger = structlog.get_logger()


@dataclass
class OrchestratorResult:
    """Result from orchestrator processing."""

    response: str
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    tokens_used: int = 0
    finish_reason: str = "stop"


class CoachOrchestrator:
    """Coordinates LLM interactions with tools and policies."""

    def __init__(
        self,
        session: AsyncSession,
        redis_client: Any | None = None,
    ) -> None:
        """Initialize the orchestrator.

        Args:
            session: Database session.
            redis_client: Optional Redis client for caching.
        """
        self.session = session
        self._redis_client = redis_client
        self._provider: OpenAIProvider | None = None
        self._tool_registry: ToolRegistry | None = None

    def _get_provider(self, tier: str = "standard") -> OpenAIProvider:
        """Get or create LLM provider."""
        settings = get_settings()
        config = get_model_config(tier)
        return OpenAIProvider(config=config, api_key=settings.openai_api_key)

    def _get_tool_registry(self) -> ToolRegistry:
        """Get or create tool registry with registered tools."""
        if self._tool_registry is None:
            self._tool_registry = ToolRegistry(redis_client=self._redis_client)

            # Register internal tools
            tools: list[BaseTool] = [
                GetUserProfileTool(self.session),
                GetRecentCheckinsTool(self.session),
                GetWeightTrendTool(self.session),
                GetNutritionSummaryTool(self.session),
                CalculateTDEETool(self.session),
                GetAdherenceMetricsTool(self.session),
            ]

            for tool in tools:
                self._tool_registry.register(tool)

        return self._tool_registry

    async def process_message(
        self,
        user_id: uuid.UUID,
        message: str,
        user_context: CoachContext,
        session: AISession,
        conversation_history: list[ChatMessage] | None = None,
    ) -> OrchestratorResult:
        """Process a user message and generate a response.

        Args:
            user_id: The user's ID.
            message: The user's message.
            user_context: Pre-built user context.
            session: The AI session.
            conversation_history: Optional conversation history.

        Returns:
            OrchestratorResult with response and metadata.
        """
        provider = self._get_provider(session.model_tier)
        registry = self._get_tool_registry()

        # Build messages
        messages = self._build_messages(message, user_context, conversation_history)

        # Get available tool definitions
        tool_definitions = registry.get_tool_definitions(str(user_id), include_external=False)

        # Track tool calls for explainability
        tool_traces: list[dict[str, Any]] = []
        total_tokens = 0

        # Iterate until we get a final response (max 5 tool call rounds)
        max_iterations = 5
        for _ in range(max_iterations):
            # Call LLM
            response = await provider.chat(
                messages=messages,
                tools=tool_definitions if tool_definitions else None,
            )

            total_tokens += response.usage.get("prompt_tokens", 0)
            total_tokens += response.usage.get("completion_tokens", 0)

            # If no tool calls, we're done
            if not response.tool_calls or response.finish_reason != "tool_calls":
                return OrchestratorResult(
                    response=response.content or "",
                    tool_calls=tool_traces,
                    tokens_used=total_tokens,
                    finish_reason=response.finish_reason,
                )

            # Process tool calls
            messages.append(
                Message(
                    role="assistant",
                    content=response.content,
                    tool_calls=response.tool_calls,
                )
            )

            for tool_call in response.tool_calls:
                tool_name = tool_call["function"]["name"]
                arguments_str = tool_call["function"]["arguments"]
                tool_call_id = tool_call["id"]

                # Parse arguments
                arguments = parse_tool_arguments(arguments_str)

                # Execute tool
                start_time = time.time()
                result = await registry.execute_tool(tool_name, str(user_id), arguments)
                latency_ms = int((time.time() - start_time) * 1000)

                # Log tool call
                await self._log_tool_call(
                    session_id=session.id,
                    user_id=user_id,
                    tool_name=tool_name,
                    arguments=arguments,
                    result=result,
                    latency_ms=latency_ms,
                )

                # Build tool trace for explainability
                tool = registry.get_tool(tool_name)
                tool_traces.append(
                    {
                        "name": tool_name,
                        "description": tool.description if tool else "Unknown tool",
                        "input_summary": tool.get_input_summary(**arguments)
                        if tool
                        else str(arguments),
                        "output_summary": self._summarize_output(result.data)
                        if result.success
                        else result.error,
                        "latency_ms": latency_ms,
                        "cached": result.cached,
                    }
                )

                # Add tool result to messages
                result_content = (
                    json.dumps(result.data) if result.success else f"Error: {result.error}"
                )
                messages.append(
                    Message(
                        role="tool",
                        content=result_content,
                        tool_call_id=tool_call_id,
                        name=tool_name,
                    )
                )

        # If we hit max iterations, return what we have
        return OrchestratorResult(
            response="I apologize, but I'm having trouble processing your request. Please try again.",
            tool_calls=tool_traces,
            tokens_used=total_tokens,
            finish_reason="max_iterations",
        )

    async def process_message_stream(
        self,
        user_id: uuid.UUID,
        message: str,
        user_context: CoachContext,
        session: AISession,
        conversation_history: list[ChatMessage] | None = None,
    ) -> AsyncIterator[StreamEvent]:
        """Stream a response to a user message.

        Args:
            user_id: The user's ID.
            message: The user's message.
            user_context: Pre-built user context.
            session: The AI session.
            conversation_history: Optional conversation history.

        Yields:
            StreamEvent objects with response chunks.
        """
        provider = self._get_provider(session.model_tier)
        registry = self._get_tool_registry()

        # Build messages
        messages = self._build_messages(message, user_context, conversation_history)

        # Get available tool definitions
        tool_definitions = registry.get_tool_definitions(str(user_id), include_external=False)

        # Stream response
        accumulated_content = ""
        accumulated_tool_calls: list[dict[str, Any]] = []

        async for chunk in provider.chat_stream(
            messages=messages,
            tools=tool_definitions if tool_definitions else None,
        ):
            if isinstance(chunk, str):
                accumulated_content += chunk
                yield StreamEvent(type="token", data=chunk)
            elif isinstance(chunk, dict) and "tool_calls" in chunk:
                accumulated_tool_calls = chunk["tool_calls"]

        # If we have tool calls, execute them and continue
        if accumulated_tool_calls:
            # Add assistant message with tool calls
            messages.append(
                Message(
                    role="assistant",
                    content=accumulated_content if accumulated_content else None,
                    tool_calls=accumulated_tool_calls,
                )
            )

            # Execute each tool call
            for tool_call in accumulated_tool_calls:
                tool_name = tool_call["function"]["name"]
                arguments_str = tool_call["function"]["arguments"]
                tool_call_id = tool_call["id"]

                yield StreamEvent(type="tool_start", data={"tool": tool_name})

                arguments = parse_tool_arguments(arguments_str)
                start_time = time.time()
                result = await registry.execute_tool(tool_name, str(user_id), arguments)
                latency_ms = int((time.time() - start_time) * 1000)

                await self._log_tool_call(
                    session_id=session.id,
                    user_id=user_id,
                    tool_name=tool_name,
                    arguments=arguments,
                    result=result,
                    latency_ms=latency_ms,
                )

                yield StreamEvent(
                    type="tool_end",
                    data={
                        "tool": tool_name,
                        "success": result.success,
                        "latency_ms": latency_ms,
                    },
                )

                # Add tool result
                result_content = (
                    json.dumps(result.data) if result.success else f"Error: {result.error}"
                )
                messages.append(
                    Message(
                        role="tool",
                        content=result_content,
                        tool_call_id=tool_call_id,
                        name=tool_name,
                    )
                )

            # Get final response after tool execution
            async for chunk in provider.chat_stream(messages=messages, tools=None):
                if isinstance(chunk, str):
                    yield StreamEvent(type="token", data=chunk)

    async def generate_plan(
        self,
        user_id: uuid.UUID,  # noqa: ARG002
        user_context: CoachContext,
        start_date: Any,
        preferences: dict[str, Any] | None = None,
    ) -> WeeklyPlanResponse:
        """Generate a weekly plan for the user.

        Args:
            user_id: The user's ID (kept for interface consistency).
            user_context: Pre-built user context.
            start_date: Start date for the plan.
            preferences: Optional user preferences for the plan.

        Returns:
            WeeklyPlanResponse with the generated plan.
        """
        provider = self._get_provider("standard")

        # Build context summary
        context_summary = user_context.get_context_summary()

        # Build plan prompt
        system_prompt = get_system_prompt("plan")
        user_prompt = f"""Based on this user's data, create a weekly plan:

{context_summary}

Additional preferences: {json.dumps(preferences) if preferences else "None specified"}

Please provide:
1. Daily calorie and macro targets (as JSON)
2. 2-3 focus areas for the week
3. 3-5 specific recommendations

Format your response as JSON with keys: daily_targets, focus_areas, recommendations
"""

        messages = [
            Message(role="system", content=system_prompt),
            Message(role="user", content=user_prompt),
        ]

        response = await provider.chat(messages=messages, tools=None)

        # Parse response
        try:
            plan_data = json.loads(response.content or "{}")
        except json.JSONDecodeError:
            # Default plan if parsing fails
            plan_data = {
                "daily_targets": user_context.calculated_targets or {},
                "focus_areas": ["Consistent check-ins", "Meeting protein targets"],
                "recommendations": ["Log your weight daily", "Focus on protein with each meal"],
            }

        daily_targets = plan_data.get("daily_targets", {})
        if not daily_targets and user_context.calculated_targets:
            daily_targets = user_context.calculated_targets

        return WeeklyPlanResponse(
            plan_id=uuid.uuid4(),
            week_start=start_date,
            daily_targets=DailyTarget(
                calories=daily_targets.get("target_calories", 2000),
                protein_g=daily_targets.get("protein_g", 150),
                carbs_g=daily_targets.get("carbs_g", 200),
                fat_g=daily_targets.get("fat_g", 70),
            ),
            focus_areas=plan_data.get("focus_areas", []),
            recommendations=plan_data.get("recommendations", []),
            confidence=0.8 if user_context.calculated_targets else 0.5,
        )

    def _build_messages(
        self,
        user_message: str,
        context: CoachContext,
        history: list[ChatMessage] | None,
    ) -> list[Message]:
        """Build the message list for the LLM.

        Uses compact context summary for token efficiency and limits
        conversation history to last 6 messages (3 rounds).
        """
        messages: list[Message] = []

        # System prompt with compact context (saves ~40% tokens)
        system_content = get_system_prompt("coach")
        context_summary = context.get_compact_summary()
        if context_summary:
            system_content += f"\n\n## User Context\n{context_summary}"

        messages.append(Message(role="system", content=system_content))

        # Add conversation history - limit to last 6 messages (3 rounds)
        # This saves significant tokens while maintaining conversation coherence
        if history:
            recent_history = history[-6:]
            for msg in recent_history:
                messages.append(Message(role=msg.role, content=msg.content))

        # Add current user message
        messages.append(Message(role="user", content=user_message))

        return messages

    async def _log_tool_call(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        tool_name: str,
        arguments: dict[str, Any],
        result: Any,
        latency_ms: int,
    ) -> None:
        """Log a tool call to the database."""
        import hashlib

        tool = self._get_tool_registry().get_tool(tool_name)

        input_hash = hashlib.sha256(
            json.dumps(arguments, sort_keys=True, default=str).encode()
        ).hexdigest()[:64]

        log_entry = AIToolCallLog(
            session_id=session_id,
            user_id=user_id,
            tool_name=tool_name,
            tool_category=tool.category if tool else "unknown",
            input_hash=input_hash,
            input_summary=tool.get_input_summary(**arguments)[:500]
            if tool
            else str(arguments)[:500],
            output_summary=self._summarize_output(result.data)[:1000]
            if result.success
            else result.error,
            status=ToolCallStatus.SUCCESS if result.success else ToolCallStatus.FAILED,
            error_message=result.error[:500] if result.error else None,
            latency_ms=latency_ms,
            cached=result.cached,
        )
        self.session.add(log_entry)
        # Don't commit - let calling code handle transaction

    def _summarize_output(self, data: Any) -> str:
        """Create a human-readable summary of tool output."""
        if data is None:
            return "No data"

        if isinstance(data, dict):
            # Extract key information
            summary_parts = []
            for key, value in list(data.items())[:5]:  # First 5 items
                if value is not None:
                    if isinstance(value, (list, dict)):
                        summary_parts.append(f"{key}: {len(value)} items")
                    else:
                        summary_parts.append(f"{key}: {value}")
            return ", ".join(summary_parts)

        return str(data)[:200]
