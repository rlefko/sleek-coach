#!/usr/bin/env python
"""Wait for database to be ready before starting the application."""

import asyncio
import sys
import time

import asyncpg


async def wait_for_db(
    db_url: str,
    max_retries: int = 30,
    retry_interval: float = 2.0,
) -> bool:
    """Wait for the database to be ready."""
    # Convert asyncpg URL format
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

    for attempt in range(1, max_retries + 1):
        try:
            conn = await asyncpg.connect(db_url)
            await conn.execute("SELECT 1")
            await conn.close()
            print(f"Database is ready after {attempt} attempt(s)")
            return True
        except Exception as e:
            print(f"Attempt {attempt}/{max_retries}: Database not ready - {e}")
            if attempt < max_retries:
                time.sleep(retry_interval)

    return False


def main() -> int:
    """Main entry point."""
    import os

    db_url = os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/sleek_coach",
    )

    if asyncio.run(wait_for_db(db_url)):
        return 0
    print("Failed to connect to database after maximum retries")
    return 1


if __name__ == "__main__":
    sys.exit(main())
