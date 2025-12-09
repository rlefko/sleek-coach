"""API tests for photo endpoints."""

import uuid
from collections.abc import Generator
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import AsyncClient

from app.main import app
from app.storage.s3_client import S3Service, get_s3_service


async def get_auth_headers(client: AsyncClient, email: str | None = None) -> dict[str, str]:
    """Register a user and return auth headers."""
    test_email = email or f"photo_user_{id(client)}@example.com"
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": test_email, "password": "SecurePass123!"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_s3() -> MagicMock:
    """Create a mock S3 service."""
    mock = MagicMock(spec=S3Service)
    mock.generate_s3_key = MagicMock(
        side_effect=lambda user_id, photo_id, _filename: f"photos/{user_id}/{photo_id}.jpg"
    )
    mock.generate_presigned_upload_url = AsyncMock(
        return_value="https://s3.example.com/upload?signature=xxx"
    )
    mock.generate_presigned_download_url = AsyncMock(
        return_value="https://s3.example.com/download?signature=xxx"
    )
    mock.check_object_exists = AsyncMock(return_value=True)
    mock.get_object_metadata = AsyncMock(
        return_value={
            "content_type": "image/jpeg",
            "content_length": 12345,
            "etag": "abc123def456",
        }
    )
    mock.delete_object = AsyncMock(return_value=True)
    return mock


@pytest.fixture(autouse=True)
def override_s3_dependency(mock_s3: MagicMock) -> Generator[None, None, None]:
    """Override S3 service dependency for all tests in this module."""
    app.dependency_overrides[get_s3_service] = lambda: mock_s3
    yield
    app.dependency_overrides.pop(get_s3_service, None)


