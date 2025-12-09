"""Model tiering configuration for subscription-based access."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ModelTier(str, Enum):
    """Subscription-based model tiers."""

    FREE = "free"
    STANDARD = "standard"
    PREMIUM = "premium"


@dataclass
class ModelConfig:
    """Configuration for a model tier."""

    model_name: str
    max_tokens: int
    temperature: float
    rate_limit_per_hour: int
    supports_streaming: bool
    context_window: int


MODEL_CONFIGS: dict[ModelTier, ModelConfig] = {
    ModelTier.FREE: ModelConfig(
        model_name="gpt-4o-mini",  # Using available model, can update to gpt-5-nano later
        max_tokens=1000,
        temperature=0.7,
        rate_limit_per_hour=10,
        supports_streaming=True,
        context_window=8192,
    ),
    ModelTier.STANDARD: ModelConfig(
        model_name="gpt-4o",  # Using available model, can update to gpt-5-mini later
        max_tokens=2000,
        temperature=0.7,
        rate_limit_per_hour=50,
        supports_streaming=True,
        context_window=16384,
    ),
    ModelTier.PREMIUM: ModelConfig(
        model_name="gpt-4o",  # Using available model, can update to gpt-5 later
        max_tokens=4000,
        temperature=0.7,
        rate_limit_per_hour=100,
        supports_streaming=True,
        context_window=32768,
    ),
}


def get_model_config(tier: ModelTier | str) -> ModelConfig:
    """Get model configuration for a tier."""
    if isinstance(tier, str):
        try:
            tier = ModelTier(tier)
        except ValueError:
            tier = ModelTier.STANDARD
    return MODEL_CONFIGS.get(tier, MODEL_CONFIGS[ModelTier.STANDARD])
