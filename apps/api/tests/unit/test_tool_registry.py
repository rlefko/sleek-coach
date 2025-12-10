"""Unit tests for ToolRegistry."""

from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.coach_ai.tools.base import BaseTool, ToolResult
from app.coach_ai.tools.registry import ToolRegistry


class MockTool(BaseTool):
    """Mock tool for testing."""

    name = "mock_tool"
    description = "A mock tool for testing"
    category = "internal"

    def __init__(self, result_data: Any = {"status": "ok"}) -> None:
        self.result_data = result_data

    def get_parameters_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "param1": {"type": "string"},
            },
            "required": ["param1"],
        }

    async def execute(self, user_id: str, **kwargs: Any) -> ToolResult:
        return ToolResult(success=True, data=self.result_data)


class MockExternalTool(BaseTool):
    """Mock external tool for testing."""

    name = "external_tool"
    description = "An external tool requiring consent"
    category = "external"
    requires_consent = True

    def get_parameters_schema(self) -> dict[str, Any]:
        return {"type": "object", "properties": {}}

    async def execute(self, user_id: str, **kwargs: Any) -> ToolResult:
        return ToolResult(success=True, data={"external": True})


class MockFailingTool(BaseTool):
    """Mock tool that fails."""

    name = "failing_tool"
    description = "A tool that always fails"
    category = "internal"

    def get_parameters_schema(self) -> dict[str, Any]:
        return {"type": "object", "properties": {}}

    async def execute(self, user_id: str, **kwargs: Any) -> ToolResult:
        raise RuntimeError("Tool execution failed")


class TestToolRegistryInit:
    """Tests for ToolRegistry initialization."""

    def test_init_without_redis(self) -> None:
        """Test initialization without Redis."""
        registry = ToolRegistry()
        assert registry._redis is None
        assert registry._tools == {}
        assert registry._user_consents == {}

    def test_init_with_redis(self) -> None:
        """Test initialization with Redis client."""
        mock_redis = MagicMock()
        registry = ToolRegistry(redis_client=mock_redis)
        assert registry._redis is mock_redis


class TestToolRegistryRegister:
    """Tests for tool registration."""

    def test_register_tool(self) -> None:
        """Test registering a tool."""
        registry = ToolRegistry()
        tool = MockTool()

        registry.register(tool)

        assert "mock_tool" in registry._tools
        assert registry._tools["mock_tool"] is tool

    def test_register_multiple_tools(self) -> None:
        """Test registering multiple tools."""
        registry = ToolRegistry()

        registry.register(MockTool())
        registry.register(MockExternalTool())

        assert len(registry._tools) == 2
        assert "mock_tool" in registry._tools
        assert "external_tool" in registry._tools


class TestToolRegistryGetTool:
    """Tests for getting tools."""

    def test_get_existing_tool(self) -> None:
        """Test getting a registered tool."""
        registry = ToolRegistry()
        tool = MockTool()
        registry.register(tool)

        result = registry.get_tool("mock_tool")

        assert result is tool

    def test_get_nonexistent_tool(self) -> None:
        """Test getting a non-existent tool."""
        registry = ToolRegistry()

        result = registry.get_tool("nonexistent")

        assert result is None


class TestToolRegistryAvailableTools:
    """Tests for getting available tools."""

    def test_get_internal_tools(self) -> None:
        """Test getting internal tools (always available)."""
        registry = ToolRegistry()
        registry.register(MockTool())
        registry.register(MockExternalTool())

        tools = registry.get_available_tools("user123", include_external=False)

        assert len(tools) == 1
        assert tools[0].name == "mock_tool"

    def test_get_external_tools_without_consent(self) -> None:
        """Test that external tools are excluded without consent."""
        registry = ToolRegistry()
        registry.register(MockTool())
        registry.register(MockExternalTool())

        tools = registry.get_available_tools("user123", include_external=True)

        assert len(tools) == 1  # Only internal tool

    def test_get_external_tools_with_consent(self) -> None:
        """Test that external tools are included with consent."""
        registry = ToolRegistry()
        registry.register(MockTool())
        registry.register(MockExternalTool())
        registry.set_user_consent("user123", "external_tool")

        tools = registry.get_available_tools("user123", include_external=True)

        assert len(tools) == 2


class TestToolRegistryToolDefinitions:
    """Tests for getting tool definitions."""

    def test_get_tool_definitions(self) -> None:
        """Test getting tool definitions for LLM."""
        registry = ToolRegistry()
        registry.register(MockTool())

        definitions = registry.get_tool_definitions("user123")

        assert len(definitions) == 1
        assert definitions[0].name == "mock_tool"
        assert definitions[0].description == "A mock tool for testing"
        assert "param1" in definitions[0].parameters["properties"]


