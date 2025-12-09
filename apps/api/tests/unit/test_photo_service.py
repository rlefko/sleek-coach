"""Unit tests for PhotoService and S3Client."""

import uuid
from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundError, ValidationError
from app.photos.models import PhotoVisibility, ProgressPhoto
from app.photos.service import PhotoService
from app.storage.s3_client import S3Service


@pytest.fixture
def user_id() -> uuid.UUID:
    """Generate a test user ID."""
    return uuid.uuid4()


@pytest.fixture
def mock_s3() -> MagicMock:
    """Create a mock S3 service."""
    s3 = MagicMock(spec=S3Service)
    s3.generate_s3_key = MagicMock(return_value="photos/user123/photo456.jpg")
    s3.generate_presigned_upload_url = AsyncMock(return_value="https://s3.example.com/upload")
    s3.generate_presigned_download_url = AsyncMock(return_value="https://s3.example.com/download")
    s3.check_object_exists = AsyncMock(return_value=True)
    s3.get_object_metadata = AsyncMock(
        return_value={
            "content_type": "image/jpeg",
            "size": 12345,
            "etag": "abc123",
        }
    )
    s3.delete_object = AsyncMock()
    return s3


@pytest.fixture
def service(db_session: AsyncSession, mock_s3: MagicMock) -> PhotoService:
    """Create a PhotoService instance with mocked S3."""
    return PhotoService(db_session, mock_s3)


class TestPhotoService:
    """Tests for PhotoService."""

    @pytest.mark.asyncio
    async def test_create_presign(
        self,
        service: PhotoService,
        user_id: uuid.UUID,
        mock_s3: MagicMock,
    ) -> None:
        """Test creating a presigned upload URL."""
        photo_id, upload_url, s3_key, expires_in = await service.create_presign(
            user_id,
            "test.jpg",
            "image/jpeg",
        )

        assert photo_id is not None
        assert upload_url == "https://s3.example.com/upload"
        assert s3_key == "photos/user123/photo456.jpg"
        assert expires_in == 300
        mock_s3.generate_presigned_upload_url.assert_called_once()

    @pytest.mark.asyncio
    async def test_commit_photo(
        self,
        service: PhotoService,
        user_id: uuid.UUID,
    ) -> None:
        """Test committing an uploaded photo."""
        photo_id = uuid.uuid4()
        s3_key = f"photos/{user_id}/{photo_id}.jpg"

        photo = await service.commit_photo(
            user_id=user_id,
            photo_id=photo_id,
            s3_key=s3_key,
            photo_date=date.today(),
            visibility=PhotoVisibility.PRIVATE,
            metadata={"camera": "iPhone 15"},
        )

        assert photo.id == photo_id
        assert photo.user_id == user_id
        assert photo.s3_key == s3_key
        assert photo.date == date.today()
        assert photo.visibility == PhotoVisibility.PRIVATE
        assert photo.content_hash == "abc123"
        assert photo.photo_metadata is not None
        assert photo.photo_metadata.get("camera") == "iPhone 15"

    @pytest.mark.asyncio
    async def test_commit_photo_not_uploaded(
        self,
        service: PhotoService,
        user_id: uuid.UUID,
        mock_s3: MagicMock,
    ) -> None:
        """Test committing a photo that wasn't uploaded fails."""
        mock_s3.check_object_exists.return_value = False

        with pytest.raises(ValidationError) as exc_info:
            await service.commit_photo(
                user_id=user_id,
                photo_id=uuid.uuid4(),
                s3_key="invalid/key.jpg",
                photo_date=date.today(),
            )

        assert "not found" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_get_by_id(
        self,
        service: PhotoService,
        user_id: uuid.UUID,
        db_session: AsyncSession,
    ) -> None:
        """Test retrieving a photo by ID."""
        # Create a photo directly
        photo = ProgressPhoto(
            user_id=user_id,
            date=date.today(),
            s3_key="photos/test.jpg",
        )
        db_session.add(photo)
        await db_session.commit()
        await db_session.refresh(photo)

        result = await service.get_by_id(user_id, photo.id)

        assert result.id == photo.id
        assert result.s3_key == "photos/test.jpg"

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(
        self,
        service: PhotoService,
        user_id: uuid.UUID,
    ) -> None:
        """Test retrieving a non-existent photo raises NotFoundError."""
        with pytest.raises(NotFoundError):
            await service.get_by_id(user_id, uuid.uuid4())

    @pytest.mark.asyncio
    async def test_get_by_id_wrong_user(
        self,
        service: PhotoService,
        user_id: uuid.UUID,
        db_session: AsyncSession,
    ) -> None:
        """Test that users can't access other users' photos."""
        # Create a photo for a different user
        other_user_id = uuid.uuid4()
        photo = ProgressPhoto(
            user_id=other_user_id,
            date=date.today(),
            s3_key="photos/test.jpg",
        )
        db_session.add(photo)
        await db_session.commit()
        await db_session.refresh(photo)

        # Try to get it as a different user
        with pytest.raises(NotFoundError):
            await service.get_by_id(user_id, photo.id)

    @pytest.mark.asyncio
    async def test_get_by_date_range(
        self,
        service: PhotoService,
        user_id: uuid.UUID,
        db_session: AsyncSession,
    ) -> None:
        """Test retrieving photos within a date range."""
        today = date.today()
        # Create photos for different dates
        from datetime import timedelta

        for i in range(5):
            photo = ProgressPhoto(
                user_id=user_id,
                date=today - timedelta(days=i),
                s3_key=f"photos/test{i}.jpg",
            )
            db_session.add(photo)
        await db_session.commit()

        photos, total = await service.get_by_date_range(
            user_id,
            from_date=today - timedelta(days=10),
            to_date=today,
        )

        assert total == 5
        assert len(photos) == 5
        # Should be ordered by date descending
        assert photos[0].date == today

    @pytest.mark.asyncio
    async def test_delete(
        self,
        service: PhotoService,
        user_id: uuid.UUID,
        db_session: AsyncSession,
        mock_s3: MagicMock,
    ) -> None:
        """Test deleting a photo."""
        # Create a photo
        photo = ProgressPhoto(
            user_id=user_id,
            date=date.today(),
            s3_key="photos/to_delete.jpg",
        )
        db_session.add(photo)
        await db_session.commit()
        await db_session.refresh(photo)
        photo_id = photo.id

        # Delete it
        await service.delete(user_id, photo_id)

        # Verify S3 was called
        mock_s3.delete_object.assert_called_once_with("photos/to_delete.jpg")

        # Verify it's gone from the database
        with pytest.raises(NotFoundError):
            await service.get_by_id(user_id, photo_id)

    @pytest.mark.asyncio
    async def test_get_download_url(
        self,
        service: PhotoService,
        user_id: uuid.UUID,
        db_session: AsyncSession,
        mock_s3: MagicMock,
    ) -> None:
        """Test generating a download URL."""
        photo = ProgressPhoto(
            user_id=user_id,
            date=date.today(),
            s3_key="photos/download.jpg",
        )
        db_session.add(photo)
        await db_session.commit()
        await db_session.refresh(photo)

        url = await service.get_download_url(photo)

        assert url == "https://s3.example.com/download"
        mock_s3.generate_presigned_download_url.assert_called_once_with("photos/download.jpg")


