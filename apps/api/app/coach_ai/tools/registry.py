"""Tool registry for managing and executing coach tools."""

from __future__ import annotations

import json
import uuid
from typing import TYPE_CHECKING, Any

import structlog

from app.coach_ai.providers.base import ToolDefinition
from app.coach_ai.tools.base import BaseTool, ToolResult
from app.users.models import ConsentType

if TYPE_CHECKING:
    import redis.asyncio as redis
    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger()

# Mapping from tool names to consent types
TOOL_CONSENT_MAP: dict[str, ConsentType] = {
    "search_web": ConsentType.WEB_SEARCH,
    "fetch_recipe": ConsentType.WEB_SEARCH,
}


class ToolRegistry:
    """Registry and executor for coach tools."""

    def __init__(self, redis_client: redis.Redis[bytes] | None = None) -> None:
        """Initialize the tool registry.

        Args:
            redis_client: Optional Redis client for caching.
        """
        self._tools: dict[str, BaseTool] = {}
        self._redis = redis_client
        self._user_consents: dict[str, set[str]] = {}

    def register(self, tool: BaseTool) -> None:
        """Register a tool in the registry."""
        self._tools[tool.name] = tool
        logger.debug("tool_registered", tool_name=tool.name, category=tool.category)

    def get_tool(self, name: str) -> BaseTool | None:
        """Get a tool by name."""
        return self._tools.get(name)

    def get_available_tools(
        self,
        user_id: str,
        include_external: bool = False,
    ) -> list[BaseTool]:
        """Get tools available for a user.

        Args:
            user_id: The user's ID.
            include_external: Whether to include external tools (requires consent).

        Returns:
            List of available tools.
        """
        tools = []
        for tool in self._tools.values():
            if tool.category == "internal" or (
                include_external and self._has_consent(user_id, tool.name)
            ):
                tools.append(tool)
        return tools

    def get_tool_definitions(
        self,
        user_id: str,
        include_external: bool = False,
    ) -> list[ToolDefinition]:
        """Get tool definitions for LLM.

        Args:
            user_id: The user's ID.
            include_external: Whether to include external tools.

        Returns:
            List of tool definitions for the LLM.
        """
        tools = self.get_available_tools(user_id, include_external)
        return [
            ToolDefinition(
                name=tool.name,
                description=tool.description,
                parameters=tool.get_parameters_schema(),
            )
            for tool in tools
        ]

    async def execute_tool(
        self,
        tool_name: str,
        user_id: str,
        arguments: dict[str, Any],
    ) -> ToolResult:
        """Execute a tool with caching support.

        Args:
            tool_name: Name of the tool to execute.
            user_id: The user's ID.
            arguments: Tool arguments.

        Returns:
            Result from tool execution.
        """
        tool = self.get_tool(tool_name)
        if not tool:
            return ToolResult(
                success=False,
                data=None,
                error=f"Unknown tool: {tool_name}",
            )

        # Check consent for external tools
        if tool.category == "external" and not self._has_consent(user_id, tool_name):
            return ToolResult(
                success=False,
                data=None,
                error="User consent required for external tool",
            )

        # Check cache
        if tool.cacheable and self._redis:
            cache_key = tool.get_cache_key(user_id, **arguments)
            cached = await self._get_cached(cache_key)
            if cached is not None:
                logger.debug("tool_cache_hit", tool_name=tool_name, user_id=user_id)
                return ToolResult(success=True, data=cached, cached=True)

        # Execute tool
        try:
            result = await tool.execute(user_id, **arguments)
        except Exception as e:
            logger.exception("tool_execution_error", tool_name=tool_name, user_id=user_id)
            return ToolResult(success=False, data=None, error=str(e))

        # Cache successful results
        if result.success and tool.cacheable and self._redis:
            cache_key = tool.get_cache_key(user_id, **arguments)
            await self._set_cached(cache_key, result.data, tool.cache_ttl_seconds)

        return result

    def set_user_consent(self, user_id: str, tool_name: str) -> None:
        """Record user consent for an external tool.

        Args:
            user_id: The user's ID.
            tool_name: Name of the tool.
        """
        if user_id not in self._user_consents:
            self._user_consents[user_id] = set()
        self._user_consents[user_id].add(tool_name)

    def revoke_user_consent(self, user_id: str, tool_name: str) -> None:
        """Revoke user consent for an external tool.

        Args:
            user_id: The user's ID.
            tool_name: Name of the tool.
        """
        if user_id in self._user_consents:
            self._user_consents[user_id].discard(tool_name)

    def _has_consent(self, user_id: str, tool_name: str) -> bool:
        """Check if user has consented to an external tool."""
        return tool_name in self._user_consents.get(user_id, set())

    async def load_user_consents_from_db(
        self,
        user_id: str,
        session: AsyncSession,
    ) -> None:
        """Load user consents from database into memory.

        This method should be called when starting a user session to sync
        database consent records with the in-memory consent cache.

        Args:
            user_id: The user's ID (as string).
            session: Database session.
        """
        from app.users.consent_service import UserConsentService

        consent_service = UserConsentService(session)
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            logger.warning("invalid_user_id_format", user_id=user_id)
            return

        consents = await consent_service.get_user_consents(user_uuid)

        # Clear existing in-memory consents for this user
        self._user_consents[user_id] = set()

        # Map database consents to tool names
        for consent in consents:
            if consent.granted and consent.revoked_at is None:
                # Find all tools that map to this consent type
                for tool_name, consent_type in TOOL_CONSENT_MAP.items():
                    if consent.consent_type == consent_type:
                        self._user_consents[user_id].add(tool_name)

        logger.debug(
            "user_consents_loaded",
            user_id=user_id,
            consent_count=len(self._user_consents.get(user_id, set())),
        )

    async def _get_cached(self, key: str) -> Any | None:
        """Get cached tool result."""
        if not self._redis:
            return None
        try:
            data = await self._redis.get(f"tool_cache:{key}")
            if data:
                return json.loads(data)
        except Exception:
            logger.exception("cache_get_error", key=key)
        return None

    async def _set_cached(self, key: str, data: Any, ttl: int) -> None:
        """Cache tool result."""
        if not self._redis:
            return
        try:
            await self._redis.setex(f"tool_cache:{key}", ttl, json.dumps(data, default=str))
        except Exception:
            logger.exception("cache_set_error", key=key)
