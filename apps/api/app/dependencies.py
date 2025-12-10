"""Application-wide dependencies for FastAPI routes."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Any

import redis.asyncio as redis
import structlog
from fastapi import Depends, Request

from app.config import get_settings

if TYPE_CHECKING:
    from redis.asyncio.client import Redis

logger = structlog.get_logger()

# Global Redis client instance (set during app startup)
_redis_client: Redis[bytes] | None = None


async def init_redis() -> Any:
    """Initialize Redis connection pool.

    Returns:
        Redis client instance.
    """
    global _redis_client
    settings = get_settings()

    _redis_client = redis.from_url(
        str(settings.redis_url),
        encoding="utf-8",
        decode_responses=False,
    )
    logger.info("Redis connection pool initialized", url=str(settings.redis_url).split("@")[-1])
    return _redis_client


async def close_redis() -> None:
    """Close Redis connection pool."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
        logger.info("Redis connection pool closed")


def get_redis_client() -> Any:
    """Get the Redis client instance.

    Returns:
        Redis client or None if not initialized.
    """
    return _redis_client


async def get_redis(request: Request) -> Any:  # noqa: ARG001
    """FastAPI dependency to get Redis client.

    Args:
        request: FastAPI request (unused but required for dependency).

    Returns:
        Redis client or None if not available.
    """
    return _redis_client


# Type alias for dependency injection
RedisClient = Annotated[Any, Depends(get_redis)]
