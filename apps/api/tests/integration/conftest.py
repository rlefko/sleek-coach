"""Integration test fixtures using testcontainers."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel
from testcontainers.postgres import PostgresContainer

# Import all models to ensure they're registered with SQLModel
from app.auth.models import RefreshToken  # noqa: F401
from app.checkins.models import CheckIn  # noqa: F401
from app.coach_ai.models import AIPolicyViolationLog, AISession, AIToolCallLog  # noqa: F401
from app.nutrition.models import NutritionDay  # noqa: F401
from app.photos.models import ProgressPhoto  # noqa: F401
from app.users.models import DietPreferences, User, UserGoal, UserProfile  # noqa: F401


@pytest.fixture(scope="session")
def postgres_container():
    """Start PostgreSQL container for integration tests.

    Uses session scope to reuse the container across all tests.
    """
    with PostgresContainer(
        image="postgres:16-alpine",
        username="test",
        password="test",
        dbname="test_db",
    ) as postgres:
        yield postgres


@pytest.fixture(scope="function")
async def integration_engine(postgres_container):
    """Create async engine connected to real PostgreSQL."""
    # Build async connection URL directly from container details
    host = postgres_container.get_container_host_ip()
    port = postgres_container.get_exposed_port(5432)
    async_url = f"postgresql+asyncpg://test:test@{host}:{port}/test_db"

    engine = create_async_engine(
        async_url,
        echo=False,
        pool_pre_ping=True,
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    yield engine

    # Drop all tables after test
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

    await engine.dispose()


@pytest.fixture(scope="function")
async def integration_session(integration_engine):
    """Create database session for integration tests."""
    session_maker = async_sessionmaker(
        integration_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_maker() as session:
        yield session
