"""Unit tests for password hashing."""

from app.auth.password import hash_password, verify_password


def test_hash_password() -> None:
    """Test password hashing produces a hash."""
    password = "SecurePassword123!"
    hashed = hash_password(password)

    assert hashed != password
    assert len(hashed) > 0


def test_verify_password_correct() -> None:
    """Test correct password verification."""
    password = "SecurePassword123!"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_verify_password_incorrect() -> None:
    """Test incorrect password verification."""
    password = "SecurePassword123!"
    hashed = hash_password(password)

    assert verify_password("WrongPassword123!", hashed) is False


def test_different_passwords_different_hashes() -> None:
    """Test that different passwords produce different hashes."""
    hash1 = hash_password("Password1!")
    hash2 = hash_password("Password2!")

    assert hash1 != hash2


def test_same_password_different_hashes() -> None:
    """Test that same password produces different hashes (salt)."""
    password = "SamePassword123!"
    hash1 = hash_password(password)
    hash2 = hash_password(password)

    # Hashes should be different due to random salt
    assert hash1 != hash2
    # But both should verify correctly
    assert verify_password(password, hash1) is True
    assert verify_password(password, hash2) is True
