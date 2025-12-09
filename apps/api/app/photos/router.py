"""Photo API endpoints."""

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import CurrentUser
from app.database import get_session
from app.storage.s3_client import S3Service, get_s3_service

from .schemas import (
    PhotoCommitRequest,
    PhotoListResponse,
    PhotoResponse,
    PresignRequest,
    PresignResponse,
)
from .service import PhotoService

router = APIRouter(prefix="/photos", tags=["Photos"])


@router.post("/presign", response_model=PresignResponse)
async def create_presign(
    data: PresignRequest,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    s3: Annotated[S3Service, Depends(get_s3_service)],
) -> PresignResponse:
    """Generate presigned URL for photo upload.

    Returns a URL valid for 5 minutes to upload a photo directly to S3.
    """
    service = PhotoService(session, s3)
    photo_id, upload_url, s3_key, expires_in = await service.create_presign(
        current_user.id,
        data.filename,
        data.content_type,
    )
    return PresignResponse(
        photo_id=photo_id,
        upload_url=upload_url,
        s3_key=s3_key,
        expires_in=expires_in,
    )


@router.post("/commit", response_model=PhotoResponse, status_code=201)
async def commit_photo(
    data: PhotoCommitRequest,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    s3: Annotated[S3Service, Depends(get_s3_service)],
) -> PhotoResponse:
    """Commit uploaded photo to database.

    Call this after successfully uploading the photo to the presigned URL.
    Verifies the upload completed before storing metadata.
    """
    service = PhotoService(session, s3)
    photo = await service.commit_photo(
        current_user.id,
        data.photo_id,
        data.s3_key,
        data.date,
        data.visibility,
        data.metadata,
    )
    download_url = await service.get_download_url(photo)
    return PhotoResponse(
        id=photo.id,
        date=photo.date,
        visibility=photo.visibility,
        download_url=download_url,
        metadata=photo.photo_metadata,
        created_at=photo.created_at,
    )


@router.get("", response_model=PhotoListResponse)
async def list_photos(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    s3: Annotated[S3Service, Depends(get_s3_service)],
    from_date: Annotated[date | None, Query(alias="from")] = None,
    to_date: Annotated[date | None, Query(alias="to")] = None,
) -> PhotoListResponse:
    """List photos within date range.

    Returns metadata and presigned download URLs for each photo.
    """
    service = PhotoService(session, s3)
    photos, total = await service.get_by_date_range(
        current_user.id,
        from_date=from_date,
        to_date=to_date,
    )

    items = []
    for photo in photos:
        download_url = await service.get_download_url(photo)
        items.append(
            PhotoResponse(
                id=photo.id,
                date=photo.date,
                visibility=photo.visibility,
                download_url=download_url,
                metadata=photo.photo_metadata,
                created_at=photo.created_at,
            )
        )

    return PhotoListResponse(items=items, total=total)


@router.get("/{photo_id}", response_model=PhotoResponse)
async def get_photo(
    photo_id: UUID,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    s3: Annotated[S3Service, Depends(get_s3_service)],
) -> PhotoResponse:
    """Get single photo metadata with download URL."""
    service = PhotoService(session, s3)
    photo = await service.get_by_id(current_user.id, photo_id)
    download_url = await service.get_download_url(photo)
    return PhotoResponse(
        id=photo.id,
        date=photo.date,
        visibility=photo.visibility,
        download_url=download_url,
        metadata=photo.photo_metadata,
        created_at=photo.created_at,
    )


@router.delete("/{photo_id}")
async def delete_photo(
    photo_id: UUID,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    s3: Annotated[S3Service, Depends(get_s3_service)],
) -> dict[str, str]:
    """Delete photo from storage and database."""
    service = PhotoService(session, s3)
    await service.delete(current_user.id, photo_id)
    return {"message": "Photo deleted successfully"}
