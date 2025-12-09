"""Authentication business logic service."""

import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.exceptions import ConflictError, UnauthorizedError
from app.users.models import DietPreferences, User, UserGoal, UserProfile

from .models import RefreshToken
from .password import hash_password, verify_password
from .schemas import LoginRequest, RegisterRequest
from .tokens import TokenPair, create_token_pair, decode_token, hash_token


class AuthService:
    """Authentication service for user management."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize auth service with database session.

        Args:
            session: The async database session.
        """
        self.session = session

    async def register(
        self,
        data: RegisterRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[User, TokenPair]:
        """Register a new user and return tokens.

        Args:
            data: The registration request data.
            ip_address: Client IP address.
            user_agent: Client user agent string.

        Returns:
            Tuple of (user, token_pair).

        Raises:
            ConflictError: If email already registered.
        """
        # Check for existing user
        existing = await self.session.execute(
            select(User).where(User.email == data.email.lower())
        )
        if existing.scalar_one_or_none():
            raise ConflictError("Email already registered")

        # Create user
        user = User(
            email=data.email.lower(),
            hashed_password=hash_password(data.password),
        )
        self.session.add(user)
        await self.session.flush()

        # Create associated records
        profile = UserProfile(user_id=user.id)
        goal = UserGoal(user_id=user.id)
        preferences = DietPreferences(user_id=user.id)

        self.session.add_all([profile, goal, preferences])

        # Create tokens
        token_pair, refresh_expires, refresh_hash = create_token_pair(
            user.id, user.email
        )

        # Store refresh token
        refresh_token = RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=refresh_expires,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.session.add(refresh_token)

        await self.session.commit()
        await self.session.refresh(user)

        return user, token_pair

    async def login(
        self,
        data: LoginRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[User, TokenPair]:
        """Authenticate user and return tokens.

        Args:
            data: The login request data.
            ip_address: Client IP address.
            user_agent: Client user agent string.

        Returns:
            Tuple of (user, token_pair).

        Raises:
            UnauthorizedError: If credentials are invalid.
        """
        result = await self.session.execute(
            select(User).where(User.email == data.email.lower())
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedError("Account is disabled")

        # Create tokens
        token_pair, refresh_expires, refresh_hash = create_token_pair(
            user.id, user.email
        )

        # Store refresh token
        refresh_token = RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=refresh_expires,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.session.add(refresh_token)
        await self.session.commit()

        return user, token_pair

    async def refresh_tokens(
        self,
        refresh_token_str: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenPair:
        """Refresh tokens using a valid refresh token.

        Args:
            refresh_token_str: The refresh token string.
            ip_address: Client IP address.
            user_agent: Client user agent string.

        Returns:
            New token pair.

        Raises:
            UnauthorizedError: If refresh token is invalid.
        """
        # Decode and validate token
        payload = decode_token(refresh_token_str)
        if payload is None or payload.token_type != "refresh":
            raise UnauthorizedError("Invalid refresh token")

        # Find token in database
        token_hash = hash_token(refresh_token_str)
        token_result = await self.session.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at == None,  # noqa: E711
            )
        )
        stored_token = token_result.scalar_one_or_none()

        if not stored_token or not stored_token.is_valid:
            raise UnauthorizedError("Refresh token is invalid or expired")

        # Revoke old token (token rotation)
        stored_token.revoked_at = datetime.utcnow()

        # Get user
        user_result = await self.session.execute(
            select(User).where(
                User.id == stored_token.user_id,
                User.is_active == True,  # noqa: E712
            )
        )
        user = user_result.scalar_one_or_none()

        if not user:
            raise UnauthorizedError("User not found or inactive")

        # Create new token pair
        token_pair, refresh_expires, refresh_hash = create_token_pair(
            user.id, user.email
        )

        # Store new refresh token
        new_refresh_token = RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=refresh_expires,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.session.add(new_refresh_token)
        await self.session.commit()

        return token_pair

    async def logout(self, refresh_token_str: str) -> None:
        """Revoke a refresh token.

        Args:
            refresh_token_str: The refresh token to revoke.
        """
        token_hash = hash_token(refresh_token_str)
        result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        stored_token = result.scalar_one_or_none()

        if stored_token and stored_token.revoked_at is None:
            stored_token.revoked_at = datetime.utcnow()
            await self.session.commit()

    async def logout_all(self, user_id: uuid.UUID) -> int:
        """Revoke all refresh tokens for a user.

        Args:
            user_id: The user's ID.

        Returns:
            Number of tokens revoked.
        """
        result = await self.session.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at == None,  # noqa: E711
            )
        )
        tokens = result.scalars().all()

        now = datetime.utcnow()
        for token in tokens:
            token.revoked_at = now

        await self.session.commit()
        return len(tokens)
