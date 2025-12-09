"""Rate limiting middleware using slowapi."""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings

settings = get_settings()

# Global rate limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_requests}/{settings.rate_limit_period}seconds"],
)

# Specific rate limit for auth endpoints (more restrictive)
# 5 requests per 15 minutes for login attempts
AUTH_RATE_LIMIT = "5/15minutes"
