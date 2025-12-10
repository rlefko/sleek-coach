"""Legal document API endpoints."""

from datetime import date
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.legal.schemas import (
    DataRetentionResponse,
    LegalVersionsResponse,
    PrivacyPolicyResponse,
    TermsOfServiceResponse,
)

router = APIRouter(prefix="/legal", tags=["legal"])

# Current document versions - update these when documents change
PRIVACY_POLICY_VERSION = "1.0"
TERMS_OF_SERVICE_VERSION = "1.0"
DATA_RETENTION_VERSION = "1.0"
EFFECTIVE_DATE = date(2024, 12, 10)

# Path to legal documents
DOCS_PATH = Path(__file__).parent.parent.parent.parent.parent / "docs" / "legal"


def _read_document(filename: str) -> str:
    """Read a legal document from the docs folder.

    Args:
        filename: Name of the document file.

    Returns:
        The document content as a string.

    Raises:
        HTTPException: If document file cannot be read.
    """
    doc_path = DOCS_PATH / filename
    try:
        return doc_path.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail=f"Legal document not found: {filename}",
        )
    except OSError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading legal document: {e!s}",
        )


@router.get("/privacy-policy", response_model=PrivacyPolicyResponse)
async def get_privacy_policy() -> PrivacyPolicyResponse:
    """Get the current privacy policy.

    Returns:
        The privacy policy document with version and effective date.
    """
    content = _read_document("PRIVACY_POLICY.md")
    return PrivacyPolicyResponse(
        version=PRIVACY_POLICY_VERSION,
        effective_date=EFFECTIVE_DATE,
        content=content,
    )


@router.get("/terms-of-service", response_model=TermsOfServiceResponse)
async def get_terms_of_service() -> TermsOfServiceResponse:
    """Get the current terms of service.

    Returns:
        The terms of service document with version and effective date.
    """
    content = _read_document("TERMS_OF_SERVICE.md")
    return TermsOfServiceResponse(
        version=TERMS_OF_SERVICE_VERSION,
        effective_date=EFFECTIVE_DATE,
        content=content,
    )


@router.get("/data-retention", response_model=DataRetentionResponse)
async def get_data_retention() -> DataRetentionResponse:
    """Get the current data retention policy.

    Returns:
        The data retention policy document with version and effective date.
    """
    content = _read_document("DATA_RETENTION_POLICY.md")
    return DataRetentionResponse(
        version=DATA_RETENTION_VERSION,
        effective_date=EFFECTIVE_DATE,
        content=content,
    )


@router.get("/versions", response_model=LegalVersionsResponse)
async def get_legal_versions() -> LegalVersionsResponse:
    """Get the current versions of all legal documents.

    Returns:
        Current versions of all legal documents.
    """
    return LegalVersionsResponse(
        terms_of_service_version=TERMS_OF_SERVICE_VERSION,
        privacy_policy_version=PRIVACY_POLICY_VERSION,
        data_retention_version=DATA_RETENTION_VERSION,
    )
