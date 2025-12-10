"""Legal document response schemas."""

from datetime import date

from pydantic import BaseModel


class LegalDocumentResponse(BaseModel):
    """Response schema for legal documents."""

    version: str
    effective_date: date
    content: str
    document_type: str


class PrivacyPolicyResponse(LegalDocumentResponse):
    """Response schema for privacy policy."""

    document_type: str = "privacy_policy"


class TermsOfServiceResponse(LegalDocumentResponse):
    """Response schema for terms of service."""

    document_type: str = "terms_of_service"


class DataRetentionResponse(LegalDocumentResponse):
    """Response schema for data retention policy."""

    document_type: str = "data_retention"


class LegalVersionsResponse(BaseModel):
    """Response schema for current legal document versions."""

    terms_of_service_version: str
    privacy_policy_version: str
    data_retention_version: str
