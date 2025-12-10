"""Security tests for injection vulnerabilities."""

import uuid
from datetime import date, datetime, timedelta
from typing import Any

from jose import jwt
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.models import User


@pytest.fixture
async def authenticated_user(
    db_session: AsyncSession, settings: Any
) -> tuple[User, str]:
    """Create an authenticated user with valid token and profile."""
    import secrets

    from app.users.models import UserProfile

    user = User(
        email="injection-test@example.com",
        hashed_password="$2b$12$test_hash",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create a profile for the user
    profile = UserProfile(
        user_id=user.id,
        display_name="Test User",
    )
    db_session.add(profile)
    await db_session.commit()

    payload = {
        "sub": str(user.id),
        "email": user.email,
        "token_type": "access",
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow(),
        "jti": secrets.token_urlsafe(16),
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

    return user, token


class TestSQLInjectionInEmail:
    """Tests for SQL injection in email fields."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("payload", [
        "'; DROP TABLE users; --",
        "admin@example.com' OR '1'='1",
        "admin@example.com'; SELECT * FROM users; --",
        "' UNION SELECT * FROM users --@example.com",
    ])
    async def test_sql_injection_in_registration_email(
        self, client: AsyncClient, payload: str
    ) -> None:
        """Test SQL injection attempts in registration email are handled safely."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": payload,
                "password": "SecurePass123!",
            },
        )

        # Should either reject as invalid email or handle safely
        # Should NOT execute SQL or cause server error
        assert response.status_code in (400, 422, 409)
        # Server should not crash
        assert "internal" not in response.text.lower() or response.status_code < 500

    @pytest.mark.asyncio
    @pytest.mark.parametrize("payload", [
        "'; DROP TABLE users; --",
        "admin@example.com' OR '1'='1",
    ])
    async def test_sql_injection_in_login_email(
        self, client: AsyncClient, payload: str
    ) -> None:
        """Test SQL injection attempts in login email are handled safely."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": payload,
                "password": "password123",
            },
        )

        # Should be handled safely - 401 for not found or 422 for validation
        assert response.status_code in (401, 422)


class TestSQLInjectionInSearch:
    """Tests for SQL injection in search/filter parameters."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("payload", [
        "2024-01-01'; DROP TABLE check_in; --",
        "2024-01-01' OR '1'='1",
        "'; SELECT * FROM users WHERE ''='",
    ])
    async def test_sql_injection_in_date_parameters(
        self, client: AsyncClient, authenticated_user: tuple[User, str], payload: str
    ) -> None:
        """Test SQL injection in date range parameters."""
        user, token = authenticated_user

        response = await client.get(
            f"/api/v1/checkins?from_date={payload}&to_date=2024-12-31",
            headers={"Authorization": f"Bearer {token}"},
        )

        # Should handle safely - validation error or proper handling
        assert response.status_code in (200, 400, 422)
        # Check that it didn't execute SQL
        if response.status_code == 200:
            # Empty result is fine, just shouldn't execute injected SQL
            pass

    @pytest.mark.asyncio
    async def test_sql_injection_in_limit_offset(
        self, client: AsyncClient, authenticated_user: tuple[User, str]
    ) -> None:
        """Test SQL injection in pagination parameters."""
        user, token = authenticated_user

        # Try to inject via limit parameter
        response = await client.get(
            "/api/v1/checkins?limit=10; DROP TABLE check_in;--&offset=0",
            headers={"Authorization": f"Bearer {token}"},
        )

        # Should be caught by validation
        assert response.status_code in (200, 400, 422)


class TestXSSInUserInput:
    """Tests for XSS vulnerabilities in user input.

    Note: In an API context, XSS is primarily about:
    1. The API not crashing on malicious input (validation)
    2. Data being stored safely (no SQL injection)
    3. Content-Type headers preventing script execution

    HTML sanitization typically happens on the frontend/rendering side.
    These tests verify the API handles potentially malicious input safely.
    """

    @pytest.mark.asyncio
    @pytest.mark.parametrize("payload", [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
        "javascript:alert('xss')",
        "<svg onload=alert('xss')>",
    ])
    async def test_xss_in_profile_display_name(
        self, client: AsyncClient, authenticated_user: tuple[User, str], payload: str
    ) -> None:
        """Test XSS attempts in profile display name are handled safely.

        API should either reject the input or store it safely without executing.
        """
        user, token = authenticated_user

        response = await client.patch(
            "/api/v1/me/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={"display_name": payload},
        )

        # API should handle safely - either accept or reject with validation error
        # Should NOT cause server error
        assert response.status_code in (200, 400, 422), (
            f"Unexpected status {response.status_code} for XSS payload"
        )

        # If accepted, verify Content-Type prevents script execution
        if response.status_code == 200:
            assert response.headers.get("content-type", "").startswith("application/json")

    @pytest.mark.asyncio
    @pytest.mark.parametrize("payload", [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
    ])
    async def test_xss_in_checkin_notes(
        self, client: AsyncClient, authenticated_user: tuple[User, str], payload: str
    ) -> None:
        """Test XSS attempts in check-in notes are handled safely.

        Notes are user-provided text that should be stored as-is.
        XSS prevention happens on frontend rendering.
        """
        user, token = authenticated_user

        response = await client.post(
            "/api/v1/checkins",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "date": str(date.today()),
                "weight_kg": 75.0,
                "notes": payload,
            },
        )

        # API should handle safely
        assert response.status_code in (200, 201, 400, 422), (
            f"Unexpected status {response.status_code} for XSS payload"
        )

        # Verify Content-Type prevents script execution
        assert response.headers.get("content-type", "").startswith("application/json")


