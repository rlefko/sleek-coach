"""User consent management service."""

import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.users.models import ConsentType, UserConsent


class UserConsentService:
    """Service for managing user consent records."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize consent service with database session.

        Args:
            session: The async database session.
        """
        self.session = session

    async def get_user_consents(self, user_id: uuid.UUID) -> list[UserConsent]:
        """Get all consent records for a user.

        Args:
            user_id: The user's unique identifier.

        Returns:
            List of user consent records.
        """
        result = await self.session.execute(
            select(UserConsent)
            .where(UserConsent.user_id == user_id)
            .order_by(UserConsent.consent_type)
        )
        return list(result.scalars().all())

    async def get_consent(
        self, user_id: uuid.UUID, consent_type: ConsentType
    ) -> UserConsent | None:
        """Get a specific consent record for a user.

        Args:
            user_id: The user's unique identifier.
            consent_type: The type of consent to retrieve.

        Returns:
            The consent record if found, None otherwise.
        """
        result = await self.session.execute(
            select(UserConsent).where(
                UserConsent.user_id == user_id,
                UserConsent.consent_type == consent_type,
            )
        )
        return result.scalar_one_or_none()

    async def has_consent(
        self, user_id: uuid.UUID, consent_type: ConsentType
    ) -> bool:
        """Check if a user has granted a specific consent.

        Args:
            user_id: The user's unique identifier.
            consent_type: The type of consent to check.

        Returns:
            True if consent is granted and not revoked, False otherwise.
        """
        consent = await self.get_consent(user_id, consent_type)
        if consent is None:
            return False
        return consent.granted and consent.revoked_at is None

    async def grant_consent(
        self,
        user_id: uuid.UUID,
        consent_type: ConsentType,
        version: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> UserConsent:
        """Grant or update a user consent.

        If consent already exists, updates it. Otherwise creates new record.

        Args:
            user_id: The user's unique identifier.
            consent_type: The type of consent being granted.
            version: The version of the policy being consented to.
            ip_address: Optional IP address of the request.
            user_agent: Optional user agent string.

        Returns:
            The created or updated consent record.
        """
        existing = await self.get_consent(user_id, consent_type)

        if existing:
            # Update existing consent
            existing.granted = True
            existing.version = version
            existing.granted_at = datetime.utcnow()
            existing.revoked_at = None
            existing.ip_address = ip_address
            existing.user_agent = user_agent
            existing.updated_at = datetime.utcnow()
            await self.session.commit()
            await self.session.refresh(existing)
            return existing

        # Create new consent
        consent = UserConsent(
            user_id=user_id,
            consent_type=consent_type,
            granted=True,
            version=version,
            granted_at=datetime.utcnow(),
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.session.add(consent)
        await self.session.commit()
        await self.session.refresh(consent)
        return consent

    async def revoke_consent(
        self, user_id: uuid.UUID, consent_type: ConsentType
    ) -> UserConsent | None:
        """Revoke a user's consent.

        Args:
            user_id: The user's unique identifier.
            consent_type: The type of consent to revoke.

        Returns:
            The updated consent record if found, None otherwise.
        """
        consent = await self.get_consent(user_id, consent_type)
        if consent is None:
            return None

        consent.granted = False
        consent.revoked_at = datetime.utcnow()
        consent.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(consent)
        return consent

    async def grant_registration_consents(
        self,
        user_id: uuid.UUID,
        terms_version: str,
        privacy_version: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[UserConsent, UserConsent]:
        """Grant terms and privacy consents during registration.

        Args:
            user_id: The user's unique identifier.
            terms_version: Version of terms of service accepted.
            privacy_version: Version of privacy policy accepted.
            ip_address: Optional IP address of the request.
            user_agent: Optional user agent string.

        Returns:
            Tuple of (terms_consent, privacy_consent) records.
        """
        terms_consent = await self.grant_consent(
            user_id=user_id,
            consent_type=ConsentType.TERMS_OF_SERVICE,
            version=terms_version,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        privacy_consent = await self.grant_consent(
            user_id=user_id,
            consent_type=ConsentType.PRIVACY_POLICY,
            version=privacy_version,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return terms_consent, privacy_consent
