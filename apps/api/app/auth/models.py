"""Authentication domain models."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field, SQLModel


class RefreshToken(SQLModel, table=True):
    """Refresh token storage for token rotation."""

    __tablename__ = "refresh_token"
    __table_args__ = (
        Index("ix_refresh_token_user_id", "user_id"),
        Index("ix_refresh_token_token_hash", "token_hash"),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, nullable=False),
    )
    user_id: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    token_hash: str = Field(
        sa_column=Column(String(255), nullable=False),
    )
    expires_at: datetime = Field(nullable=False)
    revoked_at: datetime | None = Field(default=None)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
    user_agent: str | None = Field(default=None, max_length=500)
    ip_address: str | None = Field(default=None, max_length=45)

    @property
    def is_valid(self) -> bool:
        """Check if token is valid (not expired and not revoked)."""
        return self.revoked_at is None and self.expires_at > datetime.utcnow()
