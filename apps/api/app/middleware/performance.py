"""Performance monitoring middleware."""

import time
from collections.abc import Awaitable, Callable

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = structlog.get_logger()

# Paths to monitor with detailed timing
MONITORED_PATHS = {
    "/api/v1/coach/chat",
    "/api/v1/coach/chat/stream",
    "/api/v1/coach/plan",
    "/api/v1/coach/insights",
    "/api/v1/checkins",
    "/api/v1/nutrition",
}

# Threshold for slow request warning (milliseconds)
SLOW_REQUEST_THRESHOLD_MS = 500


class PerformanceMiddleware(BaseHTTPMiddleware):
    """Track request performance and log slow requests."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        """Process request and track performance.

        Args:
            request: The incoming request.
            call_next: The next middleware or endpoint.

        Returns:
            The response with timing headers.
        """
        start_time = time.perf_counter()

        response = await call_next(request)

        # Calculate duration
        duration_ms = (time.perf_counter() - start_time) * 1000

        # Add timing header
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"

        # Log performance for monitored paths
        path = request.url.path
        method = request.method

        if path in MONITORED_PATHS or duration_ms > SLOW_REQUEST_THRESHOLD_MS:
            log_data = {
                "path": path,
                "method": method,
                "duration_ms": round(duration_ms, 2),
                "status_code": response.status_code,
            }

            # Get request ID if available
            request_id = getattr(request.state, "request_id", None)
            if request_id:
                log_data["request_id"] = request_id

            if duration_ms > SLOW_REQUEST_THRESHOLD_MS:
                logger.warning("slow_request", **log_data)
            else:
                logger.info("request_completed", **log_data)

        return response