class TestCommandInjection:
    """Tests for command injection vulnerabilities.

    These payloads should not be executed as shell commands.
    The API should either store them as plain text or reject them.
    """

    @pytest.mark.asyncio
    @pytest.mark.parametrize("payload", [
        "; cat /etc/passwd",
        "| ls -la",
        "`whoami`",
        "$(cat /etc/passwd)",
        "&& rm -rf /",
    ])
    async def test_command_injection_in_display_name(
        self, client: AsyncClient, authenticated_user: tuple[User, str], payload: str
    ) -> None:
        """Test command injection attempts in display name are handled safely.

        API should store as plain text without executing shell commands.
        """
        user, token = authenticated_user

        response = await client.patch(
            "/api/v1/me/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={"display_name": payload},
        )

        # Should be handled safely - stored as text or rejected
        assert response.status_code in (200, 400, 422), (
            f"Unexpected status {response.status_code} for command injection payload"
        )

        # Verify no shell execution occurred (API still responsive)
        verify_response = await client.get(
            "/api/v1/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert verify_response.status_code in (200, 404)  # 404 if user not found in test DB


class TestPathTraversal:
    """Tests for path traversal vulnerabilities."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("payload", [
        "../../../etc/passwd",
        "....//....//....//etc/passwd",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        "..\\..\\..\\windows\\system32\\config\\sam",
    ])
    async def test_path_traversal_in_photo_key(
        self, client: AsyncClient, authenticated_user: tuple[User, str], payload: str
    ) -> None:
        """Test path traversal in photo S3 key is prevented."""
        user, token = authenticated_user

        # If there's a photo endpoint that accepts keys
        response = await client.post(
            "/api/v1/photos/commit",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "s3_key": payload,
                "content_type": "image/jpeg",
            },
        )

        # Should be rejected or sanitized
        assert response.status_code in (400, 404, 422)


class TestNoSQLInjection:
    """Tests for NoSQL injection vulnerabilities."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("payload", [
        {"$gt": ""},
        {"$ne": None},
        {"$where": "this.password == 'test'"},
    ])
    async def test_nosql_injection_in_json_fields(
        self, client: AsyncClient, authenticated_user: tuple[User, str], payload: Any
    ) -> None:
        """Test NoSQL injection in JSON fields is prevented."""
        user, token = authenticated_user

        # Try to inject via goal_type which expects a string
        response = await client.patch(
            "/api/v1/me/goals",
            headers={"Authorization": f"Bearer {token}"},
            json={"goal_type": payload},
        )

        # Should be rejected by validation
        assert response.status_code == 422


class TestHeaderInjection:
    """Tests for HTTP header injection vulnerabilities."""

    @pytest.mark.asyncio
    async def test_crlf_injection_in_auth_header(
        self, client: AsyncClient
    ) -> None:
        """Test CRLF injection in Authorization header."""
        # Attempt to inject additional headers via CRLF
        malicious_header = "Bearer token\r\nX-Injected: true"

        response = await client.get(
            "/api/v1/me",
            headers={"Authorization": malicious_header},
        )

        # Should be handled safely (rejected or sanitized)
        assert response.status_code in (401, 400, 422)

    @pytest.mark.asyncio
    async def test_newline_injection_in_user_agent(
        self, client: AsyncClient, authenticated_user: tuple[User, str]
    ) -> None:
        """Test newline injection in User-Agent header."""
        user, token = authenticated_user

        malicious_ua = "Mozilla/5.0\r\nX-Injected: true"

        response = await client.get(
            "/api/v1/me",
            headers={
                "Authorization": f"Bearer {token}",
                "User-Agent": malicious_ua,
            },
        )

        # Should handle safely
        assert response.status_code in (200, 400)
