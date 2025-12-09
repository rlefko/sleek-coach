"""System prompts and templates for AI Coach."""

from app.coach_ai.prompts.disclaimer_templates import DISCLAIMERS
from app.coach_ai.prompts.system_prompts import get_system_prompt

__all__ = [
    "DISCLAIMERS",
    "get_system_prompt",
]
