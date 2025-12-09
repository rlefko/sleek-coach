"""Authentication API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session

from .dependencies import CurrentUser
from .schemas import (
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from .service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_client_info(request: Request) -> tuple[str | None, str | None]:
    """Extract client IP and user agent from request.

    Args:
        request: The FastAPI request object.

    Returns:
        Tuple of (ip_address, user_agent).
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return ip_address, user_agent


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    data: RegisterRequest,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TokenResponse:
    """Register a new user account.

    Creates a new user with email and password, initializes empty profile,
    goals, and diet preferences, and returns JWT tokens.
    """
    ip_address, user_agent = get_client_info(request)
    service = AuthService(session)

    _, token_pair = await service.register(data, ip_address, user_agent)

    return TokenResponse(
        access_token=token_pair.access_token,
        refresh_token=token_pair.refresh_token,
        token_type=token_pair.token_type,
        expires_in=token_pair.expires_in,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TokenResponse:
    """Authenticate and receive tokens.

    Validates email and password, returns JWT access and refresh tokens.
    """
    ip_address, user_agent = get_client_info(request)
    service = AuthService(session)

    _, token_pair = await service.login(data, ip_address, user_agent)

    return TokenResponse(
        access_token=token_pair.access_token,
        refresh_token=token_pair.refresh_token,
        token_type=token_pair.token_type,
        expires_in=token_pair.expires_in,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    data: RefreshRequest,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TokenResponse:
    """Refresh access token using refresh token.

    Performs token rotation: invalidates the old refresh token and
    issues a new token pair.
    """
    ip_address, user_agent = get_client_info(request)
    service = AuthService(session)

    token_pair = await service.refresh_tokens(
        data.refresh_token, ip_address, user_agent
    )

    return TokenResponse(
        access_token=token_pair.access_token,
        refresh_token=token_pair.refresh_token,
        token_type=token_pair.token_type,
        expires_in=token_pair.expires_in,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    data: RefreshRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MessageResponse:
    """Logout and invalidate refresh token.

    Revokes the provided refresh token so it can no longer be used.
    """
    service = AuthService(session)
    await service.logout(data.refresh_token)

    return MessageResponse(message="Successfully logged out")


@router.post("/logout-all", response_model=MessageResponse)
async def logout_all(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MessageResponse:
    """Logout from all devices by invalidating all refresh tokens.

    Requires authentication. Revokes all active refresh tokens for
    the current user.
    """
    service = AuthService(session)
    count = await service.logout_all(current_user.id)

    return MessageResponse(message=f"Logged out from {count} sessions")
