"""Unit tests for JWT token service."""

import uuid
from datetime import datetime

from app.auth.tokens import (
    create_access_token,
    create_refresh_token,
    create_token_pair,
    decode_token,
    hash_token,
)


def test_create_access_token() -> None:
    """Test access token creation."""
    user_id = uuid.uuid4()
    email = "test@example.com"

    token, expires = create_access_token(user_id, email)

    assert isinstance(token, str)
    assert len(token) > 0
    assert expires > datetime.utcnow()


def test_create_refresh_token() -> None:
    """Test refresh token creation."""
    user_id = uuid.uuid4()
    email = "test@example.com"

    token, expires, token_hash = create_refresh_token(user_id, email)

    assert isinstance(token, str)
    assert isinstance(token_hash, str)
    assert expires > datetime.utcnow()
    assert len(token_hash) == 64  # SHA-256 hex length


def test_decode_valid_access_token() -> None:
    """Test decoding a valid access token."""
    user_id = uuid.uuid4()
    email = "test@example.com"

    token, _ = create_access_token(user_id, email)
    payload = decode_token(token)

    assert payload is not None
    assert payload.sub == str(user_id)
    assert payload.email == email
    assert payload.token_type == "access"


def test_decode_valid_refresh_token() -> None:
    """Test decoding a valid refresh token."""
    user_id = uuid.uuid4()
    email = "test@example.com"

    token, _, _ = create_refresh_token(user_id, email)
    payload = decode_token(token)

    assert payload is not None
    assert payload.sub == str(user_id)
    assert payload.email == email
    assert payload.token_type == "refresh"


def test_decode_invalid_token() -> None:
    """Test decoding an invalid token returns None."""
    payload = decode_token("invalid.token.here")

    assert payload is None


def test_decode_tampered_token() -> None:
    """Test decoding a tampered token returns None."""
    user_id = uuid.uuid4()
    email = "test@example.com"

    token, _ = create_access_token(user_id, email)
    # Tamper with the token
    tampered_token = token[:-5] + "xxxxx"

    payload = decode_token(tampered_token)

    assert payload is None


def test_token_pair_creation() -> None:
    """Test token pair creation."""
    user_id = uuid.uuid4()
    email = "test@example.com"

    token_pair, refresh_expires, refresh_hash = create_token_pair(user_id, email)

    assert token_pair.access_token
    assert token_pair.refresh_token
    assert token_pair.token_type == "bearer"
    assert token_pair.expires_in > 0
    assert refresh_expires > datetime.utcnow()
    assert len(refresh_hash) == 64


def test_hash_token() -> None:
    """Test token hashing produces consistent SHA-256 hash."""
    token = "test_token_string"

    hash1 = hash_token(token)
    hash2 = hash_token(token)

    assert hash1 == hash2
    assert len(hash1) == 64  # SHA-256 produces 64 hex characters


def test_different_tokens_different_hashes() -> None:
    """Test different tokens produce different hashes."""
    hash1 = hash_token("token1")
    hash2 = hash_token("token2")

    assert hash1 != hash2
