"""Integrations API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import CurrentUser
from app.database import get_session
from app.nutrition.schemas import MFPImportResponse
from app.nutrition.service import NutritionService

router = APIRouter(prefix="/integrations", tags=["Integrations"])

# Maximum file size for MFP import (50MB)
MAX_FILE_SIZE = 50 * 1024 * 1024


@router.post("/mfp/import", response_model=MFPImportResponse)
async def import_mfp_csv(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    file: UploadFile = File(..., description="MFP export ZIP file"),
    overwrite: bool = Query(False, description="Overwrite existing entries"),
) -> MFPImportResponse:
    """Import nutrition data from MyFitnessPal CSV export ZIP.

    The ZIP file should contain a Nutrition.csv file exported from MyFitnessPal.
    Supported date formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD.

    If overwrite is false (default), existing entries will be skipped.
    If overwrite is true, existing entries will be replaced with imported data.
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="File must be a ZIP archive")

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large (max {MAX_FILE_SIZE // (1024 * 1024)}MB)",
        )

    # Validate file is not empty
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    service = NutritionService(session)
    result = await service.import_mfp_data(
        user_id=current_user.id,
        zip_content=content,
        overwrite_existing=overwrite,
    )

    # Check if import had critical errors (no rows processed)
    if result.total_rows == 0 and result.errors:
        raise HTTPException(
            status_code=400,
            detail=f"Import failed: {result.errors[0]}",
        )

    return result
