"""API tests for user endpoints."""

import pytest
from httpx import AsyncClient


async def get_auth_headers(client: AsyncClient, email: str | None = None) -> dict[str, str]:
    """Register a user and return auth headers."""
    test_email = email or f"user_{id(client)}@example.com"
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": test_email, "password": "SecurePass123!"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient) -> None:
    """Test getting current user."""
    headers = await get_auth_headers(client, "getme@example.com")

    response = await client.get("/api/v1/me", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["email"] == "getme@example.com"
    assert data["is_active"] is True
    assert data["is_verified"] is False
    assert "profile" in data
    assert "goal" in data
    assert "preferences" in data


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient) -> None:
    """Test getting current user without auth fails."""
    response = await client.get("/api/v1/me")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_invalid_token(client: AsyncClient) -> None:
    """Test getting current user with invalid token fails."""
    response = await client.get(
        "/api/v1/me",
        headers={"Authorization": "Bearer invalid.token.here"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_profile(client: AsyncClient) -> None:
    """Test updating user profile."""
    headers = await get_auth_headers(client, "updateprofile@example.com")

    response = await client.patch(
        "/api/v1/me/profile",
        headers=headers,
        json={
            "display_name": "Test User",
            "height_cm": 180.5,
            "activity_level": "moderate",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["display_name"] == "Test User"
    assert data["height_cm"] == 180.5
    assert data["activity_level"] == "moderate"


@pytest.mark.asyncio
async def test_update_profile_partial(client: AsyncClient) -> None:
    """Test partial profile update only changes specified fields."""
    headers = await get_auth_headers(client, "partialprofile@example.com")

    # First update
    await client.patch(
        "/api/v1/me/profile",
        headers=headers,
        json={"display_name": "Initial Name", "height_cm": 175.0},
    )

    # Partial update - only change display_name
    response = await client.patch(
        "/api/v1/me/profile",
        headers=headers,
        json={"display_name": "Updated Name"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["display_name"] == "Updated Name"
    assert data["height_cm"] == 175.0  # Should remain unchanged


@pytest.mark.asyncio
async def test_update_profile_sex(client: AsyncClient) -> None:
    """Test updating profile sex field."""
    headers = await get_auth_headers(client, "sexupdate@example.com")

    response = await client.patch(
        "/api/v1/me/profile",
        headers=headers,
        json={"sex": "female"},
    )

    assert response.status_code == 200
    assert response.json()["sex"] == "female"


@pytest.mark.asyncio
async def test_update_goals(client: AsyncClient) -> None:
    """Test updating user goals."""
    headers = await get_auth_headers(client, "updategoals@example.com")

    response = await client.patch(
        "/api/v1/me/goals",
        headers=headers,
        json={
            "goal_type": "fat_loss",
            "target_weight_kg": 75.0,
            "pace_preference": "moderate",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["goal_type"] == "fat_loss"
    assert data["target_weight_kg"] == 75.0
    assert data["pace_preference"] == "moderate"


@pytest.mark.asyncio
async def test_update_goals_all_types(client: AsyncClient) -> None:
    """Test all goal types are valid."""
    headers = await get_auth_headers(client, "goaltypes@example.com")

    goal_types = ["fat_loss", "muscle_gain", "recomp", "maintenance", "performance"]

    for goal_type in goal_types:
        response = await client.patch(
            "/api/v1/me/goals",
            headers=headers,
            json={"goal_type": goal_type},
        )
        assert response.status_code == 200
        assert response.json()["goal_type"] == goal_type


@pytest.mark.asyncio
async def test_update_preferences(client: AsyncClient) -> None:
    """Test updating diet preferences."""
    headers = await get_auth_headers(client, "updateprefs@example.com")

    response = await client.patch(
        "/api/v1/me/preferences",
        headers=headers,
        json={
            "diet_type": "vegetarian",
            "allergies": ["peanuts", "shellfish"],
            "meals_per_day": 4,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["diet_type"] == "vegetarian"
    assert "peanuts" in data["allergies"]
    assert "shellfish" in data["allergies"]
    assert data["meals_per_day"] == 4


@pytest.mark.asyncio
async def test_update_preferences_with_macros(client: AsyncClient) -> None:
    """Test updating diet preferences with macro targets."""
    headers = await get_auth_headers(client, "macros@example.com")

    macro_targets = {
        "protein_g": 150,
        "carbs_g": 200,
        "fat_g": 65,
        "calories": 2000,
    }

    response = await client.patch(
        "/api/v1/me/preferences",
        headers=headers,
        json={"macro_targets": macro_targets},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["macro_targets"] == macro_targets


@pytest.mark.asyncio
async def test_update_preferences_all_diet_types(client: AsyncClient) -> None:
    """Test all diet types are valid."""
    headers = await get_auth_headers(client, "diettypes@example.com")

    diet_types = [
        "none",
        "vegetarian",
        "vegan",
        "pescatarian",
        "keto",
        "paleo",
        "halal",
        "kosher",
    ]

    for diet_type in diet_types:
        response = await client.patch(
            "/api/v1/me/preferences",
            headers=headers,
            json={"diet_type": diet_type},
        )
        assert response.status_code == 200
        assert response.json()["diet_type"] == diet_type


@pytest.mark.asyncio
async def test_profile_default_values(client: AsyncClient) -> None:
    """Test that new user has correct default profile values."""
    headers = await get_auth_headers(client, "defaults@example.com")

    response = await client.get("/api/v1/me", headers=headers)

    assert response.status_code == 200
    data = response.json()

    # Profile defaults
    assert data["profile"]["timezone"] == "UTC"
    assert data["profile"]["display_name"] is None
    assert data["profile"]["height_cm"] is None

    # Goal defaults
    assert data["goal"]["goal_type"] == "maintenance"
    assert data["goal"]["pace_preference"] == "moderate"

    # Preferences defaults
    assert data["preferences"]["diet_type"] == "none"
    assert data["preferences"]["meals_per_day"] == 3
    assert data["preferences"]["allergies"] == []
