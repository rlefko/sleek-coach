"""Photo request/response schemas."""

import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field

from .models import PhotoVisibility


class PresignRequest(BaseModel):
    """Request presigned upload URL."""

    filename: str = Field(..., min_length=1, max_length=255)
    content_type: str = Field(..., pattern=r"^image/(jpeg|png|heic|webp)$")


class PhotoCommitRequest(BaseModel):
    """Commit uploaded photo."""

    photo_id: uuid.UUID
    s3_key: str
    date: date
    visibility: PhotoVisibility = PhotoVisibility.PRIVATE
    metadata: dict[str, Any] | None = None


class PresignResponse(BaseModel):
    """Presigned URL response."""

    photo_id: uuid.UUID
    upload_url: str
    s3_key: str
    expires_in: int


class PhotoResponse(BaseModel):
    """Photo metadata response."""

    id: uuid.UUID
    date: date
    visibility: PhotoVisibility
    download_url: str
    metadata: dict[str, Any] | None
    created_at: datetime


class PhotoListResponse(BaseModel):
    """List of photos response."""

    items: list[PhotoResponse]
    total: int
