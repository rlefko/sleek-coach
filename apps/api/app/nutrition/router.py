"""Nutrition API endpoints."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import CurrentUser
from app.database import get_session

from .calculator import calculate_bmr, calculate_macro_targets, calculate_tdee
from .schemas import (
    MacroTargetsRequest,
    MacroTargetsResponse,
    NutritionAggregateResponse,
    NutritionDayCreate,
    NutritionDayResponse,
    NutritionListResponse,
)
from .service import NutritionService

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])


@router.post("/day", response_model=NutritionDayResponse, status_code=201)
async def create_nutrition_day(
    data: NutritionDayCreate,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> NutritionDayResponse:
    """Create or update nutrition for a day.

    If nutrition already exists for the given date, it will be updated.
    """
    service = NutritionService(session)
    nutrition = await service.create_or_update(current_user.id, data)
    return NutritionDayResponse.model_validate(nutrition, from_attributes=True)


@router.get("/day", response_model=NutritionDayResponse | None)
async def get_nutrition_day(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    target_date: Annotated[date, Query(alias="date")],
) -> NutritionDayResponse | None:
    """Get nutrition for a specific date.

    Returns null if no nutrition is logged for that date.
    """
    service = NutritionService(session)
    nutrition = await service.get_by_date(current_user.id, target_date)
    if nutrition:
        return NutritionDayResponse.model_validate(nutrition, from_attributes=True)
    return None


@router.get("/range")
async def get_nutrition_range(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    from_date: Annotated[date, Query(alias="from")],
    to_date: Annotated[date, Query(alias="to")],
    aggregate: bool = Query(False, description="Return aggregated stats instead of daily data"),
) -> NutritionListResponse | NutritionAggregateResponse:
    """Get nutrition data for a date range.

    Use aggregate=true to get summary statistics instead of individual days.
    """
    # Validate date range
    if from_date > to_date:
        raise HTTPException(
            status_code=400,
            detail="from_date must be before or equal to to_date",
        )

    service = NutritionService(session)

    if aggregate:
        stats = await service.get_aggregated_stats(current_user.id, from_date, to_date)
        return NutritionAggregateResponse(
            from_date=from_date,
            to_date=to_date,
            total_days=int(stats["total_days"]) if stats["total_days"] else 0,
            logged_days=int(stats["logged_days"]) if stats["logged_days"] else 0,
            avg_calories=float(stats["avg_calories"]) if stats["avg_calories"] else None,
            avg_protein_g=float(stats["avg_protein_g"]) if stats["avg_protein_g"] else None,
            avg_carbs_g=float(stats["avg_carbs_g"]) if stats["avg_carbs_g"] else None,
            avg_fat_g=float(stats["avg_fat_g"]) if stats["avg_fat_g"] else None,
            avg_fiber_g=float(stats["avg_fiber_g"]) if stats["avg_fiber_g"] else None,
            total_calories=int(stats["total_calories"]) if stats["total_calories"] else None,
        )
    else:
        items = await service.get_by_date_range(current_user.id, from_date, to_date)
        return NutritionListResponse(
            items=[NutritionDayResponse.model_validate(n, from_attributes=True) for n in items],
            total=len(items),
            from_date=from_date,
            to_date=to_date,
        )


@router.delete("/day", status_code=204)
async def delete_nutrition_day(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    target_date: Annotated[date, Query(alias="date")],
) -> None:
    """Delete nutrition for a specific date."""
    service = NutritionService(session)
    deleted = await service.delete_by_date(current_user.id, target_date)
    if not deleted:
        raise HTTPException(status_code=404, detail="Nutrition entry not found")


@router.post("/calculate-targets", response_model=MacroTargetsResponse)
async def calculate_targets(
    data: MacroTargetsRequest,
    current_user: CurrentUser,  # noqa: ARG001
) -> MacroTargetsResponse:
    """Calculate TDEE and macro targets.

    Uses the Mifflin-St Jeor formula for BMR calculation and applies
    activity level multipliers to determine TDEE. Macro targets are
    calculated based on the specified goal type and pace preference.
    """
    bmr = calculate_bmr(
        weight_kg=data.weight_kg,
        height_cm=data.height_cm,
        age=data.age,
        sex=data.sex,
    )
    tdee = calculate_tdee(bmr, data.activity_level)
    targets = calculate_macro_targets(
        tdee=tdee,
        weight_kg=data.weight_kg,
        goal_type=data.goal_type,
        pace=data.pace,
        sex=data.sex,
    )

    return MacroTargetsResponse(
        tdee=targets.tdee,
        bmr=int(bmr),
        target_calories=targets.target_calories,
        protein_g=targets.protein_g,
        carbs_g=targets.carbs_g,
        fat_g=targets.fat_g,
        deficit_surplus=targets.deficit_surplus,
        warnings=targets.warnings,
    )
