"""Check-in API endpoints."""

from datetime import date
from typing import Annotated, cast

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import CurrentUser
from app.database import get_session

from .schemas import (
    CheckInCreate,
    CheckInListResponse,
    CheckInResponse,
    CheckInSyncRequest,
    CheckInSyncResponse,
    CheckInSyncResult,
    WeightTrendResponse,
)
from .service import CheckInService

router = APIRouter(prefix="/checkins", tags=["Check-ins"])


@router.post("", response_model=CheckInResponse, status_code=201)
async def create_checkin(
    data: CheckInCreate,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CheckInResponse:
    """Create or update a check-in.

    If a check-in already exists for the given date, it will be updated.
    """
    service = CheckInService(session)
    checkin = await service.create_or_update(current_user.id, data)
    return CheckInResponse.model_validate(checkin, from_attributes=True)


@router.get("", response_model=CheckInListResponse)
async def list_checkins(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    from_date: Annotated[date | None, Query(alias="from")] = None,
    to_date: Annotated[date | None, Query(alias="to")] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> CheckInListResponse:
    """List check-ins within date range.

    Defaults to the last 30 days if no dates specified.
    """
    service = CheckInService(session)
    items, total = await service.get_by_date_range(
        current_user.id,
        from_date=from_date,
        to_date=to_date,
        limit=limit,
        offset=offset,
    )
    return CheckInListResponse(
        items=[CheckInResponse.model_validate(c, from_attributes=True) for c in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/latest", response_model=CheckInResponse | None)
async def get_latest_checkin(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CheckInResponse | None:
    """Get the most recent check-in."""
    service = CheckInService(session)
    checkin = await service.get_latest(current_user.id)
    if checkin:
        return CheckInResponse.model_validate(checkin, from_attributes=True)
    return None


@router.get("/trends", response_model=WeightTrendResponse)
async def get_weight_trends(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    days: int = Query(30, ge=7, le=365),
) -> WeightTrendResponse:
    """Get weight trend analysis with 7-day moving average."""
    service = CheckInService(session)
    return await service.calculate_weight_trend(current_user.id, days)


@router.post("/sync", response_model=CheckInSyncResponse)
async def sync_checkins(
    data: CheckInSyncRequest,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CheckInSyncResponse:
    """Sync batch of check-ins for offline support.

    Uses last-write-wins conflict resolution with server timestamp comparison.
    """
    service = CheckInService(session)
    results = await service.sync_checkins(current_user.id, data.checkins)

    sync_results = [
        CheckInSyncResult(
            date=cast("date", r["date"]),
            status=cast("str", r["status"]),
            server_version=CheckInResponse.model_validate(
                r["server_version"], from_attributes=True
            )
            if r["server_version"]
            else None,
        )
        for r in results
    ]

    return CheckInSyncResponse(
        results=sync_results,
        conflicts=sum(1 for r in sync_results if r.status == "conflict"),
    )
