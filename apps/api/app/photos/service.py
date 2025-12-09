"""Photo business logic service."""

import uuid
from datetime import date
from typing import Any

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.exceptions import NotFoundError, ValidationError
from app.storage.s3_client import S3Service

from .models import PhotoVisibility, ProgressPhoto


class PhotoService:
    """Photo service."""

    def __init__(self, session: AsyncSession, s3: S3Service) -> None:
        """Initialize photo service.

        Args:
            session: The async database session.
            s3: The S3 service instance.
        """
        self.session = session
        self.s3 = s3

    async def create_presign(
        self,
        user_id: uuid.UUID,
        filename: str,
        content_type: str,
    ) -> tuple[uuid.UUID, str, str, int]:
        """Create presigned upload URL.

        Args:
            user_id: The user's unique identifier.
            filename: Original filename.
            content_type: MIME type of the file.

        Returns:
            Tuple of (photo_id, upload_url, s3_key, expires_in).
        """
        photo_id = uuid.uuid4()
        s3_key = self.s3.generate_s3_key(user_id, photo_id, filename)
        expires_in = 300

        upload_url = await self.s3.generate_presigned_upload_url(
            s3_key,
            content_type,
            expires_in,
        )

        return photo_id, upload_url, s3_key, expires_in

    async def commit_photo(
        self,
        user_id: uuid.UUID,
        photo_id: uuid.UUID,
        s3_key: str,
        photo_date: date,
        visibility: PhotoVisibility = PhotoVisibility.PRIVATE,
        metadata: dict[str, Any] | None = None,
    ) -> ProgressPhoto:
        """Commit uploaded photo to database.

        Args:
            user_id: The user's unique identifier.
            photo_id: The photo's unique identifier.
            s3_key: S3 key path.
            photo_date: Date of the photo.
            visibility: Photo visibility setting.
            metadata: Optional photo metadata.

        Returns:
            The created photo record.

        Raises:
            ValidationError: If photo upload not found.
        """
        if not await self.s3.check_object_exists(s3_key):
            raise ValidationError("Photo upload not found. Please upload the file first.")

        s3_metadata = await self.s3.get_object_metadata(s3_key)

        combined_metadata = metadata or {}
        if s3_metadata:
            combined_metadata.update(s3_metadata)

        photo = ProgressPhoto(
            id=photo_id,
            user_id=user_id,
            date=photo_date,
            s3_key=s3_key,
            content_hash=s3_metadata.get("etag") if s3_metadata else None,
            visibility=visibility,
            photo_metadata=combined_metadata if combined_metadata else None,
        )

        self.session.add(photo)
        await self.session.commit()
        await self.session.refresh(photo)

        return photo

    async def get_by_id(
        self,
        user_id: uuid.UUID,
        photo_id: uuid.UUID,
    ) -> ProgressPhoto:
        """Get photo by ID.

        Args:
            user_id: The user's unique identifier.
            photo_id: The photo's unique identifier.

        Returns:
            The photo record.

        Raises:
            NotFoundError: If photo not found.
        """
        result = await self.session.execute(
            select(ProgressPhoto).where(
                ProgressPhoto.id == photo_id,
                ProgressPhoto.user_id == user_id,
            )
        )
        photo = result.scalar_one_or_none()
        if not photo:
            raise NotFoundError("Photo", photo_id)
        return photo

    async def get_by_date_range(
        self,
        user_id: uuid.UUID,
        from_date: date | None = None,
        to_date: date | None = None,
    ) -> tuple[list[ProgressPhoto], int]:
        """Get photos within date range.

        Args:
            user_id: The user's unique identifier.
            from_date: Start date filter.
            to_date: End date filter.

        Returns:
            Tuple of (list of photos, total count).
        """
        query = select(ProgressPhoto).where(ProgressPhoto.user_id == user_id)
        count_query = (
            select(func.count())
            .select_from(ProgressPhoto)
            .where(ProgressPhoto.user_id == user_id)
        )

        if from_date:
            query = query.where(ProgressPhoto.date >= from_date)
            count_query = count_query.where(ProgressPhoto.date >= from_date)
        if to_date:
            query = query.where(ProgressPhoto.date <= to_date)
            count_query = count_query.where(ProgressPhoto.date <= to_date)

        query = query.order_by(ProgressPhoto.date.desc())  # type: ignore[attr-defined]

        total_result = await self.session.execute(count_query)
        total_count = total_result.scalar() or 0

        result = await self.session.execute(query)
        photos = list(result.scalars().all())

        return photos, total_count

    async def delete(
        self,
        user_id: uuid.UUID,
        photo_id: uuid.UUID,
    ) -> None:
        """Delete photo from database and S3.

        Args:
            user_id: The user's unique identifier.
            photo_id: The photo's unique identifier.

        Raises:
            NotFoundError: If photo not found.
        """
        photo = await self.get_by_id(user_id, photo_id)

        await self.s3.delete_object(photo.s3_key)

        await self.session.delete(photo)
        await self.session.commit()

    async def get_download_url(self, photo: ProgressPhoto) -> str:
        """Get presigned download URL for photo.

        Args:
            photo: The photo record.

        Returns:
            Presigned download URL.
        """
        return await self.s3.generate_presigned_download_url(photo.s3_key)
