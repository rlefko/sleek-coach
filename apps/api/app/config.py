"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field, PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "sleek-coach-api"
    app_env: Literal["development", "staging", "production", "testing"] = "development"
    debug: bool = False
    secret_key: str = Field(default="dev-secret-key-minimum-32-characters-long")
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: PostgresDsn
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # Redis
    redis_url: RedisDsn

    # JWT
    jwt_secret_key: str = Field(default="dev-jwt-secret-key-32-chars-minimum")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # AWS/S3
    aws_access_key_id: str = "minioadmin"
    aws_secret_access_key: str = "minioadmin"
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "sleek-coach-photos"
    s3_endpoint_url: AnyHttpUrl | None = None  # For MinIO in development

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8081"]

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    log_format: Literal["json", "console"] = "json"

    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_period: int = 60

    # OpenAI / AI Coach
    openai_api_key: str = ""
    openai_default_model: str = "gpt-4o-mini"
    openai_timeout_seconds: int = 60
    coach_default_model_tier: str = "standard"
    coach_max_conversation_history: int = 20
    coach_context_max_tokens: int = 4000
    coach_cache_ttl_seconds: int = 300

    # Safety thresholds
    coach_min_calories_female: int = 1200
    coach_min_calories_male: int = 1500
    coach_max_deficit: int = 1000

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.app_env == "production"

    @property
    def is_testing(self) -> bool:
        """Check if running in testing mode."""
        return self.app_env == "testing"


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()
