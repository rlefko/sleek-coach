"""MyFitnessPal CSV export parser.

This module handles parsing of MyFitnessPal data exports, which come as ZIP files
containing CSV files with nutrition data.

Supports:
- ZIP file extraction with ZIP bomb protection
- Multiple date formats (US, EU, ISO)
- Auto-detection of date format
- Calculating calories from macros when missing
- Detailed error reporting
"""

from __future__ import annotations

import csv
import io
import zipfile
from dataclasses import dataclass, field
from datetime import date, datetime

# Security: Maximum decompressed size to prevent ZIP bomb attacks (100MB)
MAX_DECOMPRESSED_SIZE = 100 * 1024 * 1024
# Security: Maximum size per file within the archive (50MB)
MAX_FILE_SIZE = 50 * 1024 * 1024

# Supported date formats in order of preference
SUPPORTED_DATE_FORMATS = [
    "%m/%d/%Y",  # US format: 12/31/2024
    "%Y-%m-%d",  # ISO format: 2024-12-31
    "%d/%m/%Y",  # EU format: 31/12/2024
    "%m/%d/%y",  # US short: 12/31/24
    "%d/%m/%y",  # EU short: 31/12/24
]

# Column name variations in MFP exports
COLUMN_MAPPINGS = {
    "date": ["Date", "date", "DATE"],
    "calories": ["Calories", "calories", "CALORIES", "Energy (kcal)"],
    "protein": ["Protein (g)", "Protein", "protein", "PROTEIN"],
    "carbs": ["Carbohydrates (g)", "Carbs (g)", "Carbohydrates", "carbs", "CARBS"],
    "fat": ["Fat (g)", "Fat", "fat", "FAT", "Total Fat (g)"],
    "fiber": ["Fiber (g)", "Fiber", "fiber", "FIBER"],
}


@dataclass
class MFPNutritionRow:
    """Parsed nutrition row from MFP CSV."""

    date: date
    calories: int | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    fiber_g: float | None = None


@dataclass
class MFPParseResult:
    """Result of parsing MFP export."""

    rows: list[MFPNutritionRow] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    total_rows: int = 0
    detected_date_format: str | None = None


class MFPParseError(Exception):
    """Error parsing MFP data."""

    pass


def parse_mfp_zip(
    zip_content: bytes,
    date_format: str | None = None,
) -> MFPParseResult:
    """Parse MFP export ZIP file.

    Args:
        zip_content: Raw bytes of the ZIP file.
        date_format: Optional date format to use (auto-detects if None).

    Returns:
        MFPParseResult with parsed rows and any errors.
    """
    result = MFPParseResult()

    try:
        with zipfile.ZipFile(io.BytesIO(zip_content)) as zf:
            # Security: Check for ZIP bomb attacks
            total_size = sum(info.file_size for info in zf.infolist())
            if total_size > MAX_DECOMPRESSED_SIZE:
                result.errors.append(
                    f"ZIP file decompresses to {total_size:,} bytes, "
                    f"exceeds maximum allowed size of {MAX_DECOMPRESSED_SIZE:,} bytes"
                )
                return result

            # Find Nutrition.csv in the archive
            nutrition_file = _find_nutrition_csv(zf)
            if not nutrition_file:
                result.errors.append("Nutrition.csv not found in archive")
                return result

            # Security: Check individual file size
            file_info = zf.getinfo(nutrition_file)
            if file_info.file_size > MAX_FILE_SIZE:
                result.errors.append(
                    f"Nutrition.csv size ({file_info.file_size:,} bytes) "
                    f"exceeds maximum allowed size of {MAX_FILE_SIZE:,} bytes"
                )
                return result

            with zf.open(nutrition_file) as f:
                # Decode and parse CSV (handle BOM)
                content = f.read().decode("utf-8-sig")
                _parse_nutrition_csv(content, date_format, result)

    except zipfile.BadZipFile:
        result.errors.append("Invalid ZIP file")

    return result


def parse_mfp_csv_content(
    csv_content: str,
    date_format: str | None = None,
) -> MFPParseResult:
    """Parse raw CSV content (for testing or direct CSV upload).

    Args:
        csv_content: Raw CSV string content.
        date_format: Optional date format to use (auto-detects if None).

    Returns:
        MFPParseResult with parsed rows and any errors.
    """
    result = MFPParseResult()
    _parse_nutrition_csv(csv_content, date_format, result)
    return result


def _find_nutrition_csv(zf: zipfile.ZipFile) -> str | None:
    """Find Nutrition.csv in ZIP archive (case-insensitive, handles subdirectories).

    Args:
        zf: Open ZipFile object.

    Returns:
        Path to Nutrition.csv within the archive, or None if not found.
    """
    for name in zf.namelist():
        # Handle both flat and nested structures
        basename = name.split("/")[-1].lower()
        if basename == "nutrition.csv":
            return name
    return None


