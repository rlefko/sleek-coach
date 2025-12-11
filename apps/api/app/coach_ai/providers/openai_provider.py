"""OpenAI LLM provider implementation."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any

from openai import AsyncOpenAI

from app.coach_ai.providers.base import LLMProvider, LLMResponse, Message, ToolDefinition

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from app.coach_ai.providers.model_config import ModelConfig


class OpenAIProvider(LLMProvider):
    """OpenAI GPT provider implementation."""

    # Default timeout values in seconds
    DEFAULT_TIMEOUT = 60.0  # 60 seconds for non-streaming
    STREAMING_TIMEOUT = 120.0  # 120 seconds for streaming

    def __init__(self, config: ModelConfig, api_key: str, timeout: float | None = None) -> None:
        """Initialize the OpenAI provider.

        Args:
            config: Model configuration with settings.
            api_key: OpenAI API key.
            timeout: Optional timeout in seconds (defaults to DEFAULT_TIMEOUT).
        """
        self.config = config
        self.timeout = timeout or self.DEFAULT_TIMEOUT
        self.client = AsyncOpenAI(api_key=api_key, timeout=self.timeout)

    async def chat(
        self,
        messages: list[Message],
        tools: list[ToolDefinition] | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        """Send a chat completion request."""
        openai_messages = self._convert_messages(messages)
        openai_tools = self._convert_tools(tools) if tools else None

        kwargs: dict[str, Any] = {
            "model": self.config.model_name,
            "messages": openai_messages,
            "temperature": temperature or self.config.temperature,
            "max_tokens": max_tokens or self.config.max_tokens,
        }
        if openai_tools:
            kwargs["tools"] = openai_tools

        response = await self.client.chat.completions.create(**kwargs)

        choice = response.choices[0]
        return LLMResponse(
            content=choice.message.content,
            tool_calls=self._extract_tool_calls(choice.message.tool_calls),
            finish_reason=choice.finish_reason or "stop",
            usage={
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
            },
        )

    async def chat_stream(
        self,
        messages: list[Message],
        tools: list[ToolDefinition] | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str | dict[str, Any]]:
        """Stream a chat completion response."""
        openai_messages = self._convert_messages(messages)
        openai_tools = self._convert_tools(tools) if tools else None

        kwargs: dict[str, Any] = {
            "model": self.config.model_name,
            "messages": openai_messages,
            "temperature": temperature or self.config.temperature,
            "max_tokens": max_tokens or self.config.max_tokens,
            "stream": True,
        }
        if openai_tools:
            kwargs["tools"] = openai_tools

        stream = await self.client.chat.completions.create(**kwargs)

        # Track tool calls being built across chunks
        current_tool_calls: dict[int, dict[str, Any]] = {}

        async for chunk in stream:
            if not chunk.choices:
                continue

            delta = chunk.choices[0].delta

            # Handle content tokens
            if delta.content:
                yield delta.content

            # Handle tool calls
            if delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    if idx not in current_tool_calls:
                        current_tool_calls[idx] = {
                            "id": tc.id or "",
                            "type": "function",
                            "function": {"name": "", "arguments": ""},
                        }

                    if tc.id:
                        current_tool_calls[idx]["id"] = tc.id
                    if tc.function:
                        if tc.function.name:
                            current_tool_calls[idx]["function"]["name"] = tc.function.name
                        if tc.function.arguments:
                            current_tool_calls[idx]["function"]["arguments"] += (
                                tc.function.arguments
                            )

            # Check if we've finished and have tool calls
            if chunk.choices[0].finish_reason == "tool_calls" and current_tool_calls:
                yield {"tool_calls": list(current_tool_calls.values())}

    def get_model_name(self) -> str:
        """Get the model identifier."""
        return self.config.model_name

    def _convert_messages(self, messages: list[Message]) -> list[dict[str, Any]]:
        """Convert internal messages to OpenAI format."""
        result = []
        for msg in messages:
            item: dict[str, Any] = {"role": msg.role}

            if msg.content is not None:
                item["content"] = msg.content

            if msg.tool_calls:
                item["tool_calls"] = msg.tool_calls

            if msg.tool_call_id:
                item["tool_call_id"] = msg.tool_call_id
                item["content"] = msg.content or ""

            if msg.name:
                item["name"] = msg.name

            result.append(item)
        return result

    def _convert_tools(self, tools: list[ToolDefinition]) -> list[dict[str, Any]]:
        """Convert tool definitions to OpenAI format."""
        return [tool.to_openai_format() for tool in tools]

    def _extract_tool_calls(self, tool_calls: Any) -> list[dict[str, Any]] | None:
        """Extract tool calls from OpenAI response."""
        if not tool_calls:
            return None
        return [
            {
                "id": tc.id,
                "type": "function",
                "function": {
                    "name": tc.function.name,
                    "arguments": tc.function.arguments,
                },
            }
            for tc in tool_calls
        ]


def parse_tool_arguments(arguments: str) -> dict[str, Any]:
    """Parse tool call arguments from JSON string.

    Args:
        arguments: JSON string of arguments.

    Returns:
        Parsed arguments dictionary.
    """
    try:
        result = json.loads(arguments)
        return dict(result) if isinstance(result, dict) else {}
    except json.JSONDecodeError:
        return {}
