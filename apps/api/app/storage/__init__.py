"""Storage module for S3/MinIO operations."""

from .s3_client import S3Service, get_s3_service

__all__ = ["S3Service", "get_s3_service"]
