"""Tests for MFP CSV parser."""

import io
import zipfile
from datetime import date

from app.integrations.mfp_parser import (
    MFPParseResult,
    parse_mfp_csv_content,
    parse_mfp_zip,
)


def create_test_zip(csv_content: str, filename: str = "Nutrition.csv") -> bytes:
    """Create a test ZIP file with the given CSV content."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(filename, csv_content)
    return buffer.getvalue()


class TestParseMFPZip:
    """Tests for ZIP file parsing."""

    def test_parse_valid_zip(self) -> None:
        """Test parsing a valid MFP export ZIP."""
        csv_content = """Date,Calories,Protein (g),Carbohydrates (g),Fat (g),Fiber (g)
12/09/2024,2000,150,200,70,30
12/08/2024,1800,140,180,65,25
"""
        zip_content = create_test_zip(csv_content)
        result = parse_mfp_zip(zip_content)

        assert len(result.rows) == 2
        assert result.total_rows == 2
        assert len(result.errors) == 0
        assert result.rows[0].date == date(2024, 12, 9)
        assert result.rows[0].calories == 2000
        assert result.rows[0].protein_g == 150.0

    def test_parse_invalid_zip(self) -> None:
        """Test parsing invalid ZIP data."""
        result = parse_mfp_zip(b"not a zip file")

        assert len(result.rows) == 0
        assert len(result.errors) > 0
        assert "Invalid ZIP file" in result.errors[0]

    def test_parse_zip_without_nutrition_csv(self) -> None:
        """Test parsing ZIP without Nutrition.csv."""
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as zf:
            zf.writestr("other.csv", "data")
        zip_content = buffer.getvalue()

        result = parse_mfp_zip(zip_content)

        assert len(result.rows) == 0
        assert len(result.errors) > 0
        assert "Nutrition.csv not found" in result.errors[0]

    def test_parse_nested_nutrition_csv(self) -> None:
        """Test parsing ZIP with nested Nutrition.csv."""
        csv_content = "Date,Calories\n12/09/2024,2000"
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as zf:
            zf.writestr("export/Nutrition.csv", csv_content)
        zip_content = buffer.getvalue()

        result = parse_mfp_zip(zip_content)

        assert len(result.rows) == 1


class TestParseMFPCSVContent:
    """Tests for CSV content parsing."""

    def test_parse_us_date_format(self) -> None:
        """Test parsing US date format (MM/DD/YYYY)."""
        csv_content = """Date,Calories,Protein (g),Carbohydrates (g),Fat (g)
12/25/2024,2000,150,200,70
01/01/2024,1900,145,190,68
"""
        result = parse_mfp_csv_content(csv_content)

        assert len(result.rows) == 2
        assert result.rows[0].date == date(2024, 12, 25)
        assert result.rows[1].date == date(2024, 1, 1)

    def test_parse_iso_date_format(self) -> None:
        """Test parsing ISO date format (YYYY-MM-DD)."""
        csv_content = """Date,Calories,Protein (g),Carbohydrates (g),Fat (g)
2024-12-25,2000,150,200,70
2024-01-01,1900,145,190,68
"""
        result = parse_mfp_csv_content(csv_content)

        assert len(result.rows) == 2
        assert result.rows[0].date == date(2024, 12, 25)

    def test_parse_eu_date_format(self) -> None:
        """Test parsing EU date format (DD/MM/YYYY)."""
        csv_content = """Date,Calories,Protein (g),Carbohydrates (g),Fat (g)
25/12/2024,2000,150,200,70
"""
        result = parse_mfp_csv_content(csv_content)

        assert len(result.rows) == 1
        assert result.rows[0].date == date(2024, 12, 25)

    def test_calculate_calories_from_macros(self) -> None:
        """Test that calories are calculated from macros when missing."""
        csv_content = """Date,Protein (g),Carbohydrates (g),Fat (g)
12/09/2024,100,150,50
"""
        # Expected: 100*4 + 150*4 + 50*9 = 400 + 600 + 450 = 1450
        result = parse_mfp_csv_content(csv_content)

        assert len(result.rows) == 1
        assert result.rows[0].calories == 1450

    def test_handle_empty_values(self) -> None:
        """Test handling of empty values in CSV."""
        csv_content = """Date,Calories,Protein (g),Carbohydrates (g),Fat (g),Fiber (g)
