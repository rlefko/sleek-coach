"""Unit tests for UserConsentService."""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.users.consent_service import UserConsentService
from app.users.models import ConsentType, UserConsent


@pytest.fixture
def mock_session() -> MagicMock:
    """Create a mock database session."""
    session = MagicMock()
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    return session


@pytest.fixture
def consent_service(mock_session: MagicMock) -> UserConsentService:
    """Create a consent service with mock session."""
    return UserConsentService(mock_session)


@pytest.fixture
def sample_user_id() -> uuid.UUID:
    """Create a sample user ID."""
    return uuid.uuid4()


class TestGetUserConsents:
    """Tests for get_user_consents method."""

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_consents(
        self,
        consent_service: UserConsentService,
        sample_user_id: uuid.UUID,
        mock_session: MagicMock,
    ) -> None:
        """Test that empty list is returned when user has no consents."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_session.execute = AsyncMock(return_value=mock_result)

        consents = await consent_service.get_user_consents(sample_user_id)

        assert consents == []

    @pytest.mark.asyncio
    async def test_returns_user_consents(
        self,
        consent_service: UserConsentService,
        sample_user_id: uuid.UUID,
        mock_session: MagicMock,
    ) -> None:
        """Test that consents are returned for user."""
        mock_consent = UserConsent(
            id=uuid.uuid4(),
            user_id=sample_user_id,
            consent_type=ConsentType.TERMS_OF_SERVICE,
            granted=True,
            version="1.0",
        )
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [mock_consent]
        mock_session.execute = AsyncMock(return_value=mock_result)

        consents = await consent_service.get_user_consents(sample_user_id)

        assert len(consents) == 1
        assert consents[0].consent_type == ConsentType.TERMS_OF_SERVICE


class TestHasConsent:
    """Tests for has_consent method."""

    @pytest.mark.asyncio
    async def test_returns_false_when_no_consent(
        self,
        consent_service: UserConsentService,
        sample_user_id: uuid.UUID,
        mock_session: MagicMock,
    ) -> None:
        """Test that False is returned when user has no consent."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)

        has_consent = await consent_service.has_consent(sample_user_id, ConsentType.WEB_SEARCH)

        assert has_consent is False

    @pytest.mark.asyncio
    async def test_returns_true_when_consent_granted(
        self,
        consent_service: UserConsentService,
        sample_user_id: uuid.UUID,
        mock_session: MagicMock,
    ) -> None:
        """Test that True is returned when user has granted consent."""
        mock_consent = UserConsent(
            id=uuid.uuid4(),
            user_id=sample_user_id,
            consent_type=ConsentType.WEB_SEARCH,
            granted=True,
            version="1.0",
        )
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_consent
        mock_session.execute = AsyncMock(return_value=mock_result)

        has_consent = await consent_service.has_consent(sample_user_id, ConsentType.WEB_SEARCH)

        assert has_consent is True

    @pytest.mark.asyncio
    async def test_returns_false_when_consent_revoked(
        self,
        consent_service: UserConsentService,
        sample_user_id: uuid.UUID,
        mock_session: MagicMock,
    ) -> None:
        """Test that False is returned when consent is revoked."""
        mock_consent = UserConsent(
            id=uuid.uuid4(),
            user_id=sample_user_id,
            consent_type=ConsentType.WEB_SEARCH,
            granted=True,
            version="1.0",
            revoked_at=datetime.now(UTC),
        )
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_consent
        mock_session.execute = AsyncMock(return_value=mock_result)

        has_consent = await consent_service.has_consent(sample_user_id, ConsentType.WEB_SEARCH)

        assert has_consent is False


class TestGrantConsent:
    """Tests for grant_consent method."""

    @pytest.mark.asyncio
    async def test_creates_new_consent(
        self,
        consent_service: UserConsentService,
        sample_user_id: uuid.UUID,
        mock_session: MagicMock,
    ) -> None:
        """Test that a new consent is created."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)

        consent = await consent_service.grant_consent(
            user_id=sample_user_id,
            consent_type=ConsentType.WEB_SEARCH,
            version="1.0",
        )

        assert consent.user_id == sample_user_id
        assert consent.consent_type == ConsentType.WEB_SEARCH
        assert consent.granted is True
        assert consent.version == "1.0"
        mock_session.add.assert_called_once()


class TestRevokeConsent:
    """Tests for revoke_consent method."""

    @pytest.mark.asyncio
    async def test_revokes_existing_consent(
        self,
        consent_service: UserConsentService,
        sample_user_id: uuid.UUID,
        mock_session: MagicMock,
    ) -> None:
        """Test that an existing consent is revoked."""
        mock_consent = UserConsent(
            id=uuid.uuid4(),
            user_id=sample_user_id,
            consent_type=ConsentType.WEB_SEARCH,
            granted=True,
            version="1.0",
        )
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_consent
        mock_session.execute = AsyncMock(return_value=mock_result)

        consent = await consent_service.revoke_consent(sample_user_id, ConsentType.WEB_SEARCH)

        assert consent is not None
        assert consent.revoked_at is not None

    @pytest.mark.asyncio
    async def test_returns_none_when_no_consent_to_revoke(
        self,
        consent_service: UserConsentService,
        sample_user_id: uuid.UUID,
        mock_session: MagicMock,
    ) -> None:
        """Test that None is returned when there's no consent to revoke."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)

        consent = await consent_service.revoke_consent(sample_user_id, ConsentType.WEB_SEARCH)

        assert consent is None
