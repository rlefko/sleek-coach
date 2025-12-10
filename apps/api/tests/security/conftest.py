"""Security test fixtures."""

import uuid
from datetime import datetime, timedelta
from typing import Any

import pytest
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.users.models import User


@pytest.fixture
def settings() -> Any:
    """Get app settings."""
    return get_settings()


@pytest.fixture
def valid_user_id() -> uuid.UUID:
    """Generate a valid user ID."""
    return uuid.uuid4()


@pytest.fixture
def create_valid_token(settings: Any, valid_user_id: uuid.UUID) -> str:
    """Create a valid JWT token with all required fields."""
    import secrets

    payload = {
        "sub": str(valid_user_id),
        "email": f"test-{valid_user_id}@example.com",
        "token_type": "access",
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow(),
        "jti": secrets.token_urlsafe(16),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


@pytest.fixture
def create_expired_token(settings: Any, valid_user_id: uuid.UUID) -> str:
    """Create an expired JWT token."""
    import secrets

    payload = {
        "sub": str(valid_user_id),
        "email": f"test-{valid_user_id}@example.com",
        "token_type": "access",
        "exp": datetime.utcnow() - timedelta(hours=1),  # Expired
        "iat": datetime.utcnow() - timedelta(hours=2),
        "jti": secrets.token_urlsafe(16),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


@pytest.fixture
def create_token_wrong_secret(valid_user_id: uuid.UUID) -> str:
    """Create a token signed with wrong secret."""
    import secrets

    payload = {
        "sub": str(valid_user_id),
        "email": f"test-{valid_user_id}@example.com",
        "token_type": "access",
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow(),
        "jti": secrets.token_urlsafe(16),
    }
    return jwt.encode(payload, "wrong-secret-key", algorithm="HS256")


@pytest.fixture
def malformed_tokens() -> list[str]:
    """Return a list of malformed tokens."""
    return [
        "",  # Empty
        "not-a-jwt",  # Random string
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",  # Only header
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0",  # Missing sig
        "a.b.c",  # Invalid structure
        "Bearer token",  # With prefix in wrong place
    ]


@pytest.fixture
async def test_user_for_security(db_session: AsyncSession) -> User:
    """Create a test user for security tests."""
    user = User(
        email="security-test@example.com",
        hashed_password="$2b$12$test_hash",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def sql_injection_payloads() -> list[str]:
    """Return common SQL injection payloads."""
    return [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "1; SELECT * FROM users",
        "admin'--",
        "1' UNION SELECT * FROM users --",
        "1' AND 1=1 --",
        "' OR 1=1#",
        "'; INSERT INTO users VALUES('hacked', 'hacked'); --",
        "1; UPDATE users SET email='hacked' WHERE 1=1; --",
    ]


@pytest.fixture
def xss_payloads() -> list[str]:
    """Return common XSS payloads."""
    return [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
        "javascript:alert('xss')",
        "<svg onload=alert('xss')>",
        "'-alert(1)-'",
        "<body onload=alert('xss')>",
        "{{constructor.constructor('alert(1)')()}}",  # Angular template injection
        "${alert('xss')}",  # Template literal injection
    ]