12/09/2024,2000,150,,70,
"""
        result = parse_mfp_csv_content(csv_content)

        assert len(result.rows) == 1
        assert result.rows[0].carbs_g is None
        assert result.rows[0].fiber_g is None

    def test_handle_decimal_values(self) -> None:
        """Test handling of decimal values."""
        csv_content = """Date,Calories,Protein (g),Carbohydrates (g),Fat (g)
12/09/2024,2000,150.5,200.25,70.75
"""
        result = parse_mfp_csv_content(csv_content)

        assert len(result.rows) == 1
        assert result.rows[0].protein_g == 150.5
        assert result.rows[0].carbs_g == 200.25
        assert result.rows[0].fat_g == 70.75

    def test_handle_thousands_separator(self) -> None:
        """Test handling of thousands separator in quoted numbers."""
        # Note: CSV values with commas must be quoted to be parsed correctly
        csv_content = """Date,Calories,Protein (g),Carbohydrates (g),Fat (g)
12/09/2024,"2,500",150,200,70
"""
        result = parse_mfp_csv_content(csv_content)

        assert len(result.rows) == 1
        assert result.rows[0].calories == 2500

    def test_skip_empty_rows(self) -> None:
        """Test that rows with no data are skipped."""
        csv_content = """Date,Calories,Protein (g),Carbohydrates (g),Fat (g)
12/09/2024,2000,150,200,70
12/08/2024,,,,
"""
        result = parse_mfp_csv_content(csv_content)

        assert len(result.rows) == 1

    def test_skip_missing_date(self) -> None:
        """Test that rows with missing date are skipped."""
        csv_content = """Date,Calories,Protein (g),Carbohydrates (g),Fat (g)
,2000,150,200,70
12/08/2024,1800,140,180,65
"""
        result = parse_mfp_csv_content(csv_content)

        assert len(result.rows) == 1
        assert result.rows[0].date == date(2024, 12, 8)
        assert len(result.errors) == 1  # Missing date error

    def test_column_name_variations(self) -> None:
        """Test handling of different column name variations."""
        csv_content = """Date,Energy (kcal),Protein,Carbs (g),Total Fat (g),Fiber
12/09/2024,2000,150,200,70,30
"""
        result = parse_mfp_csv_content(csv_content)

        # May not match all columns, but should handle gracefully
        assert result.total_rows == 1

    def test_explicit_date_format(self) -> None:
        """Test using explicit date format parameter."""
        csv_content = """Date,Calories
01/02/2024,2000
"""
        # With US format, 01/02/2024 = January 2nd
        result = parse_mfp_csv_content(csv_content, date_format="%m/%d/%Y")

        assert len(result.rows) == 1
        assert result.rows[0].date == date(2024, 1, 2)

    def test_reject_future_dates(self) -> None:
        """Test that future dates are rejected."""
        csv_content = """Date,Calories
12/31/2099,2000
"""
        result = parse_mfp_csv_content(csv_content)

        assert len(result.rows) == 0
        assert len(result.errors) > 0

    def test_reject_very_old_dates(self) -> None:
        """Test that dates older than 10 years are rejected."""
        csv_content = """Date,Calories
01/01/2010,2000
"""
        result = parse_mfp_csv_content(csv_content)

        assert len(result.rows) == 0
        assert len(result.errors) > 0

    def test_empty_csv(self) -> None:
        """Test handling of empty CSV."""
        result = parse_mfp_csv_content("")

        assert len(result.rows) == 0
        assert len(result.errors) > 0

    def test_csv_without_date_column(self) -> None:
        """Test handling of CSV without date column."""
        csv_content = """Calories,Protein (g)
2000,150
"""
        result = parse_mfp_csv_content(csv_content)

        assert len(result.rows) == 0
        assert len(result.errors) > 0
        assert "Date column not found" in result.errors[0]

    def test_detected_date_format_preserved(self) -> None:
        """Test that detected date format is preserved in result."""
        csv_content = """Date,Calories
2024-12-09,2000
"""
        result = parse_mfp_csv_content(csv_content)

        assert result.detected_date_format == "%Y-%m-%d"


class TestMFPParseResult:
    """Tests for MFPParseResult dataclass."""

    def test_default_values(self) -> None:
        """Test default values of MFPParseResult."""
        result = MFPParseResult()

        assert result.rows == []
        assert result.errors == []
        assert result.total_rows == 0
        assert result.detected_date_format is None
