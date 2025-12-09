"""Database configuration and session management."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from sqlmodel import SQLModel

from app.config import get_settings

settings = get_settings()

# Create async engine with appropriate pooling based on environment
_pool_class = NullPool if settings.is_testing else None
_pool_kwargs = (
    {}
    if settings.is_testing
    else {
        "pool_size": settings.database_pool_size,
        "max_overflow": settings.database_max_overflow,
    }
)

engine = create_async_engine(
    str(settings.database_url),
    echo=settings.debug,
    pool_pre_ping=True,
    poolclass=_pool_class,
    **_pool_kwargs,
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Initialize database connection."""
    # This is called on startup to verify connection
    async with engine.begin() as conn:
        # Only create tables in development/testing
        if settings.is_development or settings.is_testing:
            await conn.run_sync(SQLModel.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    await engine.dispose()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get an async database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
