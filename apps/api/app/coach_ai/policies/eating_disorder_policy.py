"""Eating disorder detection policy."""

from __future__ import annotations

import re

from app.coach_ai.policies.base import (
    BasePolicy,
    PolicyAction,
    PolicyResult,
    PolicySeverity,
    UserContext,
)

# Keywords and patterns that may indicate eating disorder behaviors
ED_KEYWORDS = [
    "purge",
    "purging",
    "binge",
    "binging",
    "bingeing",
    "laxative",
    "laxatives",
    "diet pills",
    "water fast",
    "juice cleanse",
    "body checking",
    "body check",
    "thinspo",
    "pro-ana",
    "pro-mia",
    "meanspo",
    "bonespo",
]

ED_PHRASES = [
    r"how\s+(?:to|can\s+i)\s+not\s+eat",
    r"punish\s+(?:myself|me)\s+(?:for|with)\s+(?:eating|food)",
    r"(?:hate|disgusted)\s+(?:with|by)\s+(?:my\s+)?body",
    r"never\s+eat\s+again",
    r"(?:scared|afraid)\s+(?:of|to)\s+eat",
    r"make\s+(?:myself|me)\s+(?:throw\s+up|vomit|sick)",
    r"get\s+rid\s+of\s+(?:the\s+)?food",
    r"(?:starve|starving)\s+(?:myself|me)",
]


class EatingDisorderPolicy(BasePolicy):
    """Policy for detecting eating disorder signals."""

    name = "eating_disorder_policy"
    description = "Detects potential eating disorder signals and provides appropriate resources"
    severity = PolicySeverity.CRITICAL

    def check_input(self, user_input: str, _context: UserContext) -> PolicyResult:
        """Check for eating disorder signals in user input."""
        input_lower = user_input.lower()

        # Check for keywords
        for keyword in ED_KEYWORDS:
            if keyword in input_lower:
                return self._create_concern_response(keyword)

        # Check for phrases
        for pattern in ED_PHRASES:
            if re.search(pattern, input_lower):
                return self._create_concern_response(pattern)

        return PolicyResult(passed=True, action=PolicyAction.ALLOW)

    def check_output(self, llm_output: str, _context: UserContext) -> PolicyResult:
        """Ensure LLM output doesn't encourage ED behaviors."""
        output_lower = llm_output.lower()

        # Check for problematic recommendations
        dangerous_patterns = [
            r"skip\s+(?:all\s+)?meals",
            r"very\s+low\s+calorie",
            r"extreme\s+(?:diet|restriction|fasting)",
            r"fast\s+for\s+(?:\d+\s+)?days",
            r"don'?t\s+eat\s+(?:for|until)",
            r"restrict\s+(?:heavily|severely)",
        ]

        for pattern in dangerous_patterns:
            if re.search(pattern, output_lower):
                return PolicyResult(
                    passed=False,
                    action=PolicyAction.BLOCK,
                    severity=PolicySeverity.CRITICAL,
                    violation_type="ed_promotion",
                    message="I can't provide advice that could be harmful to your health.",
                )

        return PolicyResult(passed=True, action=PolicyAction.ALLOW)

    def _create_concern_response(self, _trigger: str) -> PolicyResult:
        """Create a supportive response for ED concerns."""
        support_message = (
            "I notice you may be going through a difficult time with food and body image. "
            "Your wellbeing is what matters most, and I want to make sure you have access to support.\n\n"
            "If you're struggling with your relationship with food, please consider reaching out to:\n"
            "- **National Eating Disorders Association (NEDA):** 1-800-931-2237\n"
            "- **Crisis Text Line:** Text 'NEDA' to 741741\n"
            "- **Your healthcare provider** or a licensed therapist\n\n"
            "I'm here to support your health goals in a safe, sustainable way. "
            "Would you like to talk about some gentle approaches to nutrition?"
        )

        return PolicyResult(
            passed=False,
            action=PolicyAction.FLAG,
            severity=PolicySeverity.CRITICAL,
            violation_type="eating_disorder_signal",
            message=support_message,
        )
