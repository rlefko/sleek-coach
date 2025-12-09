"""API v1 router aggregation."""

from fastapi import APIRouter

api_router = APIRouter()


@api_router.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    """API root endpoint."""
    return {"message": "Welcome to Sleek Coach API v1"}
