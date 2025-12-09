#!/usr/bin/env python
"""Seed development database with sample data."""

import asyncio

import structlog

from app.config import get_settings
from app.database import async_session_maker, init_db

logger = structlog.get_logger()
settings = get_settings()


async def seed_database() -> None:
    """Seed the database with development data."""
    if not settings.is_development:
        logger.error("Seed script can only run in development environment")
        return

    logger.info("Initializing database connection")
    await init_db()

    async with async_session_maker() as session:
        logger.info("Starting database seeding")

        # Seed data will be added as models are created in subsequent phases
        _ = session  # Use session when models are available

        logger.info("Database seeding completed")


def main() -> None:
    """Main entry point."""
    asyncio.run(seed_database())


if __name__ == "__main__":
    main()
