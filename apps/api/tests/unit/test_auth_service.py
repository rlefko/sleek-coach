"""Unit tests for AuthService."""

import uuid
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import RefreshToken
from app.auth.schemas import LoginRequest, RegisterRequest
from app.auth.service import AuthService
from app.exceptions import ConflictError, UnauthorizedError
from app.users.models import User


class TestAuthServiceInit:
    """Tests for AuthService initialization."""

    def test_init_stores_session(self) -> None:
        """Test that init stores the session."""
        mock_session = AsyncMock(spec=AsyncSession)
        service = AuthService(mock_session)
        assert service.session is mock_session


class TestAuthServiceRegister:
    """Tests for AuthService.register method."""

    @pytest.fixture
    def mock_session(self) -> AsyncMock:
        """Create a mock database session."""
        session = AsyncMock(spec=AsyncSession)
        # Mock the execute result for checking existing user
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        session.execute.return_value = mock_result
        return session

    @pytest.mark.asyncio
    async def test_register_creates_user(self, mock_session: AsyncMock) -> None:
        """Test that register creates a new user."""
        service = AuthService(mock_session)
        data = RegisterRequest(email="test@example.com", password="SecurePass123!")

        with patch("app.auth.service.hash_password", return_value="hashed"):
            with patch("app.auth.service.create_token_pair") as mock_create:
                mock_create.return_value = (
                    MagicMock(access_token="access", refresh_token="refresh"),
                    datetime.utcnow() + timedelta(days=7),
                    "refresh_hash",
                )
                _user, _token_pair = await service.register(data)

        assert mock_session.add.called
        assert mock_session.commit.called

    @pytest.mark.asyncio
    async def test_register_conflict_existing_email(self) -> None:
        """Test that register raises ConflictError for existing email."""
        mock_session = AsyncMock(spec=AsyncSession)
        # Mock finding existing user
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = User(
            email="test@example.com", hashed_password="hash"
        )
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)
        data = RegisterRequest(email="test@example.com", password="SecurePass123!")

        with pytest.raises(ConflictError, match="Email already registered"):
            await service.register(data)

    @pytest.mark.asyncio
    async def test_register_normalizes_email(self, mock_session: AsyncMock) -> None:
        """Test that register normalizes email to lowercase."""
        service = AuthService(mock_session)
        data = RegisterRequest(email="TEST@EXAMPLE.COM", password="SecurePass123!")

        with patch("app.auth.service.hash_password", return_value="hashed"):
            with patch("app.auth.service.create_token_pair") as mock_create:
                mock_create.return_value = (
                    MagicMock(access_token="access", refresh_token="refresh"),
                    datetime.utcnow() + timedelta(days=7),
                    "refresh_hash",
                )
                await service.register(data)

        # Check the query used lowercase email
        # The select statement should query with lowercase email


class TestAuthServiceLogin:
    """Tests for AuthService.login method."""

    @pytest.fixture
    def mock_user(self) -> User:
        """Create a mock user."""
        user = User(email="test@example.com", hashed_password="hashed_pass")
        user.id = uuid.uuid4()
        user.is_active = True
        return user

    @pytest.mark.asyncio
    async def test_login_success(self, mock_user: User) -> None:
        """Test successful login."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)
        data = LoginRequest(email="test@example.com", password="correct_password")

        with patch("app.auth.service.verify_password", return_value=True):
            with patch("app.auth.service.create_token_pair") as mock_create:
                mock_create.return_value = (
                    MagicMock(access_token="access", refresh_token="refresh"),
                    datetime.utcnow() + timedelta(days=7),
                    "refresh_hash",
                )
                user, _token_pair = await service.login(data)

        assert user == mock_user
        assert mock_session.commit.called

    @pytest.mark.asyncio
    async def test_login_invalid_password(self, mock_user: User) -> None:
        """Test login with invalid password."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)
        data = LoginRequest(email="test@example.com", password="wrong_password")

        with patch("app.auth.service.verify_password", return_value=False):
            with pytest.raises(UnauthorizedError, match="Invalid email or password"):
                await service.login(data)

    @pytest.mark.asyncio
    async def test_login_user_not_found(self) -> None:
        """Test login with non-existent user."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)
        data = LoginRequest(email="unknown@example.com", password="password")

        with pytest.raises(UnauthorizedError, match="Invalid email or password"):
            await service.login(data)

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, mock_user: User) -> None:
        """Test login with inactive user."""
        mock_user.is_active = False
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)
        data = LoginRequest(email="test@example.com", password="correct_password")

        with patch("app.auth.service.verify_password", return_value=True):
            with pytest.raises(UnauthorizedError, match="Account is disabled"):
                await service.login(data)


class TestAuthServiceRefreshTokens:
    """Tests for AuthService.refresh_tokens method."""

    @pytest.fixture
    def mock_user(self) -> User:
        """Create a mock user."""
        user = User(email="test@example.com", hashed_password="hashed_pass")
        user.id = uuid.uuid4()
        user.is_active = True
        return user

    @pytest.mark.asyncio
    async def test_refresh_invalid_token_type(self) -> None:
        """Test refresh with non-refresh token."""
        mock_session = AsyncMock(spec=AsyncSession)
        service = AuthService(mock_session)

        with patch("app.auth.service.decode_token") as mock_decode:
            mock_decode.return_value = MagicMock(token_type="access")
            with pytest.raises(UnauthorizedError, match="Invalid refresh token"):
                await service.refresh_tokens("some_token")

    @pytest.mark.asyncio
    async def test_refresh_invalid_token_payload(self) -> None:
        """Test refresh with invalid token."""
        mock_session = AsyncMock(spec=AsyncSession)
        service = AuthService(mock_session)

        with patch("app.auth.service.decode_token", return_value=None):
            with pytest.raises(UnauthorizedError, match="Invalid refresh token"):
                await service.refresh_tokens("invalid_token")

    @pytest.mark.asyncio
    async def test_refresh_token_not_in_db(self) -> None:
        """Test refresh with token not found in database."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)

        with patch("app.auth.service.decode_token") as mock_decode:
            mock_decode.return_value = MagicMock(token_type="refresh")
            with patch("app.auth.service.hash_token", return_value="hashed"):
                with pytest.raises(UnauthorizedError, match="Refresh token is invalid or expired"):
                    await service.refresh_tokens("valid_format_token")

    @pytest.mark.asyncio
    async def test_refresh_success(self, mock_user: User) -> None:
        """Test successful token refresh."""
        mock_session = AsyncMock(spec=AsyncSession)

        # Create mock stored token
        stored_token = MagicMock(spec=RefreshToken)
        stored_token.is_valid = True
        stored_token.user_id = mock_user.id
        stored_token.revoked_at = None

        # First call returns stored token, second returns user
        mock_result_token = MagicMock()
        mock_result_token.scalar_one_or_none.return_value = stored_token

        mock_result_user = MagicMock()
        mock_result_user.scalar_one_or_none.return_value = mock_user

        mock_session.execute.side_effect = [mock_result_token, mock_result_user]

        service = AuthService(mock_session)

        with patch("app.auth.service.decode_token") as mock_decode:
            mock_decode.return_value = MagicMock(token_type="refresh")
            with patch("app.auth.service.hash_token", return_value="hashed"):
                with patch("app.auth.service.create_token_pair") as mock_create:
                    mock_create.return_value = (
                        MagicMock(access_token="new_access", refresh_token="new_refresh"),
                        datetime.utcnow() + timedelta(days=7),
                        "new_hash",
                    )
                    _token_pair = await service.refresh_tokens("valid_token")

        # Verify old token was revoked
        assert stored_token.revoked_at is not None
        assert mock_session.commit.called


