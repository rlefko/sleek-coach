"""S3/MinIO client wrapper service."""

import hashlib
import uuid
from datetime import datetime
from typing import Any

import aioboto3  # type: ignore[import-untyped]
from botocore.config import Config  # type: ignore[import-untyped]

from app.config import get_settings


class S3Service:
    """S3 client wrapper for photo storage."""

    def __init__(self) -> None:
        """Initialize S3 service."""
        self.settings = get_settings()
        self.session = aioboto3.Session()
        self.config = Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
        )

    def _get_client_kwargs(self) -> dict[str, Any]:
        """Get S3 client configuration."""
        kwargs: dict[str, Any] = {
            "service_name": "s3",
            "aws_access_key_id": self.settings.aws_access_key_id,
            "aws_secret_access_key": self.settings.aws_secret_access_key,
            "region_name": self.settings.aws_region,
            "config": self.config,
        }
        if self.settings.s3_endpoint_url:
            kwargs["endpoint_url"] = str(self.settings.s3_endpoint_url)
        return kwargs

    def generate_s3_key(
        self,
        user_id: uuid.UUID,
        photo_id: uuid.UUID,
        filename: str,
    ) -> str:
        """Generate S3 key with user prefix.

        Args:
            user_id: The user's unique identifier.
            photo_id: The photo's unique identifier.
            filename: Original filename for extension.

        Returns:
            S3 key path.
        """
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        return f"photos/{user_id}/{timestamp}/{photo_id}.{ext}"

    async def generate_presigned_upload_url(
        self,
        s3_key: str,
        content_type: str,
        expires_in: int = 300,
    ) -> str:
        """Generate presigned URL for upload.

        Args:
            s3_key: S3 key path.
            content_type: MIME type of the file.
            expires_in: URL expiry in seconds (default 5 minutes).

        Returns:
            Presigned upload URL.
        """
        async with self.session.client(**self._get_client_kwargs()) as s3:
            url: str = await s3.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": self.settings.s3_bucket_name,
                    "Key": s3_key,
                    "ContentType": content_type,
                },
                ExpiresIn=expires_in,
            )
            return url

    async def generate_presigned_download_url(
        self,
        s3_key: str,
        expires_in: int = 900,
    ) -> str:
        """Generate presigned URL for download.

        Args:
            s3_key: S3 key path.
            expires_in: URL expiry in seconds (default 15 minutes).

        Returns:
            Presigned download URL.
        """
        async with self.session.client(**self._get_client_kwargs()) as s3:
            url: str = await s3.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self.settings.s3_bucket_name,
                    "Key": s3_key,
                },
                ExpiresIn=expires_in,
            )
            return url

    async def check_object_exists(self, s3_key: str) -> bool:
        """Check if object exists in S3.

        Args:
            s3_key: S3 key path.

        Returns:
            True if object exists, False otherwise.
        """
        async with self.session.client(**self._get_client_kwargs()) as s3:
            try:
                await s3.head_object(
                    Bucket=self.settings.s3_bucket_name,
                    Key=s3_key,
                )
                return True
            except Exception:
                return False

    async def get_object_metadata(self, s3_key: str) -> dict[str, Any] | None:
        """Get object metadata from S3.

        Args:
            s3_key: S3 key path.

        Returns:
            Object metadata dict or None if not found.
        """
        async with self.session.client(**self._get_client_kwargs()) as s3:
            try:
                response = await s3.head_object(
                    Bucket=self.settings.s3_bucket_name,
                    Key=s3_key,
                )
                return {
                    "content_type": response.get("ContentType"),
                    "content_length": response.get("ContentLength"),
                    "etag": response.get("ETag", "").strip('"'),
                }
            except Exception:
                return None

    async def delete_object(self, s3_key: str) -> bool:
        """Delete object from S3.

        Args:
            s3_key: S3 key path.

        Returns:
            True if deleted, False otherwise.
        """
        async with self.session.client(**self._get_client_kwargs()) as s3:
            try:
                await s3.delete_object(
                    Bucket=self.settings.s3_bucket_name,
                    Key=s3_key,
                )
                return True
            except Exception:
                return False

    @staticmethod
    def compute_content_hash(content: bytes) -> str:
        """Compute SHA-256 hash of content.

        Args:
            content: File content bytes.

        Returns:
            Hex-encoded hash.
        """
        return hashlib.sha256(content).hexdigest()


_s3_service: S3Service | None = None


def get_s3_service() -> S3Service:
    """Get S3 service singleton instance."""
    global _s3_service
    if _s3_service is None:
        _s3_service = S3Service()
    return _s3_service
