"""JWT token service for access and refresh tokens."""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta

from jose import JWTError, jwt
from pydantic import BaseModel

from app.config import get_settings


class TokenPayload(BaseModel):
    """Token payload structure."""

    sub: str  # user_id
    email: str
    token_type: str  # "access" or "refresh"
    exp: datetime
    iat: datetime
    jti: str  # unique token identifier


class TokenPair(BaseModel):
    """Access and refresh token pair."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until access token expires


def create_access_token(
    user_id: uuid.UUID,
    email: str,
) -> tuple[str, datetime]:
    """Create a new access token.

    Args:
        user_id: The user's unique identifier.
        email: The user's email address.

    Returns:
        Tuple of (token_string, expiration_datetime).
    """
    settings = get_settings()
    now = datetime.utcnow()
    expires = now + timedelta(minutes=settings.access_token_expire_minutes)

    payload = {
        "sub": str(user_id),
        "email": email,
        "token_type": "access",
        "exp": expires,
        "iat": now,
        "jti": secrets.token_urlsafe(16),
    }

    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, expires


def create_refresh_token(
    user_id: uuid.UUID,
    email: str,
) -> tuple[str, datetime, str]:
    """Create a new refresh token.

    Args:
        user_id: The user's unique identifier.
        email: The user's email address.

    Returns:
        Tuple of (token_string, expiration_datetime, token_hash).
    """
    settings = get_settings()
    now = datetime.utcnow()
    expires = now + timedelta(days=settings.refresh_token_expire_days)
    jti = secrets.token_urlsafe(32)

    payload = {
        "sub": str(user_id),
        "email": email,
        "token_type": "refresh",
        "exp": expires,
        "iat": now,
        "jti": jti,
    }

    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    token_hash = hash_token(token)

    return token, expires, token_hash


def create_token_pair(
    user_id: uuid.UUID,
    email: str,
) -> tuple[TokenPair, datetime, str]:
    """Create both access and refresh tokens.

    Args:
        user_id: The user's unique identifier.
        email: The user's email address.

    Returns:
        Tuple of (TokenPair, refresh_expires, refresh_hash).
    """
    access_token, access_expires = create_access_token(user_id, email)
    refresh_token, refresh_expires, refresh_hash = create_refresh_token(user_id, email)

    expires_in = int((access_expires - datetime.utcnow()).total_seconds())

    token_pair = TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
    )

    return token_pair, refresh_expires, refresh_hash


def decode_token(token: str) -> TokenPayload | None:
    """Decode and validate a JWT token.

    Args:
        token: The JWT token string to decode.

    Returns:
        TokenPayload if valid, None if invalid or expired.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return TokenPayload(
            sub=payload["sub"],
            email=payload["email"],
            token_type=payload["token_type"],
            exp=datetime.fromtimestamp(payload["exp"]),
            iat=datetime.fromtimestamp(payload["iat"]),
            jti=payload["jti"],
        )
    except JWTError:
        return None


def hash_token(token: str) -> str:
    """Create a SHA-256 hash of a token for storage.

    Args:
        token: The token string to hash.

    Returns:
        The hexadecimal hash string.
    """
    return hashlib.sha256(token.encode()).hexdigest()
