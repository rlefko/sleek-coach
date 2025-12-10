"""API tests for legal document endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_privacy_policy(client: AsyncClient) -> None:
    """Test getting privacy policy."""
    response = await client.get("/api/v1/legal/privacy-policy")

    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "version" in data
    assert "effective_date" in data
    assert len(data["content"]) > 0
    assert "Privacy Policy" in data["content"]


@pytest.mark.asyncio
async def test_get_terms_of_service(client: AsyncClient) -> None:
    """Test getting terms of service."""
    response = await client.get("/api/v1/legal/terms-of-service")

    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "version" in data
    assert "effective_date" in data
    assert len(data["content"]) > 0
    assert "Terms of Service" in data["content"]


@pytest.mark.asyncio
async def test_get_data_retention(client: AsyncClient) -> None:
    """Test getting data retention policy."""
    response = await client.get("/api/v1/legal/data-retention")

    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "version" in data
    assert "effective_date" in data
    assert len(data["content"]) > 0
    assert "Data Retention" in data["content"]


@pytest.mark.asyncio
async def test_get_legal_versions(client: AsyncClient) -> None:
    """Test getting legal document versions."""
    response = await client.get("/api/v1/legal/versions")

    assert response.status_code == 200
    data = response.json()
    assert "privacy_policy_version" in data
    assert "terms_of_service_version" in data
    assert "data_retention_version" in data
    # All versions should be strings
    assert isinstance(data["privacy_policy_version"], str)
    assert isinstance(data["terms_of_service_version"], str)
    assert isinstance(data["data_retention_version"], str)


@pytest.mark.asyncio
async def test_legal_documents_are_public(client: AsyncClient) -> None:
    """Test that legal documents don't require authentication."""
    # All legal endpoints should work without auth
    endpoints = [
        "/api/v1/legal/privacy-policy",
        "/api/v1/legal/terms-of-service",
        "/api/v1/legal/data-retention",
        "/api/v1/legal/versions",
    ]

    for endpoint in endpoints:
        response = await client.get(endpoint)
        assert response.status_code == 200, f"Failed for {endpoint}"


@pytest.mark.asyncio
async def test_privacy_policy_contains_required_sections(client: AsyncClient) -> None:
    """Test that privacy policy contains required sections."""
    response = await client.get("/api/v1/legal/privacy-policy")

    assert response.status_code == 200
    content = response.json()["content"].lower()

    # Check for GDPR/CCPA required sections
    required_phrases = [
        "information we collect",
        "how we use",
        "your rights",
        "contact",
    ]

    for phrase in required_phrases:
        assert phrase in content, f"Missing required section: {phrase}"


@pytest.mark.asyncio
async def test_terms_of_service_contains_disclaimers(client: AsyncClient) -> None:
    """Test that terms of service contains required disclaimers."""
    response = await client.get("/api/v1/legal/terms-of-service")

    assert response.status_code == 200
    content = response.json()["content"].lower()

    # Check for health-related disclaimers
    required_phrases = [
        "not medical advice",
        "healthcare",
        "professional",
    ]

    for phrase in required_phrases:
        assert phrase in content, f"Missing required disclaimer: {phrase}"


@pytest.mark.asyncio
async def test_data_retention_contains_retention_periods(client: AsyncClient) -> None:
    """Test that data retention policy contains retention periods."""
    response = await client.get("/api/v1/legal/data-retention")

    assert response.status_code == 200
    content = response.json()["content"].lower()

    # Check for retention-related terms
    required_phrases = [
        "retention",
        "delete",
    ]

    for phrase in required_phrases:
        assert phrase in content, f"Missing required section: {phrase}"