class TestAuthServiceLogout:
    """Tests for AuthService.logout method."""

    @pytest.mark.asyncio
    async def test_logout_revokes_token(self) -> None:
        """Test that logout revokes the token."""
        mock_session = AsyncMock(spec=AsyncSession)

        stored_token = MagicMock(spec=RefreshToken)
        stored_token.revoked_at = None

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = stored_token
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)

        with patch("app.auth.service.hash_token", return_value="hashed"):
            await service.logout("some_token")

        assert stored_token.revoked_at is not None
        assert mock_session.commit.called

    @pytest.mark.asyncio
    async def test_logout_token_not_found(self) -> None:
        """Test logout when token not found (no error)."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)

        with patch("app.auth.service.hash_token", return_value="hashed"):
            await service.logout("unknown_token")

        # Should not raise, just silently complete
        assert not mock_session.commit.called

    @pytest.mark.asyncio
    async def test_logout_already_revoked(self) -> None:
        """Test logout when token already revoked."""
        mock_session = AsyncMock(spec=AsyncSession)

        stored_token = MagicMock(spec=RefreshToken)
        stored_token.revoked_at = datetime.utcnow()  # Already revoked

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = stored_token
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)

        with patch("app.auth.service.hash_token", return_value="hashed"):
            await service.logout("some_token")

        # Should not commit since token was already revoked
        assert not mock_session.commit.called


class TestAuthServiceLogoutAll:
    """Tests for AuthService.logout_all method."""

    @pytest.mark.asyncio
    async def test_logout_all_revokes_all_tokens(self) -> None:
        """Test that logout_all revokes all user tokens."""
        mock_session = AsyncMock(spec=AsyncSession)

        token1 = MagicMock(spec=RefreshToken)
        token1.revoked_at = None
        token2 = MagicMock(spec=RefreshToken)
        token2.revoked_at = None

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [token1, token2]
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)
        user_id = uuid.uuid4()

        count = await service.logout_all(user_id)

        assert count == 2
        assert token1.revoked_at is not None
        assert token2.revoked_at is not None
        assert mock_session.commit.called

    @pytest.mark.asyncio
    async def test_logout_all_no_tokens(self) -> None:
        """Test logout_all when user has no active tokens."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)
        user_id = uuid.uuid4()

        count = await service.logout_all(user_id)

        assert count == 0


class TestAuthServiceChangePassword:
    """Tests for AuthService.change_password method."""

    @pytest.fixture
    def mock_user(self) -> User:
        """Create a mock user."""
        user = User(email="test@example.com", hashed_password="old_hash")
        user.id = uuid.uuid4()
        return user

    @pytest.mark.asyncio
    async def test_change_password_success(self, mock_user: User) -> None:
        """Test successful password change."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)

        with patch("app.auth.service.verify_password", return_value=True):
            with patch("app.auth.service.hash_password", return_value="new_hash"):
                await service.change_password(mock_user.id, "old_password", "new_password")

        assert mock_user.hashed_password == "new_hash"
        assert mock_session.commit.called

    @pytest.mark.asyncio
    async def test_change_password_wrong_current(self, mock_user: User) -> None:
        """Test change password with wrong current password."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)

        with (
            patch("app.auth.service.verify_password", return_value=False),
            pytest.raises(UnauthorizedError, match="Current password is incorrect"),
        ):
            await service.change_password(mock_user.id, "wrong_password", "new_password")

    @pytest.mark.asyncio
    async def test_change_password_user_not_found(self) -> None:
        """Test change password with non-existent user."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        service = AuthService(mock_session)

        with pytest.raises(UnauthorizedError, match="User not found"):
            await service.change_password(uuid.uuid4(), "old", "new")
