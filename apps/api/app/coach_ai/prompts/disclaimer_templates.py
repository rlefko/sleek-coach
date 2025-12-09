"""Disclaimer templates for AI Coach responses."""

from __future__ import annotations

DISCLAIMERS = {
    "general": (
        "This is general fitness information and not medical advice. "
        "Please consult with a healthcare provider for personalized guidance."
    ),
    "medical": (
        "**Disclaimer:** This is general fitness information and not medical advice. "
        "Please consult with a healthcare provider for personalized medical guidance, "
        "especially if you have any health conditions."
    ),
    "calorie_minimum": (
        "**Important:** Calorie intake below {min_calories} calories per day "
        "is generally not recommended without medical supervision. Please "
        "consult a healthcare provider before making significant changes to your diet."
    ),
    "weight_loss_rate": (
        "**Note:** For safe, sustainable weight loss, aim for 0.5-1 kg (1-2 lbs) per week. "
        "Faster weight loss may lead to muscle loss and is harder to maintain long-term."
    ),
    "eating_disorder_resources": (
        "If you're struggling with your relationship with food, please consider reaching out to:\n"
        "- **National Eating Disorders Association (NEDA):** 1-800-931-2237\n"
        "- **Crisis Text Line:** Text 'NEDA' to 741741\n"
        "- Your healthcare provider or a licensed therapist"
    ),
    "supplements": (
        "**Note:** Dietary supplements are not regulated by the FDA. "
        "Consult with a healthcare provider before starting any supplement regimen."
    ),
    "exercise": (
        "**Safety:** Before starting a new exercise program, consult with a healthcare provider, "
        "especially if you have any pre-existing health conditions."
    ),
}


def get_disclaimer(key: str, **kwargs: str) -> str:
    """Get a disclaimer template, optionally formatted with kwargs.

    Args:
        key: The disclaimer key.
        **kwargs: Format arguments for the template.

    Returns:
        The formatted disclaimer string.
    """
    template = DISCLAIMERS.get(key, DISCLAIMERS["general"])
    if kwargs:
        return template.format(**kwargs)
    return template