class TestS3Service:
    """Tests for S3Service."""

    def test_generate_s3_key(self) -> None:
        """Test S3 key generation."""
        s3 = S3Service()

        user_id = uuid.UUID("12345678-1234-5678-1234-567812345678")
        photo_id = uuid.UUID("87654321-4321-8765-4321-876543218765")

        key = s3.generate_s3_key(user_id, photo_id, "vacation.jpg")

        assert key.startswith("photos/")
        assert str(user_id) in key
        assert str(photo_id) in key
        assert key.endswith(".jpg")

    def test_generate_s3_key_preserves_extension(self) -> None:
        """Test S3 key preserves file extension."""
        s3 = S3Service()

        user_id = uuid.uuid4()
        photo_id = uuid.uuid4()

        key_jpg = s3.generate_s3_key(user_id, photo_id, "photo.JPG")
        key_png = s3.generate_s3_key(user_id, photo_id, "photo.png")
        key_heic = s3.generate_s3_key(user_id, photo_id, "photo.HEIC")

        assert key_jpg.endswith(".jpg")
        assert key_png.endswith(".png")
        assert key_heic.endswith(".heic")

    def test_generate_s3_key_handles_no_extension(self) -> None:
        """Test S3 key handles files without extension."""
        s3 = S3Service()

        user_id = uuid.uuid4()
        photo_id = uuid.uuid4()

        key = s3.generate_s3_key(user_id, photo_id, "photo_no_ext")

        # Should default to jpg extension
        assert key.endswith(".jpg")

    def test_compute_content_hash(self) -> None:
        """Test content hash computation."""
        content = b"test content"
        hash1 = S3Service.compute_content_hash(content)

        # Should be a SHA-256 hash (64 hex characters)
        assert len(hash1) == 64
        assert all(c in "0123456789abcdef" for c in hash1)

        # Same content should produce same hash
        hash2 = S3Service.compute_content_hash(content)
        assert hash1 == hash2

        # Different content should produce different hash
        hash3 = S3Service.compute_content_hash(b"different content")
        assert hash1 != hash3
