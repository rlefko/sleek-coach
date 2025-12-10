"""Authentication request/response schemas."""

import re
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, field_validator


def _validate_password_complexity(password: str) -> str:
    """Validate password meets complexity requirements.

    Password must contain:
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character

    Args:
        password: The password to validate.

    Returns:
        The validated password.

    Raises:
        ValueError: If password doesn't meet complexity requirements.
    """
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+\[\]\\;'/`~]", password):
        raise ValueError("Password must contain at least one special character")
    return password


class RegisterRequest(BaseModel):
    """User registration request."""

    email: EmailStr
    password: Annotated[str, Field(min_length=8, max_length=128)]
    accepted_terms_version: str = Field(default="1.0", max_length=20)
    accepted_privacy_version: str = Field(default="1.0", max_length=20)

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        """Ensure password meets complexity requirements."""
        return _validate_password_complexity(v)


class LoginRequest(BaseModel):
    """User login request."""

    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Token refresh request."""

    refresh_token: str


class TokenResponse(BaseModel):
    """Token pair response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


class PasswordChangeRequest(BaseModel):
    """Password change request."""

    current_password: str
    new_password: Annotated[str, Field(min_length=8, max_length=128)]

    @field_validator("new_password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        """Ensure new password meets complexity requirements."""
        return _validate_password_complexity(v)
