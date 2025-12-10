"""Unit tests for CoachService."""

import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.coach_ai.context_builder import CoachContext
from app.coach_ai.models import AISession, SessionStatus
from app.coach_ai.orchestrator import OrchestratorResult
from app.coach_ai.policies.base import PolicyAction, PolicyResult
from app.coach_ai.schemas import (
    ChatResponse,
    InsightsResponse,
)
from app.coach_ai.service import CoachService


@pytest.fixture
def mock_db_session() -> AsyncMock:
    """Create a mock database session."""
    session = AsyncMock(spec=AsyncSession)
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
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
            "pace_preference": "moderate",
        },
        recent_checkins=[
            {"date": "2024-01-15", "weight_kg": 80.0},
            {"date": "2024-01-14", "weight_kg": 80.2},
            {"date": "2024-01-13", "weight_kg": 80.3},
            {"date": "2024-01-12", "weight_kg": 80.5},
            {"date": "2024-01-11", "weight_kg": 80.6},
            {"date": "2024-01-10", "weight_kg": 80.8},
            {"date": "2024-01-09", "weight_kg": 81.0},
        ],
        recent_nutrition=[
            {"date": "2024-01-15", "calories": 2000, "protein_g": 150},
            {"date": "2024-01-14", "calories": 1900, "protein_g": 140},
            {"date": "2024-01-13", "calories": 2100, "protein_g": 160},
            {"date": "2024-01-12", "calories": 2000, "protein_g": 150},
            {"date": "2024-01-11", "calories": 1800, "protein_g": 130},
            {"date": "2024-01-10", "calories": 2050, "protein_g": 155},
            {"date": "2024-01-09", "calories": 1950, "protein_g": 145},
        ],
        weight_trend={
            "weekly_rate_of_change_kg": -0.5,
            "current_weight_kg": 80.0,
        },
        adherence_metrics={
            "checkin_completion_rate": 0.85,
            "current_streak": 5,
        },
        calculated_targets={
            "target_calories": 2000,
            "protein_g": 150,
            "tdee": 2500,
        },
    )


class TestCoachServiceInit:
    """Tests for CoachService initialization."""

    def test_init_creates_dependencies(self, mock_db_session: AsyncMock) -> None:
        """Test that initialization creates required dependencies."""
        service = CoachService(mock_db_session)

        assert service.session is mock_db_session
        assert service.context_builder is not None
        assert service.policy_engine is not None
        assert service.orchestrator is not None


