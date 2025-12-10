"""Pytest fixtures for testing."""

import asyncio
import os
from collections.abc import AsyncGenerator, Generator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

# Set testing environment before importing app modules
os.environ["APP_ENV"] = "testing"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost:5432/test"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

from app.auth.models import RefreshToken  # noqa: F401
from app.checkins.models import CheckIn  # noqa: F401
from app.coach_ai.models import AISession, AIToolCallLog, AIPolicyViolationLog  # noqa: F401
from app.database import get_session
from app.main import app
from app.nutrition.models import NutritionDay  # noqa: F401
from app.photos.models import ProgressPhoto  # noqa: F401
from app.users.models import DietPreferences, User, UserGoal, UserProfile  # noqa: F401

# Import shared fixtures
from tests.fixtures.coach_fixtures import *  # noqa: F401, F403
from tests.fixtures.llm_mocks import *  # noqa: F401, F403

# Import and rebuild Coach AI schemas that use TYPE_CHECKING imports
# This is necessary because they use `from __future__ import annotations`
# with TYPE_CHECKING guards for uuid and datetime
import uuid
from datetime import datetime

from app.coach_ai.schemas import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    InsightsResponse,
    WeeklyPlanRequest,
    WeeklyPlanResponse,
)

# Rebuild models with actual types
ChatMessage.model_rebuild()
ChatRequest.model_rebuild()
ChatResponse.model_rebuild()
InsightsResponse.model_rebuild()
WeeklyPlanRequest.model_rebuild()
WeeklyPlanResponse.model_rebuild()

# Test database URL (use SQLite for fast unit tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

# Create test session factory
test_session_maker = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with test_session_maker() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client."""

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as test_client:
        yield test_client

    app.dependency_overrides.clear()
