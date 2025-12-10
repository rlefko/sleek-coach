"""LLM mock fixtures for testing Coach AI module."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any
from unittest.mock import AsyncMock, MagicMock

import pytest

if TYPE_CHECKING:
    from collections.abc import AsyncIterator


@dataclass
class MockLLMResponse:
    """Mock LLM response matching LLMResponse structure."""

    content: str | None = "Mock response from AI coach."
    tool_calls: list[dict[str, Any]] | None = None
    finish_reason: str = "stop"
    usage: dict[str, int] = field(
        default_factory=lambda: {
            "prompt_tokens": 100,
            "completion_tokens": 50,
        }
    )


@dataclass
class MockOrchestratorResult:
    """Mock result from CoachOrchestrator.process_message."""

    response: str = "Mock coach response."
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    tokens_used: int = 150


@pytest.fixture
def mock_llm_response() -> MockLLMResponse:
    """Create a simple mock LLM response."""
    return MockLLMResponse()


@pytest.fixture
def mock_llm_response_with_tools() -> MockLLMResponse:
    """Create a mock LLM response with tool calls."""
    return MockLLMResponse(
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


@pytest.fixture
def mock_openai_provider() -> AsyncMock:
    """Create a mock OpenAI provider."""
    mock = AsyncMock()
    mock.chat = AsyncMock(return_value=MockLLMResponse())
    mock.chat_stream = AsyncMock()
    mock.get_model_name = MagicMock(return_value="gpt-4o-mini")
    return mock


@pytest.fixture
def mock_openai_provider_with_tool_calls() -> AsyncMock:
    """Mock provider that returns tool calls then a final response."""
    mock = AsyncMock()

    # First call returns tool calls
    first_response = MockLLMResponse(
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

    # Second call returns final response
    second_response = MockLLMResponse(
        content="Based on your profile, here are my recommendations...",
        tool_calls=None,
        finish_reason="stop",
    )

    mock.chat = AsyncMock(side_effect=[first_response, second_response])
    return mock


@pytest.fixture
def mock_streaming_provider() -> AsyncMock:
    """Mock provider for streaming responses."""
    mock = AsyncMock()

    async def mock_stream(*_args: Any, **_kwargs: Any) -> AsyncIterator[str]:
        yield "Hello, "
        yield "I am "
        yield "your coach."

    mock.chat_stream = mock_stream
    return mock


@pytest.fixture
def mock_orchestrator_result() -> MockOrchestratorResult:
    """Create a mock orchestrator result."""
    return MockOrchestratorResult()


@pytest.fixture
def mock_orchestrator_result_with_tools() -> MockOrchestratorResult:
    """Create a mock orchestrator result with tool calls."""
    return MockOrchestratorResult(
        response="Based on your profile, here are my recommendations...",
        tool_calls=[
            {
                "name": "get_user_profile",
                "description": "Retrieves the user's profile information",
                "input_summary": "{}",
                "output_summary": "Profile with goal: fat_loss",
                "latency_ms": 50,
                "cached": False,
            }
        ],
        tokens_used=200,
    )
