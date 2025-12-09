"""API tests for check-in endpoints."""

from datetime import date, datetime, timedelta

import pytest
from httpx import AsyncClient


async def get_auth_headers(client: AsyncClient, email: str | None = None) -> dict[str, str]:
    """Register a user and return auth headers."""
    test_email = email or f"checkin_user_{id(client)}@example.com"
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": test_email, "password": "SecurePass123!"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_checkin(client: AsyncClient) -> None:
    """Test creating a new check-in."""
    headers = await get_auth_headers(client, "checkin_create@example.com")

    response = await client.post(
        "/api/v1/checkins",
        headers=headers,
        json={
            "date": str(date.today()),
            "weight_kg": 75.5,
            "notes": "Feeling good!",
            "energy_level": 4,
            "sleep_quality": 5,
            "mood": 4,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["date"] == str(date.today())
    assert data["weight_kg"] == 75.5
    assert data["notes"] == "Feeling good!"
    assert data["energy_level"] == 4
    assert data["sleep_quality"] == 5
    assert data["mood"] == 4
    assert "id" in data


@pytest.mark.asyncio
async def test_create_checkin_minimal(client: AsyncClient) -> None:
    """Test creating a check-in with minimal data."""
    headers = await get_auth_headers(client, "checkin_minimal@example.com")

    response = await client.post(
        "/api/v1/checkins",
        headers=headers,
        json={
            "date": str(date.today()),
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["date"] == str(date.today())
    assert data["weight_kg"] is None


@pytest.mark.asyncio
async def test_create_checkin_upsert(client: AsyncClient) -> None:
    """Test that creating a check-in for existing date updates it."""
    headers = await get_auth_headers(client, "checkin_upsert@example.com")
    today = str(date.today())

    # Create initial check-in
    response1 = await client.post(
        "/api/v1/checkins",
        headers=headers,
        json={"date": today, "weight_kg": 75.0},
    )
    assert response1.status_code == 201
    first_id = response1.json()["id"]

    # Update same date
    response2 = await client.post(
        "/api/v1/checkins",
        headers=headers,
        json={"date": today, "weight_kg": 74.5, "notes": "Updated"},
    )

    assert response2.status_code == 201
    data = response2.json()
    assert data["id"] == first_id  # Same record
    assert data["weight_kg"] == 74.5
    assert data["notes"] == "Updated"


@pytest.mark.asyncio
async def test_create_checkin_unauthorized(client: AsyncClient) -> None:
    """Test creating a check-in without auth fails."""
    response = await client.post(
        "/api/v1/checkins",
        json={"date": str(date.today())},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_checkins(client: AsyncClient) -> None:
    """Test listing check-ins."""
    headers = await get_auth_headers(client, "checkin_list@example.com")

    # Create some check-ins
    for i in range(5):
        await client.post(
            "/api/v1/checkins",
            headers=headers,
            json={
                "date": str(date.today() - timedelta(days=i)),
                "weight_kg": 75.0 + i,
            },
        )

    response = await client.get("/api/v1/checkins", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) == 5
    assert data["total"] == 5


@pytest.mark.asyncio
async def test_list_checkins_with_date_range(client: AsyncClient) -> None:
    """Test listing check-ins with date range filter."""
    headers = await get_auth_headers(client, "checkin_range@example.com")
    today = date.today()

    # Create check-ins over 10 days
    for i in range(10):
        await client.post(
            "/api/v1/checkins",
            headers=headers,
            json={
                "date": str(today - timedelta(days=i)),
                "weight_kg": 75.0,
            },
        )

    # Get only last 5 days
    response = await client.get(
        "/api/v1/checkins",
        headers=headers,
        params={
            "from": str(today - timedelta(days=4)),
            "to": str(today),
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 5


@pytest.mark.asyncio
async def test_list_checkins_pagination(client: AsyncClient) -> None:
    """Test pagination in check-in list."""
    headers = await get_auth_headers(client, "checkin_page@example.com")

    # Create check-ins
    for i in range(10):
        await client.post(
            "/api/v1/checkins",
            headers=headers,
            json={
                "date": str(date.today() - timedelta(days=i)),
                "weight_kg": 75.0,
            },
        )

    response = await client.get(
        "/api/v1/checkins",
        headers=headers,
        params={"limit": 3, "offset": 2},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3
    assert data["total"] == 10
    assert data["limit"] == 3
    assert data["offset"] == 2


@pytest.mark.asyncio
async def test_get_latest_checkin(client: AsyncClient) -> None:
    """Test getting the latest check-in."""
    headers = await get_auth_headers(client, "checkin_latest@example.com")
    today = date.today()

    # Create check-ins
    for i in range(3):
        await client.post(
            "/api/v1/checkins",
            headers=headers,
            json={
                "date": str(today - timedelta(days=i)),
                "weight_kg": 75.0 - i,
            },
        )

    response = await client.get("/api/v1/checkins/latest", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["date"] == str(today)
    assert data["weight_kg"] == 75.0


@pytest.mark.asyncio
async def test_get_latest_checkin_empty(client: AsyncClient) -> None:
    """Test getting latest check-in when none exist."""
    headers = await get_auth_headers(client, "checkin_empty@example.com")

    response = await client.get("/api/v1/checkins/latest", headers=headers)

    assert response.status_code == 200
    assert response.json() is None


@pytest.mark.asyncio
async def test_get_weight_trends(client: AsyncClient) -> None:
    """Test getting weight trend analysis."""
    headers = await get_auth_headers(client, "checkin_trends@example.com")
    today = date.today()

    # Create weight entries showing gradual loss
    for i in range(14):
        await client.post(
            "/api/v1/checkins",
            headers=headers,
            json={
                "date": str(today - timedelta(days=13 - i)),
                "weight_kg": 80.0 - (i * 0.1),
            },
        )

    response = await client.get(
        "/api/v1/checkins/trends",
        headers=headers,
        params={"days": 30},
    )

    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) == 14
    assert data["start_weight"] is not None
    assert data["current_weight"] is not None
    assert data["total_change"] is not None
    assert data["weekly_rate_of_change"] is not None
    # Should show weight loss
    assert data["total_change"] < 0


@pytest.mark.asyncio
async def test_get_weight_trends_empty(client: AsyncClient) -> None:
    """Test getting weight trends with no data."""
    headers = await get_auth_headers(client, "trends_empty@example.com")

    response = await client.get("/api/v1/checkins/trends", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["data"] == []
    assert data["start_weight"] is None


@pytest.mark.asyncio
async def test_sync_checkins(client: AsyncClient) -> None:
    """Test batch syncing check-ins."""
    headers = await get_auth_headers(client, "checkin_sync@example.com")
    today = date.today()
    now = datetime.utcnow().isoformat()

    response = await client.post(
        "/api/v1/checkins/sync",
        headers=headers,
        json={
            "checkins": [
                {
                    "date": str(today),
                    "weight_kg": 75.0,
                    "client_updated_at": now,
                },
                {
                    "date": str(today - timedelta(days=1)),
                    "weight_kg": 75.5,
                    "client_updated_at": now,
                },
            ],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) == 2
    assert all(r["status"] == "created" for r in data["results"])
    assert data["conflicts"] == 0


@pytest.mark.asyncio
async def test_sync_checkins_with_conflict(client: AsyncClient) -> None:
    """Test sync detects conflicts when server data is newer."""
    headers = await get_auth_headers(client, "sync_conflict@example.com")
    today = date.today()

    # Create a check-in on server first
    await client.post(
        "/api/v1/checkins",
        headers=headers,
        json={"date": str(today), "weight_kg": 75.0},
    )

    # Try to sync with old timestamp
    old_timestamp = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    response = await client.post(
        "/api/v1/checkins/sync",
        headers=headers,
        json={
            "checkins": [
                {
                    "date": str(today),
                    "weight_kg": 74.0,
                    "client_updated_at": old_timestamp,
                },
            ],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["conflicts"] == 1
    assert data["results"][0]["status"] == "conflict"
    # Server version should be returned
    assert data["results"][0]["server_version"]["weight_kg"] == 75.0
