"""Unit tests for CoachOrchestrator."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.coach_ai.context_builder import CoachContext
from app.coach_ai.models import AISession, SessionStatus
from app.coach_ai.orchestrator import CoachOrchestrator, OrchestratorResult
from app.coach_ai.providers.base import Message
from app.coach_ai.schemas import ChatMessage, DailyTarget, WeeklyPlanResponse
from app.coach_ai.tools.base import ToolResult

from tests.fixtures.llm_mocks import MockLLMResponse


@pytest.fixture
def mock_db_session() -> AsyncMock:
    """Create a mock database session."""
    session = AsyncMock(spec=AsyncSession)
    session.commit = AsyncMock()
    session.add = MagicMock()
    return session


@pytest.fixture
def sample_user_id() -> uuid.UUID:
    """Create a sample user ID."""
    return uuid.uuid4()


@pytest.fixture
def sample_ai_session(sample_user_id: uuid.UUID) -> AISession:
    """Create a sample AI session."""
    return AISession(
        id=uuid.uuid4(),
        user_id=sample_user_id,
        model_tier="standard",
        status=SessionStatus.ACTIVE,
        message_count=0,
        tokens_used=0,
        conversation_history=[],
    )


@pytest.fixture
def sample_coach_context(sample_user_id: uuid.UUID) -> CoachContext:
    """Create a sample coach context."""
    return CoachContext(
        user_id=sample_user_id,
        user_profile={
            "display_name": "Test User",
            "height_cm": 175.0,
            "sex": "male",
            "birth_year": 1990,
            "activity_level": "moderate",
        },
        user_goal={
            "goal_type": "fat_loss",
            "target_weight_kg": 75.0,
        },
        weight_trend={
            "weekly_rate_of_change_kg": -0.5,
            "current_weight_kg": 80.0,
        },
        calculated_targets={
            "target_calories": 2000,
            "protein_g": 150,
            "carbs_g": 200,
            "fat_g": 70,
        },
    )


@pytest.fixture
def orchestrator(mock_db_session: AsyncMock) -> CoachOrchestrator:
    """Create a CoachOrchestrator instance."""
    return CoachOrchestrator(mock_db_session)


class TestCoachOrchestratorInit:
    """Tests for CoachOrchestrator initialization."""

    def test_init(self, orchestrator: CoachOrchestrator, mock_db_session: AsyncMock) -> None:
        """Test orchestrator initialization."""
        assert orchestrator.session is mock_db_session
        assert orchestrator._provider is None
        assert orchestrator._tool_registry is None


class TestCoachOrchestratorGetProvider:
    """Tests for _get_provider method."""

    def test_get_provider_creates_instance(self, orchestrator: CoachOrchestrator) -> None:
        """Test that _get_provider creates provider instance."""
        with patch("app.coach_ai.orchestrator.get_settings") as mock_settings:
            mock_settings.return_value.openai_api_key = "test-key"
            with patch("app.coach_ai.orchestrator.OpenAIProvider") as mock_provider:
                provider = orchestrator._get_provider("standard")

                mock_provider.assert_called_once()


class TestCoachOrchestratorGetToolRegistry:
    """Tests for _get_tool_registry method."""

    def test_get_tool_registry_creates_and_caches(
        self, orchestrator: CoachOrchestrator
    ) -> None:
        """Test that _get_tool_registry creates and caches registry."""
        registry1 = orchestrator._get_tool_registry()
        registry2 = orchestrator._get_tool_registry()

        assert registry1 is registry2  # Same instance

    def test_get_tool_registry_registers_tools(
        self, orchestrator: CoachOrchestrator
    ) -> None:
        """Test that internal tools are registered."""
        registry = orchestrator._get_tool_registry()

        # Should have registered internal tools
        assert len(registry._tools) >= 1

        # Check for specific tools
        tool_names = list(registry._tools.keys())
        assert any("profile" in name or "user" in name for name in tool_names)


class TestCoachOrchestratorProcessMessage:
    """Tests for process_message method."""

    @pytest.mark.asyncio
    async def test_process_message_returns_result(
        self,
        orchestrator: CoachOrchestrator,
        sample_user_id: uuid.UUID,
        sample_ai_session: AISession,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that process_message returns OrchestratorResult."""
        with patch.object(orchestrator, "_get_provider") as mock_get_provider:
            mock_provider = AsyncMock()
            mock_provider.chat = AsyncMock(
                return_value=MockLLMResponse(
                    content="Hello! How can I help?",
                    tool_calls=None,
                    finish_reason="stop",
                )
            )
            mock_get_provider.return_value = mock_provider

            result = await orchestrator.process_message(
                user_id=sample_user_id,
                message="Hello",
                user_context=sample_coach_context,
                session=sample_ai_session,
            )

        assert isinstance(result, OrchestratorResult)
        assert result.response == "Hello! How can I help?"
        assert result.finish_reason == "stop"

    @pytest.mark.asyncio
    async def test_process_message_with_tool_calls(
        self,
        orchestrator: CoachOrchestrator,
        sample_user_id: uuid.UUID,
        sample_ai_session: AISession,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test process_message handles tool calls."""
        with patch.object(orchestrator, "_get_provider") as mock_get_provider:
            mock_provider = AsyncMock()

            # First call returns tool call, second returns final response
            mock_provider.chat = AsyncMock(
                side_effect=[
                    MockLLMResponse(
                        content=None,
                        tool_calls=[
                            {
                                "id": "call_123",
                                "function": {
                                    "name": "get_user_profile",
                                    "arguments": "{}",
                                },
                            }
                        ],
                        finish_reason="tool_calls",
                    ),
                    MockLLMResponse(
                        content="Based on your profile, here's my recommendation.",
                        tool_calls=None,
                        finish_reason="stop",
                    ),
                ]
            )
            mock_get_provider.return_value = mock_provider

            # Mock tool registry
            with patch.object(orchestrator, "_get_tool_registry") as mock_get_registry:
                mock_registry = MagicMock()
                mock_registry.get_tool_definitions.return_value = []
                mock_registry.execute_tool = AsyncMock(
                    return_value=ToolResult(
                        success=True,
                        data={"name": "Test User", "height_cm": 175},
                    )
                )
                mock_registry.get_tool.return_value = MagicMock(
                    description="Get user profile",
                    get_input_summary=MagicMock(return_value="No parameters"),
                    category="internal",
                )
                mock_get_registry.return_value = mock_registry

                with patch.object(
                    orchestrator, "_log_tool_call", new_callable=AsyncMock
                ):
                    result = await orchestrator.process_message(
                        user_id=sample_user_id,
                        message="What's my profile?",
                        user_context=sample_coach_context,
                        session=sample_ai_session,
                    )

        assert result.response == "Based on your profile, here's my recommendation."
        assert len(result.tool_calls) == 1
        assert result.tool_calls[0]["name"] == "get_user_profile"

    @pytest.mark.asyncio
    async def test_process_message_max_iterations(
        self,
        orchestrator: CoachOrchestrator,
        sample_user_id: uuid.UUID,
        sample_ai_session: AISession,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that max iterations are enforced."""
        with patch.object(orchestrator, "_get_provider") as mock_get_provider:
            mock_provider = AsyncMock()
            # Always return tool calls to trigger max iterations
            mock_provider.chat = AsyncMock(
                return_value=MockLLMResponse(
                    content=None,
                    tool_calls=[
                        {
                            "id": "call_123",
                            "function": {
                                "name": "get_user_profile",
                                "arguments": "{}",
                            },
                        }
                    ],
                    finish_reason="tool_calls",
                )
            )
            mock_get_provider.return_value = mock_provider

            with patch.object(orchestrator, "_get_tool_registry") as mock_get_registry:
                mock_registry = MagicMock()
                mock_registry.get_tool_definitions.return_value = []
                mock_registry.execute_tool = AsyncMock(
                    return_value=ToolResult(success=True, data={})
                )
                mock_registry.get_tool.return_value = MagicMock(
                    description="Mock tool",
                    get_input_summary=MagicMock(return_value=""),
                    category="internal",
                )
                mock_get_registry.return_value = mock_registry

                with patch.object(
                    orchestrator, "_log_tool_call", new_callable=AsyncMock
                ):
                    result = await orchestrator.process_message(
                        user_id=sample_user_id,
                        message="Loop forever",
                        user_context=sample_coach_context,
                        session=sample_ai_session,
                    )

        assert result.finish_reason == "max_iterations"
        assert "trouble processing" in result.response.lower()

    @pytest.mark.asyncio
    async def test_process_message_with_history(
        self,
        orchestrator: CoachOrchestrator,
        sample_user_id: uuid.UUID,
        sample_ai_session: AISession,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test process_message includes conversation history."""
        history = [
            ChatMessage(role="user", content="Hi"),
            ChatMessage(role="assistant", content="Hello!"),
        ]

        with patch.object(orchestrator, "_get_provider") as mock_get_provider:
            mock_provider = AsyncMock()
            mock_provider.chat = AsyncMock(
                return_value=MockLLMResponse(
                    content="I remember you!",
                    finish_reason="stop",
                )
            )
            mock_get_provider.return_value = mock_provider

            await orchestrator.process_message(
                user_id=sample_user_id,
                message="Do you remember?",
                user_context=sample_coach_context,
                session=sample_ai_session,
                conversation_history=history,
            )

            # Verify chat was called with messages including history
            call_args = mock_provider.chat.call_args
            messages = call_args.kwargs["messages"]

            # Should include system + history (2) + current user
            assert len(messages) >= 4


class TestCoachOrchestratorBuildMessages:
    """Tests for _build_messages method."""

    def test_build_messages_includes_system(
        self,
        orchestrator: CoachOrchestrator,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that messages include system prompt."""
        messages = orchestrator._build_messages(
            "Hello", sample_coach_context, None
        )

        assert messages[0].role == "system"
        assert len(messages[0].content) > 0

    def test_build_messages_includes_user(
        self,
        orchestrator: CoachOrchestrator,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that messages include user message."""
        messages = orchestrator._build_messages(
            "Hello coach!", sample_coach_context, None
        )

        assert messages[-1].role == "user"
        assert messages[-1].content == "Hello coach!"

    def test_build_messages_includes_context(
        self,
        orchestrator: CoachOrchestrator,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that system prompt includes context."""
        messages = orchestrator._build_messages(
            "Hello", sample_coach_context, None
        )

        system_content = messages[0].content
        # Context summary should be included
        assert "User" in system_content or "Context" in system_content

    def test_build_messages_includes_history(
        self,
        orchestrator: CoachOrchestrator,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that messages include conversation history."""
        history = [
            ChatMessage(role="user", content="Previous question"),
            ChatMessage(role="assistant", content="Previous answer"),
        ]

        messages = orchestrator._build_messages(
            "New question", sample_coach_context, history
        )

        # Should have: system + history (2) + current
        assert len(messages) == 4

    def test_build_messages_limits_history(
        self,
        orchestrator: CoachOrchestrator,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that history is limited to last 10 messages."""
        history = [
            ChatMessage(role="user", content=f"msg{i}") for i in range(15)
        ]

        messages = orchestrator._build_messages(
            "Current", sample_coach_context, history
        )

        # Should have: system + 10 history + current = 12
        assert len(messages) == 12


class TestCoachOrchestratorGeneratePlan:
    """Tests for generate_plan method."""

    @pytest.mark.asyncio
    async def test_generate_plan_returns_response(
        self,
        orchestrator: CoachOrchestrator,
        sample_user_id: uuid.UUID,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that generate_plan returns WeeklyPlanResponse."""
        with patch.object(orchestrator, "_get_provider") as mock_get_provider:
            mock_provider = AsyncMock()
            mock_provider.chat = AsyncMock(
                return_value=MockLLMResponse(
                    content='{"daily_targets": {"target_calories": 2000, "protein_g": 150}, "focus_areas": ["Track weight daily"], "recommendations": ["Eat more protein"]}',
                    finish_reason="stop",
                )
            )
            mock_get_provider.return_value = mock_provider

            from datetime import datetime

            result = await orchestrator.generate_plan(
                user_id=sample_user_id,
                user_context=sample_coach_context,
                start_date=datetime.utcnow(),
            )

        assert isinstance(result, WeeklyPlanResponse)
        assert isinstance(result.daily_targets, DailyTarget)
        assert len(result.focus_areas) > 0

    @pytest.mark.asyncio
    async def test_generate_plan_handles_invalid_json(
        self,
        orchestrator: CoachOrchestrator,
        sample_user_id: uuid.UUID,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that generate_plan handles invalid JSON gracefully."""
        with patch.object(orchestrator, "_get_provider") as mock_get_provider:
            mock_provider = AsyncMock()
            mock_provider.chat = AsyncMock(
                return_value=MockLLMResponse(
                    content="Not valid JSON response",
                    finish_reason="stop",
                )
            )
            mock_get_provider.return_value = mock_provider

            from datetime import datetime

            result = await orchestrator.generate_plan(
                user_id=sample_user_id,
                user_context=sample_coach_context,
                start_date=datetime.utcnow(),
            )

        # Should return default plan
        assert isinstance(result, WeeklyPlanResponse)
        assert result.daily_targets.calories > 0


class TestCoachOrchestratorSummarizeOutput:
    """Tests for _summarize_output method."""

    def test_summarize_output_none(self, orchestrator: CoachOrchestrator) -> None:
        """Test summarizing None."""
        result = orchestrator._summarize_output(None)
        assert result == "No data"

    def test_summarize_output_dict(self, orchestrator: CoachOrchestrator) -> None:
        """Test summarizing dict."""
        data = {"name": "Test", "value": 123, "items": [1, 2, 3]}
        result = orchestrator._summarize_output(data)

        assert "name: Test" in result
        assert "value: 123" in result
        assert "items: 3 items" in result

    def test_summarize_output_string(self, orchestrator: CoachOrchestrator) -> None:
        """Test summarizing string."""
        result = orchestrator._summarize_output("Simple string")
        assert "Simple string" in result

    def test_summarize_output_truncates(self, orchestrator: CoachOrchestrator) -> None:
        """Test that long output is truncated."""
        long_string = "x" * 500
        result = orchestrator._summarize_output(long_string)

        assert len(result) <= 200
