"""Integration tests for database connection and basic operations."""

import uuid
from datetime import datetime

import pytest
from sqlmodel import select

from app.users.models import User


@pytest.mark.asyncio
async def test_postgres_connection(integration_session):
    """Test that we can connect to the PostgreSQL container."""
    # Execute a simple query to verify connection
    result = await integration_session.execute(select(1))
    assert result.scalar() == 1


@pytest.mark.asyncio
async def test_user_crud_operations(integration_session):
    """Test basic CRUD operations on User model with real PostgreSQL."""
    # Use naive datetime to match model definition (uses datetime.utcnow)
    now = datetime.utcnow()

    # Create a user
    user = User(
        id=uuid.uuid4(),
        email="integration@test.com",
        hashed_password="hashed_password_here",
        is_active=True,
        is_verified=False,
        created_at=now,
        updated_at=now,
    )

    integration_session.add(user)
    await integration_session.commit()
    await integration_session.refresh(user)

    # Read the user back
    result = await integration_session.execute(
        select(User).where(User.email == "integration@test.com")
    )
    fetched_user = result.scalar_one()

    assert fetched_user is not None
    assert fetched_user.email == "integration@test.com"
    assert fetched_user.is_active is True
    assert fetched_user.is_verified is False

    # Update the user
    fetched_user.is_verified = True
    await integration_session.commit()
    await integration_session.refresh(fetched_user)

    assert fetched_user.is_verified is True

    # Delete the user
    await integration_session.delete(fetched_user)
    await integration_session.commit()

    # Verify deletion
    result = await integration_session.execute(
        select(User).where(User.email == "integration@test.com")
    )
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_unique_email_constraint(integration_session):
    """Test that duplicate emails are rejected by PostgreSQL."""
    from sqlalchemy.exc import IntegrityError

    # Use naive datetime to match model definition (uses datetime.utcnow)
    now = datetime.utcnow()

    # Create first user
    user1 = User(
        id=uuid.uuid4(),
        email="unique@test.com",
        hashed_password="password1",
        is_active=True,
        is_verified=False,
        created_at=now,
        updated_at=now,
    )
    integration_session.add(user1)
    await integration_session.commit()

    # Try to create second user with same email
    user2 = User(
        id=uuid.uuid4(),
        email="unique@test.com",
        hashed_password="password2",
        is_active=True,
        is_verified=False,
        created_at=now,
        updated_at=now,
    )
    integration_session.add(user2)

    with pytest.raises(IntegrityError):
        await integration_session.commit()