def _parse_nutrition_csv(
    content: str,
    date_format: str | None,
    result: MFPParseResult,
) -> None:
    """Parse CSV content and populate result.

    Args:
        content: CSV string content.
        date_format: Optional date format (auto-detects if None).
        result: MFPParseResult to populate.
    """
    try:
        reader = csv.DictReader(io.StringIO(content))
        if reader.fieldnames is None:
            result.errors.append("Empty CSV file or invalid format")
            return

        # Map column names to our standard names
        column_map = _detect_columns(list(reader.fieldnames))
        if "date" not in column_map:
            result.errors.append("Date column not found in CSV")
            return

        detected_format = date_format

        for row_num, row in enumerate(reader, start=2):
            result.total_rows += 1

            try:
                # Parse date
                date_col = column_map.get("date")
                if date_col is None:
                    continue

                date_str = row.get(date_col, "").strip()
                if not date_str:
                    result.errors.append(f"Row {row_num}: Missing date")
                    continue

                parsed_date, detected_format = _parse_date(date_str, detected_format)

                # Parse macros
                nutrition_row = MFPNutritionRow(
                    date=parsed_date,
                    calories=_parse_int(row.get(column_map.get("calories", ""), "")),
                    protein_g=_parse_float(row.get(column_map.get("protein", ""), "")),
                    carbs_g=_parse_float(row.get(column_map.get("carbs", ""), "")),
                    fat_g=_parse_float(row.get(column_map.get("fat", ""), "")),
                    fiber_g=_parse_float(row.get(column_map.get("fiber", ""), "")),
                )

                # Calculate calories from macros if not provided
                if nutrition_row.calories is None:
                    calculated = _calculate_calories_from_macros(
                        nutrition_row.protein_g,
                        nutrition_row.carbs_g,
                        nutrition_row.fat_g,
                    )
                    nutrition_row.calories = calculated

                # Skip rows with no meaningful data
                if _is_empty_row(nutrition_row):
                    continue

                result.rows.append(nutrition_row)

            except ValueError as e:
                result.errors.append(f"Row {row_num}: {e!s}")

        result.detected_date_format = detected_format

    except csv.Error as e:
        result.errors.append(f"CSV parsing error: {e!s}")


def _detect_columns(fieldnames: list[str]) -> dict[str, str]:
    """Detect which columns map to which fields.

    Args:
        fieldnames: List of column names from CSV header.

    Returns:
        Mapping of standard field names to actual column names.
    """
    column_map: dict[str, str] = {}

    for field_name, variations in COLUMN_MAPPINGS.items():
        for variation in variations:
            if variation in fieldnames:
                column_map[field_name] = variation
                break

    return column_map


def _parse_date(
    date_str: str,
    known_format: str | None,
) -> tuple[date, str]:
    """Parse date with format auto-detection.

    Args:
        date_str: Date string to parse.
        known_format: Previously detected format (for consistency).

    Returns:
        Tuple of (parsed date, format used).

    Raises:
        ValueError: If date cannot be parsed.
    """
    formats_to_try = [known_format] if known_format else SUPPORTED_DATE_FORMATS

    for fmt in formats_to_try:
        if fmt is None:
            continue
        try:
            parsed = datetime.strptime(date_str, fmt).date()
            # Sanity check: date shouldn't be in the future or too far in the past
            today = date.today()
            if parsed > today:
                raise ValueError(f"Date {date_str} is in the future")
            if (today - parsed).days > 3650:  # More than 10 years ago
                raise ValueError(f"Date {date_str} is more than 10 years ago")
            return parsed, fmt
        except ValueError:
            continue

    raise ValueError(f"Unable to parse date: {date_str}")


def _parse_int(value: str) -> int | None:
    """Parse integer value, handling empty and non-numeric values.

    Args:
        value: String value to parse.

    Returns:
        Parsed integer or None.
    """
    if not value or not value.strip():
        return None

    # Remove commas (thousands separator) and handle both . and , as decimal
    cleaned = value.strip().replace(",", "")

    try:
        # Handle decimal values by truncating
        return int(float(cleaned))
    except ValueError:
        return None


def _parse_float(value: str) -> float | None:
    """Parse float value, handling empty and non-numeric values.

    Args:
        value: String value to parse.

    Returns:
        Parsed float or None.
    """
    if not value or not value.strip():
        return None

    # Remove thousands separator but be careful with decimal separator
    cleaned = value.strip()

    # Handle European format (comma as decimal separator)
    if "," in cleaned and "." not in cleaned:
        cleaned = cleaned.replace(",", ".")
    else:
        # Remove commas as thousands separators
        cleaned = cleaned.replace(",", "")

    try:
        return float(cleaned)
    except ValueError:
        return None


def _calculate_calories_from_macros(
    protein_g: float | None,
    carbs_g: float | None,
    fat_g: float | None,
) -> int | None:
    """Calculate total calories from macronutrients (4/4/9 rule).

    Args:
        protein_g: Protein in grams.
        carbs_g: Carbohydrates in grams.
        fat_g: Fat in grams.

    Returns:
        Total calories, or None if all macros are None.
    """
    if all(v is None for v in [protein_g, carbs_g, fat_g]):
        return None

    protein = protein_g or 0
    carbs = carbs_g or 0
    fat = fat_g or 0

    return int(protein * 4 + carbs * 4 + fat * 9)


def _is_empty_row(row: MFPNutritionRow) -> bool:
    """Check if a nutrition row has no meaningful data.

    Args:
        row: Parsed nutrition row.

    Returns:
        True if all nutrition values are None.
    """
    return all(
        v is None for v in [row.calories, row.protein_g, row.carbs_g, row.fat_g, row.fiber_g]
    )
