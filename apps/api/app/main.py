"""FastAPI application entry point."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.auth.router import router as auth_router
from app.checkins.router import router as checkins_router
from app.coach_ai.router import router as coach_router
from app.config import get_settings
from app.database import close_db, init_db
from app.integrations.router import router as integrations_router
from app.middleware import RequestIDMiddleware, SecurityHeadersMiddleware, limiter
from app.nutrition.router import router as nutrition_router
from app.photos.router import router as photos_router
from app.users.router import router as users_router

settings = get_settings()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Handle application startup and shutdown."""
    # Startup
    logger.info("Starting application", app_name=settings.app_name, env=settings.app_env)
    await init_db()
    yield
    # Shutdown
    logger.info("Shutting down application")
    await close_db()


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        description="Sleek Coach - AI-Powered Fitness Coaching API",
        version="0.1.0",
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        openapi_url="/openapi.json" if settings.is_development else None,
        lifespan=lifespan,
    )

    # Rate limiter state and exception handler
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

    # Security middleware (order matters - first added = last executed)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestIDMiddleware)

    # CORS middleware with explicit methods and headers for security
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID", "Accept"],
    )

    # Include API routers
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    app.include_router(auth_router, prefix=settings.api_v1_prefix)
    app.include_router(users_router, prefix=settings.api_v1_prefix)
    app.include_router(checkins_router, prefix=settings.api_v1_prefix)
    app.include_router(photos_router, prefix=settings.api_v1_prefix)
    app.include_router(nutrition_router, prefix=settings.api_v1_prefix)
    app.include_router(integrations_router, prefix=settings.api_v1_prefix)
    app.include_router(coach_router, prefix=settings.api_v1_prefix)

    return app


app = create_application()


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint for load balancers and monitoring."""
    return {"status": "healthy"}
