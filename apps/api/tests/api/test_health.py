"""Health endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient) -> None:
    """Test health check endpoint returns healthy status."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.mark.asyncio
async def test_api_root(client: AsyncClient) -> None:
    """Test API v1 root endpoint."""
    response = await client.get("/api/v1/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Sleek Coach API v1"}
