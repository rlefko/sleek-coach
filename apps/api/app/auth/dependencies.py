"""Authentication dependencies for FastAPI routes."""

import uuid
from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.exceptions import UnauthorizedError
from app.users.models import User

from .tokens import TokenPayload, decode_token


async def get_token_from_header(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    """Extract token from Authorization header.

    Args:
        authorization: The Authorization header value.

    Returns:
        The extracted Bearer token.

    Raises:
        UnauthorizedError: If header is missing or invalid.
    """
    if not authorization:
        raise UnauthorizedError("Missing authorization header")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise UnauthorizedError("Invalid authorization header format")

    return token


async def get_current_token_payload(
    token: Annotated[str, Depends(get_token_from_header)],
) -> TokenPayload:
    """Validate token and return payload.

    Args:
        token: The Bearer token to validate.

    Returns:
        The decoded token payload.

    Raises:
        UnauthorizedError: If token is invalid or expired.
    """
    payload = decode_token(token)
    if payload is None:
        raise UnauthorizedError("Invalid or expired token")

    if payload.token_type != "access":
        raise UnauthorizedError("Invalid token type")

    return payload


async def get_current_user(
    payload: Annotated[TokenPayload, Depends(get_current_token_payload)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    """Get current authenticated user from token.

    Args:
        payload: The validated token payload.
        session: The database session.

    Returns:
        The authenticated user.

    Raises:
        UnauthorizedError: If user not found or inactive.
    """
    user_id = uuid.UUID(payload.sub)

    result = await session.execute(
        select(User).where(User.id == user_id, User.is_active == True)  # noqa: E712
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise UnauthorizedError("User not found or inactive")

    return user


async def get_current_active_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Ensure user is active.

    Args:
        user: The current user.

    Returns:
        The active user.

    Raises:
        UnauthorizedError: If user account is disabled.
    """
    if not user.is_active:
        raise UnauthorizedError("User account is disabled")
    return user


# Type alias for dependency injection
CurrentUser = Annotated[User, Depends(get_current_active_user)]
