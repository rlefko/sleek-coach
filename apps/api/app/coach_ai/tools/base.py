"""Base tool class for AI Coach tools."""

from __future__ import annotations

import hashlib
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class ToolResult:
    """Result from tool execution."""

    success: bool
    data: Any
    error: str | None = None
    cached: bool = False


class BaseTool(ABC):
    """Abstract base class for all coach tools."""

    name: str
    description: str
    category: str  # "internal" or "external"
    requires_consent: bool = False
    cacheable: bool = True
    cache_ttl_seconds: int = 300  # 5 minutes default

    @abstractmethod
    def get_parameters_schema(self) -> dict[str, Any]:
        """Return JSON Schema for tool parameters."""
        pass

    @abstractmethod
    async def execute(self, user_id: str, **kwargs: Any) -> ToolResult:
        """Execute the tool with given parameters."""
        pass

    def get_openai_definition(self) -> dict[str, Any]:
        """Get OpenAI function calling definition."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.get_parameters_schema(),
            },
        }

    def get_cache_key(self, user_id: str, **kwargs: Any) -> str:
        """Generate cache key for this tool call."""
        params_str = json.dumps(kwargs, sort_keys=True, default=str)
        hash_input = f"{self.name}:{user_id}:{params_str}"
        return hashlib.sha256(hash_input.encode()).hexdigest()

    def get_input_summary(self, **kwargs: Any) -> str:
        """Get human-readable summary of input parameters."""
        if not kwargs:
            return "No parameters"
        parts = [f"{k}={v}" for k, v in kwargs.items()]
        return ", ".join(parts)
