"""API router for AI Coach endpoints."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import CurrentUser
from app.coach_ai.schemas import (
    ChatRequest,
    ChatResponse,
    InsightsResponse,
    StreamEvent,
    WeeklyPlanRequest,
    WeeklyPlanResponse,
)
from app.coach_ai.service import CoachService
from app.database import get_session
from app.dependencies import RedisClient

router = APIRouter(prefix="/coach", tags=["Coach"])
logger = structlog.get_logger()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    redis_client: RedisClient,
) -> ChatResponse:
    """Send a message to the AI coach and receive a response.

    The coach will use available tools to gather context about your
    progress and provide personalized advice.

    Args:
        request: Chat request with message and optional session ID.
        current_user: The authenticated user.
        session: Database session.
        redis_client: Redis client for caching.

    Returns:
        ChatResponse with the coach's response and metadata.

    Raises:
        HTTPException: If chat processing fails.
    """
    service = CoachService(session, redis_client=redis_client)

    try:
        response = await service.chat(
            user_id=current_user.id,
            message=request.message,
            session_id=request.session_id,
        )
        return response
    except Exception as e:
        logger.exception("coach_chat_error", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request. Please try again.",
        ) from e


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    redis_client: RedisClient,
) -> StreamingResponse:
    """Stream a chat response from the AI coach using Server-Sent Events.

    Events:
    - token: Partial text content
    - tool_start: Tool execution started
    - tool_end: Tool execution completed
    - done: Stream completed
    - error: Error occurred

    Args:
        request: Chat request with message and optional session ID.
        current_user: The authenticated user.
        session: Database session.
        redis_client: Redis client for caching.

    Returns:
        StreamingResponse with SSE events.
    """
    service = CoachService(session, redis_client=redis_client)

    async def event_generator() -> AsyncIterator[str]:
        try:
            async for event in service.chat_stream(
                user_id=current_user.id,
                message=request.message,
                session_id=request.session_id,
            ):
                yield f"data: {event.model_dump_json()}\n\n"

            # Send done event
            done_event = StreamEvent(type="done", data={"status": "complete"})
            yield f"data: {done_event.model_dump_json()}\n\n"

        except Exception as e:
            logger.exception("coach_stream_error", user_id=str(current_user.id), error=str(e))
            error_event = StreamEvent(type="error", data=str(e))
            yield f"data: {error_event.model_dump_json()}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/plan", response_model=WeeklyPlanResponse)
async def generate_plan(
    request: WeeklyPlanRequest,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    redis_client: RedisClient,
) -> WeeklyPlanResponse:
    """Generate a personalized weekly plan based on your goals and progress.

    The plan includes daily calorie/macro targets, focus areas, and
    actionable recommendations.

    Args:
        request: Plan request with optional start date and preferences.
        current_user: The authenticated user.
        session: Database session.
        redis_client: Redis client for caching.

    Returns:
        WeeklyPlanResponse with the generated plan.

    Raises:
        HTTPException: If plan generation fails.
    """
    service = CoachService(session, redis_client=redis_client)

    try:
        plan = await service.generate_weekly_plan(
            user_id=current_user.id,
            start_date=request.start_date,
            preferences=request.preferences,
        )
        return plan
    except Exception as e:
        logger.exception("coach_plan_error", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate weekly plan. Please try again.",
        ) from e


@router.get("/insights", response_model=InsightsResponse)
async def get_insights(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    redis_client: RedisClient,
) -> InsightsResponse:
    """Get pre-computed weekly insights about your progress.

    Insights include trend analysis, achievements, recommendations,
    and any warnings based on your data.

    Args:
        current_user: The authenticated user.
        session: Database session.
        redis_client: Redis client for caching.

    Returns:
        InsightsResponse with generated insights.

    Raises:
        HTTPException: If insight retrieval fails.
    """
    service = CoachService(session, redis_client=redis_client)

    try:
        insights = await service.get_insights(user_id=current_user.id)
        return insights
    except Exception as e:
        logger.exception("coach_insights_error", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve insights. Please try again.",
        ) from e
