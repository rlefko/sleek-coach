"""Password hashing service using Argon2id."""

from passlib.context import CryptContext

# Configure Argon2id as the password hashing algorithm
# These parameters follow OWASP recommendations for Argon2id
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__memory_cost=65536,  # 64 MB
    argon2__time_cost=3,
    argon2__parallelism=4,
)


def hash_password(password: str) -> str:
    """Hash a password using Argon2id.

    Args:
        password: The plain text password to hash.

    Returns:
        The hashed password string.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.

    Args:
        plain_password: The plain text password to verify.
        hashed_password: The hashed password to check against.

    Returns:
        True if the password matches, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)
