"""API tests for nutrition endpoints."""

import io
import zipfile
from datetime import date, timedelta

import pytest
from httpx import AsyncClient


async def get_auth_headers(client: AsyncClient, email: str | None = None) -> dict[str, str]:
    """Register a user and return auth headers."""
    test_email = email or f"nutrition_user_{id(client)}@example.com"
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": test_email, "password": "SecurePass123!"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_test_zip(csv_content: str) -> bytes:
    """Create a test ZIP file with the given CSV content."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("Nutrition.csv", csv_content)
    return buffer.getvalue()


@pytest.mark.asyncio
async def test_create_nutrition_day(client: AsyncClient) -> None:
    """Test creating a new nutrition day."""
    headers = await get_auth_headers(client, "nutrition_create@example.com")

    response = await client.post(
        "/api/v1/nutrition/day",
        headers=headers,
        json={
            "date": str(date.today()),
            "calories": 2000,
            "protein_g": 150.0,
            "carbs_g": 200.0,
            "fat_g": 70.0,
            "fiber_g": 30.0,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["date"] == str(date.today())
    assert data["calories"] == 2000
    assert data["protein_g"] == 150.0
    assert data["carbs_g"] == 200.0
    assert data["fat_g"] == 70.0
    assert data["fiber_g"] == 30.0
    assert data["source"] == "manual"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_nutrition_day_minimal(client: AsyncClient) -> None:
    """Test creating a nutrition day with minimal data."""
    headers = await get_auth_headers(client, "nutrition_minimal@example.com")

    response = await client.post(
        "/api/v1/nutrition/day",
        headers=headers,
        json={
            "date": str(date.today()),
            "calories": 1500,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["calories"] == 1500
    assert data["protein_g"] is None


@pytest.mark.asyncio
async def test_create_nutrition_day_upsert(client: AsyncClient) -> None:
    """Test that creating nutrition for existing date updates it."""
    headers = await get_auth_headers(client, "nutrition_upsert@example.com")
    today = str(date.today())

    # Create initial entry
    response1 = await client.post(
        "/api/v1/nutrition/day",
        headers=headers,
        json={"date": today, "calories": 1800},
    )
    assert response1.status_code == 201
    first_id = response1.json()["id"]

    # Update same date
    response2 = await client.post(
        "/api/v1/nutrition/day",
        headers=headers,
        json={"date": today, "calories": 2000, "protein_g": 150.0},
    )

    assert response2.status_code == 201
    data = response2.json()
    assert data["id"] == first_id  # Same record
    assert data["calories"] == 2000
    assert data["protein_g"] == 150.0


@pytest.mark.asyncio
async def test_create_nutrition_day_unauthorized(client: AsyncClient) -> None:
    """Test creating nutrition without auth fails."""
    response = await client.post(
        "/api/v1/nutrition/day",
        json={"date": str(date.today()), "calories": 2000},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_nutrition_day(client: AsyncClient) -> None:
    """Test getting nutrition for a specific date."""
    headers = await get_auth_headers(client, "nutrition_get@example.com")
    today = str(date.today())

    # Create entry
    await client.post(
        "/api/v1/nutrition/day",
        headers=headers,
        json={"date": today, "calories": 2000, "protein_g": 150.0},
    )

    # Get entry
    response = await client.get(
        f"/api/v1/nutrition/day?date={today}",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["date"] == today
    assert data["calories"] == 2000


@pytest.mark.asyncio
async def test_get_nutrition_day_not_found(client: AsyncClient) -> None:
    """Test getting nutrition for a date that doesn't exist."""
    headers = await get_auth_headers(client, "nutrition_notfound@example.com")

    response = await client.get(
        f"/api/v1/nutrition/day?date={date.today()}",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json() is None


@pytest.mark.asyncio
async def test_get_nutrition_range(client: AsyncClient) -> None:
    """Test getting nutrition for a date range."""
    headers = await get_auth_headers(client, "nutrition_range@example.com")

    # Create entries for multiple days
    for i in range(3):
        day = date.today() - timedelta(days=i)
        await client.post(
            "/api/v1/nutrition/day",
            headers=headers,
            json={"date": str(day), "calories": 2000 + i * 100},
        )

    from_date = date.today() - timedelta(days=2)
    response = await client.get(
        f"/api/v1/nutrition/range?from={from_date}&to={date.today()}",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3


@pytest.mark.asyncio
async def test_get_nutrition_range_aggregate(client: AsyncClient) -> None:
    """Test getting aggregated nutrition stats."""
    headers = await get_auth_headers(client, "nutrition_aggregate@example.com")

    # Create entries
    for i in range(3):
        day = date.today() - timedelta(days=i)
        await client.post(
            "/api/v1/nutrition/day",
            headers=headers,
            json={
                "date": str(day),
                "calories": 2000,
                "protein_g": 150.0,
            },
        )

    from_date = date.today() - timedelta(days=6)
    response = await client.get(
        f"/api/v1/nutrition/range?from={from_date}&to={date.today()}&aggregate=true",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["logged_days"] == 3
    assert data["total_days"] == 7
    assert data["avg_calories"] == 2000.0
    assert data["avg_protein_g"] == 150.0


@pytest.mark.asyncio
async def test_get_nutrition_range_invalid_dates(client: AsyncClient) -> None:
    """Test that invalid date range returns error."""
    headers = await get_auth_headers(client, "nutrition_invalid@example.com")

    # from_date after to_date
    from_date = date.today()
    to_date = date.today() - timedelta(days=7)

    response = await client.get(
        f"/api/v1/nutrition/range?from={from_date}&to={to_date}",
        headers=headers,
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_delete_nutrition_day(client: AsyncClient) -> None:
    """Test deleting nutrition for a date."""
    headers = await get_auth_headers(client, "nutrition_delete@example.com")
    today = str(date.today())

    # Create entry
    await client.post(
        "/api/v1/nutrition/day",
        headers=headers,
        json={"date": today, "calories": 2000},
    )

    # Delete entry
    response = await client.delete(
        f"/api/v1/nutrition/day?date={today}",
        headers=headers,
    )

    assert response.status_code == 204

    # Verify it's gone
    get_response = await client.get(
        f"/api/v1/nutrition/day?date={today}",
        headers=headers,
    )
    assert get_response.json() is None


@pytest.mark.asyncio
async def test_delete_nutrition_day_not_found(client: AsyncClient) -> None:
    """Test deleting nonexistent nutrition returns 404."""
    headers = await get_auth_headers(client, "nutrition_delnf@example.com")

    response = await client.delete(
        f"/api/v1/nutrition/day?date={date.today()}",
        headers=headers,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_calculate_targets(client: AsyncClient) -> None:
    """Test TDEE and macro target calculation endpoint."""
    headers = await get_auth_headers(client, "nutrition_targets@example.com")

    response = await client.post(
        "/api/v1/nutrition/calculate-targets",
        headers=headers,
        json={
            "weight_kg": 80,
            "height_cm": 180,
            "age": 30,
            "sex": "male",
            "activity_level": "moderate",
            "goal_type": "fat_loss",
            "pace": "moderate",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "tdee" in data
    assert "bmr" in data
    assert "target_calories" in data
    assert "protein_g" in data
    assert "carbs_g" in data
    assert "fat_g" in data
    assert data["deficit_surplus"] < 0  # Fat loss has deficit


@pytest.mark.asyncio
async def test_calculate_targets_muscle_gain(client: AsyncClient) -> None:
    """Test macro targets for muscle gain goal."""
    headers = await get_auth_headers(client, "nutrition_muscle@example.com")

    response = await client.post(
        "/api/v1/nutrition/calculate-targets",
        headers=headers,
        json={
            "weight_kg": 70,
            "height_cm": 175,
            "age": 25,
            "sex": "male",
            "activity_level": "active",
            "goal_type": "muscle_gain",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["deficit_surplus"] > 0  # Muscle gain has surplus


@pytest.mark.asyncio
async def test_mfp_import_success(client: AsyncClient) -> None:
    """Test MFP CSV import."""
    headers = await get_auth_headers(client, "nutrition_import@example.com")

    csv_content = f"""Date,Calories,Protein (g),Carbohydrates (g),Fat (g),Fiber (g)
{date.today().strftime("%m/%d/%Y")},2000,150,200,70,30
{(date.today() - timedelta(days=1)).strftime("%m/%d/%Y")},1800,140,180,65,25
"""
    zip_content = create_test_zip(csv_content)

    response = await client.post(
        "/api/v1/integrations/mfp/import",
        headers=headers,
        files={"file": ("export.zip", zip_content, "application/zip")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] == 2
    assert data["imported"] == 2
    assert data["skipped"] == 0


@pytest.mark.asyncio
async def test_mfp_import_skip_existing(client: AsyncClient) -> None:
    """Test MFP import skips existing entries when overwrite=false."""
    headers = await get_auth_headers(client, "nutrition_skipex@example.com")
    today = str(date.today())

    # Create existing entry
    await client.post(
        "/api/v1/nutrition/day",
        headers=headers,
        json={"date": today, "calories": 1500},
    )

    # Import with overlapping date
    csv_content = f"""Date,Calories,Protein (g)
{date.today().strftime("%m/%d/%Y")},2000,150
"""
    zip_content = create_test_zip(csv_content)

    response = await client.post(
        "/api/v1/integrations/mfp/import",
        headers=headers,
        files={"file": ("export.zip", zip_content, "application/zip")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["skipped"] == 1

    # Verify original value unchanged
    get_response = await client.get(
        f"/api/v1/nutrition/day?date={today}",
        headers=headers,
    )
    assert get_response.json()["calories"] == 1500


@pytest.mark.asyncio
async def test_mfp_import_overwrite_existing(client: AsyncClient) -> None:
    """Test MFP import overwrites existing entries when overwrite=true."""
    headers = await get_auth_headers(client, "nutrition_overwr@example.com")
    today = str(date.today())

    # Create existing entry
    await client.post(
        "/api/v1/nutrition/day",
        headers=headers,
        json={"date": today, "calories": 1500},
    )

    # Import with overwrite=true
    csv_content = f"""Date,Calories,Protein (g)
{date.today().strftime("%m/%d/%Y")},2000,150
"""
    zip_content = create_test_zip(csv_content)

    response = await client.post(
        "/api/v1/integrations/mfp/import?overwrite=true",
        headers=headers,
        files={"file": ("export.zip", zip_content, "application/zip")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["imported"] == 1

    # Verify value was updated
    get_response = await client.get(
        f"/api/v1/nutrition/day?date={today}",
        headers=headers,
    )
    assert get_response.json()["calories"] == 2000


@pytest.mark.asyncio
async def test_mfp_import_invalid_file(client: AsyncClient) -> None:
    """Test MFP import with non-ZIP file."""
    headers = await get_auth_headers(client, "nutrition_invzip@example.com")

    response = await client.post(
        "/api/v1/integrations/mfp/import",
        headers=headers,
        files={"file": ("data.csv", b"not a zip file", "text/csv")},
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_mfp_import_empty_file(client: AsyncClient) -> None:
    """Test MFP import with empty file."""
    headers = await get_auth_headers(client, "nutrition_empty@example.com")

    response = await client.post(
        "/api/v1/integrations/mfp/import",
        headers=headers,
        files={"file": ("export.zip", b"", "application/zip")},
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_mfp_import_unauthorized(client: AsyncClient) -> None:
    """Test MFP import without auth fails."""
    zip_content = create_test_zip("Date,Calories\n12/09/2024,2000")

    response = await client.post(
        "/api/v1/integrations/mfp/import",
        files={"file": ("export.zip", zip_content, "application/zip")},
    )

    assert response.status_code == 401