class TestCoachServiceChat:
    """Tests for chat method."""

    @pytest.mark.asyncio
    async def test_chat_returns_response(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
        sample_ai_session: AISession,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that chat returns a ChatResponse."""
        service = CoachService(mock_db_session)

        with patch.object(
            service, "_get_or_create_session", new_callable=AsyncMock
        ) as mock_session:
            mock_session.return_value = sample_ai_session

            with patch.object(
                service.context_builder, "build_context", new_callable=AsyncMock
            ) as mock_context:
                mock_context.return_value = sample_coach_context

                with patch.object(
                    service.policy_engine, "check_input", new_callable=AsyncMock
                ) as mock_input_check:
                    mock_input_check.return_value = PolicyResult(
                        passed=True,
                        action=PolicyAction.ALLOW,
                    )

                    with patch.object(
                        service.orchestrator, "process_message", new_callable=AsyncMock
                    ) as mock_orchestrator:
                        mock_orchestrator.return_value = OrchestratorResult(
                            response="Hello! How can I help?",
                            tool_calls=[],
                            tokens_used=100,
                        )

                        with patch.object(
                            service.policy_engine, "check_output", new_callable=AsyncMock
                        ) as mock_output_check:
                            mock_output_check.return_value = PolicyResult(
                                passed=True,
                                action=PolicyAction.ALLOW,
                            )

                            response = await service.chat(sample_user_id, "Hello coach!")

        assert isinstance(response, ChatResponse)
        assert response.message == "Hello! How can I help?"
        assert response.session_id == sample_ai_session.id

    @pytest.mark.asyncio
    async def test_chat_blocked_by_input_policy(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
        sample_ai_session: AISession,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that blocked input returns safety message without calling LLM."""
        service = CoachService(mock_db_session)

        with patch.object(
            service, "_get_or_create_session", new_callable=AsyncMock
        ) as mock_session:
            mock_session.return_value = sample_ai_session

            with patch.object(
                service.context_builder, "build_context", new_callable=AsyncMock
            ) as mock_context:
                mock_context.return_value = sample_coach_context

                with patch.object(
                    service.policy_engine, "check_input", new_callable=AsyncMock
                ) as mock_input_check:
                    mock_input_check.return_value = PolicyResult(
                        passed=False,
                        action=PolicyAction.FLAG,
                        message="I'm concerned about your wellbeing. Please reach out.",
                    )

                    with patch.object(
                        service.orchestrator, "process_message", new_callable=AsyncMock
                    ) as mock_orchestrator:
                        response = await service.chat(sample_user_id, "I want to purge")

                        # Orchestrator should not be called
                        mock_orchestrator.assert_not_called()

        assert response.message == "I'm concerned about your wellbeing. Please reach out."
        assert response.tokens_used == 0  # No LLM call

    @pytest.mark.asyncio
    async def test_chat_modifies_output_with_disclaimer(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
        sample_ai_session: AISession,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that output policy can modify the response."""
        service = CoachService(mock_db_session)

        with patch.object(
            service, "_get_or_create_session", new_callable=AsyncMock
        ) as mock_session:
            mock_session.return_value = sample_ai_session

            with patch.object(
                service.context_builder, "build_context", new_callable=AsyncMock
            ) as mock_context:
                mock_context.return_value = sample_coach_context

                with patch.object(
                    service.policy_engine, "check_input", new_callable=AsyncMock
                ) as mock_input_check:
                    mock_input_check.return_value = PolicyResult(
                        passed=True, action=PolicyAction.ALLOW
                    )

                    with patch.object(
                        service.orchestrator, "process_message", new_callable=AsyncMock
                    ) as mock_orchestrator:
                        mock_orchestrator.return_value = OrchestratorResult(
                            response="Try 1100 calories",
                            tool_calls=[],
                            tokens_used=100,
                        )

                        with patch.object(
                            service.policy_engine, "check_output", new_callable=AsyncMock
                        ) as mock_output_check:
                            mock_output_check.return_value = PolicyResult(
                                passed=True,
                                action=PolicyAction.MODIFY,
                                modified_content="Try 1100 calories. [Disclaimer: 1200 is minimum for women]",
                            )

                            response = await service.chat(sample_user_id, "What calories?")

        assert "Disclaimer" in response.message

    @pytest.mark.asyncio
    async def test_chat_updates_session(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
        sample_ai_session: AISession,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that chat updates session history."""
        service = CoachService(mock_db_session)
        initial_count = sample_ai_session.message_count

        with patch.object(
            service, "_get_or_create_session", new_callable=AsyncMock
        ) as mock_session:
            mock_session.return_value = sample_ai_session

            with patch.object(
                service.context_builder, "build_context", new_callable=AsyncMock
            ) as mock_context:
                mock_context.return_value = sample_coach_context

                with patch.object(
                    service.policy_engine, "check_input", new_callable=AsyncMock
                ) as mock_input_check:
                    mock_input_check.return_value = PolicyResult(
                        passed=True, action=PolicyAction.ALLOW
                    )

                    with patch.object(
                        service.orchestrator, "process_message", new_callable=AsyncMock
                    ) as mock_orchestrator:
                        mock_orchestrator.return_value = OrchestratorResult(
                            response="Response",
                            tool_calls=[],
                            tokens_used=100,
                        )

                        with patch.object(
                            service.policy_engine, "check_output", new_callable=AsyncMock
                        ) as mock_output_check:
                            mock_output_check.return_value = PolicyResult(
                                passed=True, action=PolicyAction.ALLOW
                            )

                            await service.chat(sample_user_id, "Hello")

        # Session should be updated
        assert sample_ai_session.message_count == initial_count + 2  # User + assistant
        assert len(sample_ai_session.conversation_history) == 2
        mock_db_session.commit.assert_called()

    @pytest.mark.asyncio
    async def test_chat_trims_conversation_history(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
        sample_ai_session: AISession,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that conversation history is trimmed to 20 messages."""
        service = CoachService(mock_db_session)

        # Pre-populate with 22 messages
        sample_ai_session.conversation_history = [
            {"role": "user", "content": f"msg{i}"} for i in range(22)
        ]

        with patch.object(
            service, "_get_or_create_session", new_callable=AsyncMock
        ) as mock_session:
            mock_session.return_value = sample_ai_session

            with patch.object(
                service.context_builder, "build_context", new_callable=AsyncMock
            ) as mock_context:
                mock_context.return_value = sample_coach_context

                with patch.object(
                    service.policy_engine, "check_input", new_callable=AsyncMock
                ) as mock_input_check:
                    mock_input_check.return_value = PolicyResult(
                        passed=True, action=PolicyAction.ALLOW
                    )

                    with patch.object(
                        service.orchestrator, "process_message", new_callable=AsyncMock
                    ) as mock_orchestrator:
                        mock_orchestrator.return_value = OrchestratorResult(
                            response="Response",
                            tool_calls=[],
                            tokens_used=100,
                        )

                        with patch.object(
                            service.policy_engine, "check_output", new_callable=AsyncMock
                        ) as mock_output_check:
                            mock_output_check.return_value = PolicyResult(
                                passed=True, action=PolicyAction.ALLOW
                            )

                            await service.chat(sample_user_id, "Hello")

        # Should be trimmed to 20
        assert len(sample_ai_session.conversation_history) == 20


class TestCoachServiceCalculateConfidence:
    """Tests for confidence calculation."""

    def test_calculate_confidence_full_data(
        self,
        mock_db_session: AsyncMock,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test confidence with full data."""
        service = CoachService(mock_db_session)
        confidence = service._calculate_confidence(sample_coach_context)

        # Full data should give high confidence
        assert confidence >= 0.8

    def test_calculate_confidence_no_data(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
    ) -> None:
        """Test confidence with no data."""
        service = CoachService(mock_db_session)
        minimal_context = CoachContext(user_id=sample_user_id)

        confidence = service._calculate_confidence(minimal_context)

        # No data should give low confidence
        assert confidence <= 0.3

    def test_calculate_confidence_partial_data(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
    ) -> None:
        """Test confidence with partial data."""
        service = CoachService(mock_db_session)
        partial_context = CoachContext(
            user_id=sample_user_id,
            recent_checkins=[{"date": "2024-01-15", "weight_kg": 80.0}],
            user_profile={"sex": "male"},
        )

        confidence = service._calculate_confidence(partial_context)

        # Partial data should give medium confidence
        assert 0.2 < confidence < 0.8


class TestCoachServiceIdentifyDataGaps:
    """Tests for data gap identification."""

    def test_identify_data_gaps_checkins(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
    ) -> None:
        """Test identifying missing check-in data."""
        service = CoachService(mock_db_session)
        context = CoachContext(
            user_id=sample_user_id,
            recent_checkins=[],  # No checkins
        )

        gaps = service._identify_data_gaps(context)

        checkin_gap = next((g for g in gaps if g.field == "check_ins"), None)
        assert checkin_gap is not None
        assert "weight" in checkin_gap.suggestion.lower()

    def test_identify_data_gaps_nutrition(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
    ) -> None:
        """Test identifying missing nutrition data."""
        service = CoachService(mock_db_session)
        context = CoachContext(
            user_id=sample_user_id,
            recent_nutrition=[],  # No nutrition
        )

        gaps = service._identify_data_gaps(context)

        nutrition_gap = next((g for g in gaps if g.field == "nutrition"), None)
        assert nutrition_gap is not None
        assert "calorie" in nutrition_gap.suggestion.lower()

    def test_identify_data_gaps_profile_height(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
    ) -> None:
        """Test identifying missing height."""
        service = CoachService(mock_db_session)
        context = CoachContext(
            user_id=sample_user_id,
            user_profile={"sex": "male"},  # No height
        )

        gaps = service._identify_data_gaps(context)

        height_gap = next((g for g in gaps if g.field == "profile.height"), None)
        assert height_gap is not None
        assert "height" in height_gap.suggestion.lower()

    def test_identify_no_gaps_with_complete_data(
        self,
        mock_db_session: AsyncMock,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test no gaps with complete data."""
        service = CoachService(mock_db_session)

        gaps = service._identify_data_gaps(sample_coach_context)

        # Should have no gaps (or minimal)
        assert len(gaps) == 0


class TestCoachServiceGetInsights:
    """Tests for get_insights method."""

    @pytest.mark.asyncio
    async def test_get_insights_returns_response(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test that get_insights returns InsightsResponse."""
        service = CoachService(mock_db_session)

        with patch.object(
            service.context_builder, "build_context", new_callable=AsyncMock
        ) as mock_context:
            mock_context.return_value = sample_coach_context

            response = await service.get_insights(sample_user_id)

        assert isinstance(response, InsightsResponse)
        assert isinstance(response.generated_at, datetime)
        assert isinstance(response.insights, list)

    @pytest.mark.asyncio
    async def test_get_insights_weight_trend_down(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test insights for weight trending down."""
        service = CoachService(mock_db_session)
        sample_coach_context.weight_trend = {
            "weekly_rate_of_change_kg": -0.5,
            "current_weight_kg": 80.0,
        }

        with patch.object(
            service.context_builder, "build_context", new_callable=AsyncMock
        ) as mock_context:
            mock_context.return_value = sample_coach_context

            response = await service.get_insights(sample_user_id)

        trend_insight = next((i for i in response.insights if i.type == "trend"), None)
        assert trend_insight is not None
        assert "down" in trend_insight.data.get("direction", "")

    @pytest.mark.asyncio
    async def test_get_insights_high_adherence(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test insights for high adherence."""
        service = CoachService(mock_db_session)
        sample_coach_context.adherence_metrics = {
            "checkin_completion_rate": 0.9,
            "current_streak": 10,
        }

        with patch.object(
            service.context_builder, "build_context", new_callable=AsyncMock
        ) as mock_context:
            mock_context.return_value = sample_coach_context

            response = await service.get_insights(sample_user_id)

        # Should have achievement for high adherence
        achievement = next((i for i in response.insights if i.type == "achievement"), None)
        assert achievement is not None

    @pytest.mark.asyncio
    async def test_get_insights_low_adherence(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test insights for low adherence."""
        service = CoachService(mock_db_session)
        sample_coach_context.adherence_metrics = {
            "checkin_completion_rate": 0.3,
            "current_streak": 0,
        }

        with patch.object(
            service.context_builder, "build_context", new_callable=AsyncMock
        ) as mock_context:
            mock_context.return_value = sample_coach_context

            response = await service.get_insights(sample_user_id)

        # Should have recommendation for low adherence
        recommendation = next((i for i in response.insights if i.type == "recommendation"), None)
        assert recommendation is not None


class TestCoachServiceDataQuality:
    """Tests for data quality calculation."""

    def test_calculate_data_quality_full(
        self,
        mock_db_session: AsyncMock,
        sample_coach_context: CoachContext,
    ) -> None:
        """Test data quality with full data."""
        service = CoachService(mock_db_session)
        quality = service._calculate_data_quality(sample_coach_context)

        assert quality >= 0.5  # Should be reasonably high

    def test_calculate_data_quality_empty(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
    ) -> None:
        """Test data quality with no data."""
        service = CoachService(mock_db_session)
        context = CoachContext(user_id=sample_user_id)

        quality = service._calculate_data_quality(context)

        assert quality == 0.0

    def test_calculate_data_quality_profile_only(
        self,
        mock_db_session: AsyncMock,
        sample_user_id: uuid.UUID,
    ) -> None:
        """Test data quality with profile only."""
        service = CoachService(mock_db_session)
        context = CoachContext(
            user_id=sample_user_id,
            user_profile={
                "height_cm": 175,
                "sex": "male",
                "birth_year": 1990,
                "activity_level": "moderate",
            },
        )

        quality = service._calculate_data_quality(context)

        # Profile fully complete = 1.0 / 3 factors
        assert quality > 0.0
        assert quality < 0.5  # Missing checkins and nutrition