class TestToolRegistryExecute:
    """Tests for tool execution."""

    @pytest.mark.asyncio
    async def test_execute_existing_tool(self) -> None:
        """Test executing a registered tool."""
        registry = ToolRegistry()
        registry.register(MockTool(result_data={"test": "data"}))

        result = await registry.execute_tool("mock_tool", "user123", {"param1": "value"})

        assert result.success is True
        assert result.data == {"test": "data"}

    @pytest.mark.asyncio
    async def test_execute_unknown_tool(self) -> None:
        """Test executing an unknown tool."""
        registry = ToolRegistry()

        result = await registry.execute_tool("unknown", "user123", {})

        assert result.success is False
        assert "Unknown tool" in result.error

    @pytest.mark.asyncio
    async def test_execute_external_tool_without_consent(self) -> None:
        """Test executing external tool without consent."""
        registry = ToolRegistry()
        registry.register(MockExternalTool())

        result = await registry.execute_tool("external_tool", "user123", {})

        assert result.success is False
        assert "consent" in result.error.lower()

    @pytest.mark.asyncio
    async def test_execute_external_tool_with_consent(self) -> None:
        """Test executing external tool with consent."""
        registry = ToolRegistry()
        registry.register(MockExternalTool())
        registry.set_user_consent("user123", "external_tool")

        result = await registry.execute_tool("external_tool", "user123", {})

        assert result.success is True
        assert result.data == {"external": True}

    @pytest.mark.asyncio
    async def test_execute_tool_exception_handling(self) -> None:
        """Test that tool exceptions are handled gracefully."""
        registry = ToolRegistry()
        registry.register(MockFailingTool())

        result = await registry.execute_tool("failing_tool", "user123", {})

        assert result.success is False
        assert "Tool execution failed" in result.error


class TestToolRegistryCaching:
    """Tests for tool caching."""

    @pytest.mark.asyncio
    async def test_cache_miss(self) -> None:
        """Test cache miss executes tool."""
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=None)

        registry = ToolRegistry(redis_client=mock_redis)
        registry.register(MockTool())

        result = await registry.execute_tool("mock_tool", "user123", {"param1": "test"})

        assert result.success is True
        assert result.cached is False

    @pytest.mark.asyncio
    async def test_cache_hit(self) -> None:
        """Test cache hit returns cached data."""
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=b'{"cached": "data"}')

        registry = ToolRegistry(redis_client=mock_redis)
        tool = MockTool()
        tool.cacheable = True
        registry.register(tool)

        result = await registry.execute_tool("mock_tool", "user123", {"param1": "test"})

        assert result.success is True
        assert result.cached is True
        assert result.data == {"cached": "data"}

    @pytest.mark.asyncio
    async def test_cache_set_on_success(self) -> None:
        """Test successful results are cached."""
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock()

        registry = ToolRegistry(redis_client=mock_redis)
        tool = MockTool()
        tool.cacheable = True
        registry.register(tool)

        await registry.execute_tool("mock_tool", "user123", {"param1": "test"})

        mock_redis.setex.assert_called_once()


class TestToolRegistryConsent:
    """Tests for user consent management."""

    def test_set_user_consent(self) -> None:
        """Test setting user consent."""
        registry = ToolRegistry()

        registry.set_user_consent("user123", "tool1")

        assert "user123" in registry._user_consents
        assert "tool1" in registry._user_consents["user123"]

    def test_set_multiple_consents(self) -> None:
        """Test setting multiple consents for a user."""
        registry = ToolRegistry()

        registry.set_user_consent("user123", "tool1")
        registry.set_user_consent("user123", "tool2")

        assert "tool1" in registry._user_consents["user123"]
        assert "tool2" in registry._user_consents["user123"]

    def test_revoke_user_consent(self) -> None:
        """Test revoking user consent."""
        registry = ToolRegistry()
        registry.set_user_consent("user123", "tool1")

        registry.revoke_user_consent("user123", "tool1")

        assert "tool1" not in registry._user_consents["user123"]

    def test_revoke_nonexistent_consent(self) -> None:
        """Test revoking consent that doesn't exist."""
        registry = ToolRegistry()

        # Should not raise
        registry.revoke_user_consent("user123", "tool1")

    def test_has_consent_true(self) -> None:
        """Test checking consent when granted."""
        registry = ToolRegistry()
        registry.set_user_consent("user123", "tool1")

        assert registry._has_consent("user123", "tool1") is True

    def test_has_consent_false(self) -> None:
        """Test checking consent when not granted."""
        registry = ToolRegistry()

        assert registry._has_consent("user123", "tool1") is False
