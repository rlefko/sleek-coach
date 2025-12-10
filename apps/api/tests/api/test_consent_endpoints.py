"""API tests for consent endpoints."""

import pytest
from httpx import AsyncClient


async def get_auth_headers(client: AsyncClient, email: str | None = None) -> dict[str, str]:
    """Register a user and return auth headers."""
    test_email = email or f"consent_user_{id(client)}@example.com"
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": test_email, "password": "SecurePass123!"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_consents(client: AsyncClient) -> None:
    """Test getting user consents."""
    headers = await get_auth_headers(client, "getconsents@example.com")

    response = await client.get("/api/v1/me/consents", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "consents" in data
    assert isinstance(data["consents"], list)


@pytest.mark.asyncio
async def test_get_consents_unauthorized(client: AsyncClient) -> None:
    """Test getting consents without auth fails."""
    response = await client.get("/api/v1/me/consents")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_grant_consent(client: AsyncClient) -> None:
    """Test granting a consent."""
    headers = await get_auth_headers(client, "grantconsent@example.com")

    response = await client.post(
        "/api/v1/me/consents",
        headers=headers,
        json={"consent_type": "web_search", "granted": True},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["consent_type"] == "web_search"
    assert data["granted"] is True
    assert data["revoked_at"] is None


@pytest.mark.asyncio
async def test_grant_consent_all_types(client: AsyncClient) -> None:
    """Test granting all consent types."""
    headers = await get_auth_headers(client, "alltypes@example.com")

    consent_types = ["web_search", "analytics", "photo_ai_access"]

    for consent_type in consent_types:
        response = await client.post(
            "/api/v1/me/consents",
            headers=headers,
            json={"consent_type": consent_type, "granted": True},
        )
        assert response.status_code == 200
        assert response.json()["consent_type"] == consent_type


@pytest.mark.asyncio
async def test_grant_consent_invalid_type(client: AsyncClient) -> None:
    """Test granting invalid consent type fails."""
    headers = await get_auth_headers(client, "invalidtype@example.com")

    response = await client.post(
        "/api/v1/me/consents",
        headers=headers,
        json={"consent_type": "invalid_type", "granted": True},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_revoke_consent(client: AsyncClient) -> None:
    """Test revoking a consent."""
    headers = await get_auth_headers(client, "revokeconsent@example.com")

    # First grant consent
    await client.post(
        "/api/v1/me/consents",
        headers=headers,
        json={"consent_type": "web_search", "granted": True},
    )

    # Then revoke it
    response = await client.delete(
        "/api/v1/me/consents/web_search",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["consent_type"] == "web_search"
    assert data["revoked_at"] is not None


@pytest.mark.asyncio
async def test_revoke_nonexistent_consent(client: AsyncClient) -> None:
    """Test revoking a nonexistent consent returns 404."""
    headers = await get_auth_headers(client, "revokenonexistent@example.com")

    response = await client.delete(
        "/api/v1/me/consents/web_search",
        headers=headers,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_consent_flow(client: AsyncClient) -> None:
    """Test full consent grant/revoke/re-grant flow."""
    headers = await get_auth_headers(client, "consentflow@example.com")

    # Grant consent
    response = await client.post(
        "/api/v1/me/consents",
        headers=headers,
        json={"consent_type": "analytics", "granted": True},
    )
    assert response.status_code == 200
    assert response.json()["granted"] is True

    # Check it appears in list
    response = await client.get("/api/v1/me/consents", headers=headers)
    consents = response.json()["consents"]
    analytics_consents = [c for c in consents if c["consent_type"] == "analytics"]
    assert len(analytics_consents) == 1
    assert analytics_consents[0]["revoked_at"] is None

    # Revoke consent
    response = await client.delete(
        "/api/v1/me/consents/analytics",
        headers=headers,
    )
    assert response.status_code == 200

    # Check it's now revoked
    response = await client.get("/api/v1/me/consents", headers=headers)
    consents = response.json()["consents"]
    analytics_consents = [c for c in consents if c["consent_type"] == "analytics"]
    assert len(analytics_consents) == 1
    assert analytics_consents[0]["revoked_at"] is not None

    # Re-grant consent
    response = await client.post(
        "/api/v1/me/consents",
        headers=headers,
        json={"consent_type": "analytics", "granted": True},
    )
    assert response.status_code == 200

    # Verify consent is active again
    response = await client.get("/api/v1/me/consents", headers=headers)
    consents = response.json()["consents"]
    analytics_consents = [
        c for c in consents if c["consent_type"] == "analytics" and c["revoked_at"] is None
    ]
    assert len(analytics_consents) >= 1
