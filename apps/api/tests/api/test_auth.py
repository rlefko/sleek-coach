"""API tests for authentication endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient) -> None:
    """Test successful user registration."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "SecurePass123!",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient) -> None:
    """Test registration with existing email fails."""
    email = "duplicate@example.com"

    # First registration
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "SecurePass123!"},
    )

    # Second registration with same email
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "AnotherPass123!"},
    )

    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password_too_short(client: AsyncClient) -> None:
    """Test registration with too short password fails."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "Abc1!"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_weak_password_no_uppercase(client: AsyncClient) -> None:
    """Test registration without uppercase letter fails."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "lowercase123!"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_weak_password_no_digit(client: AsyncClient) -> None:
    """Test registration without digit fails."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "NoDigitsHere!"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_weak_password_no_special(client: AsyncClient) -> None:
    """Test registration without special character fails."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "NoSpecial123"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_invalid_email(client: AsyncClient) -> None:
    """Test registration with invalid email fails."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "not-an-email", "password": "SecurePass123!"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient) -> None:
    """Test successful login."""
    email = "login@example.com"
    password = "SecurePass123!"

    # Register first
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient) -> None:
    """Test login with wrong password fails."""
    email = "wrongpass@example.com"

    # Register
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "SecurePass123!"},
    )

    # Login with wrong password
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "WrongPass123!"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient) -> None:
    """Test login with non-existent user fails."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "AnyPass123!"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient) -> None:
    """Test token refresh."""
    # Register to get tokens
    register_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "refresh@example.com", "password": "SecurePass123!"},
    )
    refresh_token = register_response.json()["refresh_token"]

    # Refresh tokens
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    # New refresh token should be different (token rotation)
    assert data["refresh_token"] != refresh_token


@pytest.mark.asyncio
async def test_refresh_token_invalid(client: AsyncClient) -> None:
    """Test refresh with invalid token fails."""
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid.token.here"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_reuse_blocked(client: AsyncClient) -> None:
    """Test that old refresh token cannot be reused after rotation."""
    # Register
    register_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "reuse@example.com", "password": "SecurePass123!"},
    )
    old_refresh_token = register_response.json()["refresh_token"]

    # First refresh - should succeed
    await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": old_refresh_token},
    )

    # Try to reuse old token - should fail
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": old_refresh_token},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient) -> None:
    """Test logout invalidates refresh token."""
    # Register
    register_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "logout@example.com", "password": "SecurePass123!"},
    )
    refresh_token = register_response.json()["refresh_token"]

    # Logout
    logout_response = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
    )
    assert logout_response.status_code == 200
    assert logout_response.json()["message"] == "Successfully logged out"

    # Try to refresh with revoked token
    refresh_response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_response.status_code == 401


@pytest.mark.asyncio
async def test_logout_all(client: AsyncClient) -> None:
    """Test logout from all devices."""
    email = "logoutall@example.com"
    password = "SecurePass123!"

    # Register
    register_response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    access_token = register_response.json()["access_token"]
    first_refresh_token = register_response.json()["refresh_token"]

    # Login again to create second session
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    second_refresh_token = login_response.json()["refresh_token"]

    # Logout all
    logout_response = await client.post(
        "/api/v1/auth/logout-all",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_response.status_code == 200

    # Both refresh tokens should be invalidated
    response1 = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": first_refresh_token},
    )
    response2 = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": second_refresh_token},
    )

    assert response1.status_code == 401
    assert response2.status_code == 401