@pytest.mark.asyncio
async def test_presign_upload(client: AsyncClient) -> None:
    """Test generating a presigned upload URL."""
    headers = await get_auth_headers(client, "photo_presign@example.com")

    response = await client.post(
        "/api/v1/photos/presign",
        headers=headers,
        json={
            "filename": "progress.jpg",
            "content_type": "image/jpeg",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "photo_id" in data
    assert "upload_url" in data
    assert "s3_key" in data
    assert "expires_in" in data
    assert data["expires_in"] == 300


@pytest.mark.asyncio
async def test_presign_upload_unauthorized(client: AsyncClient) -> None:
    """Test presign without auth fails."""
    response = await client.post(
        "/api/v1/photos/presign",
        json={"filename": "test.jpg", "content_type": "image/jpeg"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_commit_photo(client: AsyncClient) -> None:
    """Test committing an uploaded photo."""
    headers = await get_auth_headers(client, "photo_commit@example.com")

    # First get presign URL
    presign_response = await client.post(
        "/api/v1/photos/presign",
        headers=headers,
        json={"filename": "progress.jpg", "content_type": "image/jpeg"},
    )
    presign_data = presign_response.json()

    # Then commit (simulate upload completed)
    response = await client.post(
        "/api/v1/photos/commit",
        headers=headers,
        json={
            "photo_id": presign_data["photo_id"],
            "s3_key": presign_data["s3_key"],
            "date": str(date.today()),
            "visibility": "private",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] == presign_data["photo_id"]
    assert data["date"] == str(date.today())
    assert data["visibility"] == "private"
    assert "download_url" in data


@pytest.mark.asyncio
async def test_commit_photo_coach_only(client: AsyncClient) -> None:
    """Test committing a photo with coach_only visibility."""
    headers = await get_auth_headers(client, "photo_coach@example.com")

    presign_response = await client.post(
        "/api/v1/photos/presign",
        headers=headers,
        json={"filename": "progress.jpg", "content_type": "image/jpeg"},
    )
    presign_data = presign_response.json()

    response = await client.post(
        "/api/v1/photos/commit",
        headers=headers,
        json={
            "photo_id": presign_data["photo_id"],
            "s3_key": presign_data["s3_key"],
            "date": str(date.today()),
            "visibility": "coach_only",
        },
    )

    assert response.status_code == 201
    assert response.json()["visibility"] == "coach_only"


@pytest.mark.asyncio
async def test_commit_photo_not_uploaded(client: AsyncClient, mock_s3: MagicMock) -> None:
    """Test committing a photo that wasn't uploaded fails."""
    headers = await get_auth_headers(client, "photo_notup@example.com")

    # Configure mock to return False for existence check
    mock_s3.check_object_exists = AsyncMock(return_value=False)

    response = await client.post(
        "/api/v1/photos/commit",
        headers=headers,
        json={
            "photo_id": str(uuid.uuid4()),
            "s3_key": "photos/invalid/key.jpg",
            "date": str(date.today()),
        },
    )

    # ValidationError returns 422 Unprocessable Entity
    assert response.status_code == 422
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_photos(client: AsyncClient) -> None:
    """Test listing photos."""
    headers = await get_auth_headers(client, "photo_list@example.com")

    # Create some photos
    for i in range(3):
        presign = await client.post(
            "/api/v1/photos/presign",
            headers=headers,
            json={"filename": f"photo{i}.jpg", "content_type": "image/jpeg"},
        )
        presign_data = presign.json()
        await client.post(
            "/api/v1/photos/commit",
            headers=headers,
            json={
                "photo_id": presign_data["photo_id"],
                "s3_key": presign_data["s3_key"],
                "date": str(date.today() - timedelta(days=i)),
            },
        )

    response = await client.get("/api/v1/photos", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) == 3
    assert data["total"] == 3


@pytest.mark.asyncio
async def test_list_photos_with_date_range(client: AsyncClient) -> None:
    """Test listing photos with date range filter."""
    headers = await get_auth_headers(client, "photo_range@example.com")
    today = date.today()

    # Create photos over several days
    for i in range(5):
        presign = await client.post(
            "/api/v1/photos/presign",
            headers=headers,
            json={"filename": f"photo{i}.jpg", "content_type": "image/jpeg"},
        )
        presign_data = presign.json()
        await client.post(
            "/api/v1/photos/commit",
            headers=headers,
            json={
                "photo_id": presign_data["photo_id"],
                "s3_key": presign_data["s3_key"],
                "date": str(today - timedelta(days=i)),
            },
        )

    response = await client.get(
        "/api/v1/photos",
        headers=headers,
        params={
            "from": str(today - timedelta(days=2)),
            "to": str(today),
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3


@pytest.mark.asyncio
async def test_get_photo(client: AsyncClient) -> None:
    """Test getting a single photo with download URL."""
    headers = await get_auth_headers(client, "photo_get@example.com")

    # Create a photo
    presign = await client.post(
        "/api/v1/photos/presign",
        headers=headers,
        json={"filename": "photo.jpg", "content_type": "image/jpeg"},
    )
    presign_data = presign.json()
    await client.post(
        "/api/v1/photos/commit",
        headers=headers,
        json={
            "photo_id": presign_data["photo_id"],
            "s3_key": presign_data["s3_key"],
            "date": str(date.today()),
        },
    )

    response = await client.get(
        f"/api/v1/photos/{presign_data['photo_id']}",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == presign_data["photo_id"]
    assert "download_url" in data
    assert data["download_url"].startswith("https://")


@pytest.mark.asyncio
async def test_get_photo_not_found(client: AsyncClient) -> None:
    """Test getting a non-existent photo returns 404."""
    headers = await get_auth_headers(client, "photo_404@example.com")

    response = await client.get(
        f"/api/v1/photos/{uuid.uuid4()}",
        headers=headers,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_photo(client: AsyncClient) -> None:
    """Test deleting a photo."""
    headers = await get_auth_headers(client, "photo_delete@example.com")

    # Create a photo
    presign = await client.post(
        "/api/v1/photos/presign",
        headers=headers,
        json={"filename": "to_delete.jpg", "content_type": "image/jpeg"},
    )
    presign_data = presign.json()
    await client.post(
        "/api/v1/photos/commit",
        headers=headers,
        json={
            "photo_id": presign_data["photo_id"],
            "s3_key": presign_data["s3_key"],
            "date": str(date.today()),
        },
    )

    # Delete it
    response = await client.delete(
        f"/api/v1/photos/{presign_data['photo_id']}",
        headers=headers,
    )

    assert response.status_code == 200

    # Verify it's gone
    get_response = await client.get(
        f"/api/v1/photos/{presign_data['photo_id']}",
        headers=headers,
    )
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_photo_unauthorized(client: AsyncClient) -> None:
    """Test deleting a photo without auth fails."""
    response = await client.delete(f"/api/v1/photos/{uuid.uuid4()}")
    assert response.status_code == 401
