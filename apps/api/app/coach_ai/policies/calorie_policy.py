"""Calorie safety policy."""

from __future__ import annotations

import re

from app.coach_ai.policies.base import (
    BasePolicy,
    PolicyAction,
    PolicyResult,
    PolicySeverity,
    UserContext,
)

# Safety thresholds
MIN_CALORIES_FEMALE = 1200
MIN_CALORIES_MALE = 1500
MAX_DEFICIT = 1000


class CaloriePolicy(BasePolicy):
    """Policy for minimum/maximum calorie recommendations."""

    name = "calorie_policy"
    description = "Ensures calorie recommendations are within safe limits"
    severity = PolicySeverity.BLOCKED

    def check_input(self, user_input: str, context: UserContext) -> PolicyResult:
        """Check if user is requesting dangerous calorie levels."""
        input_lower = user_input.lower()

        # Patterns for extremely low calorie requests
        patterns = [
            r"\b(\d{2,3})\s*(?:cal|calories|kcal)",  # 2-3 digit calorie numbers
            r"under\s*(\d{3,4})\s*(?:cal|calories|kcal)",
            r"only\s*(\d{3,4})\s*(?:cal|calories|kcal)",
            r"less\s*than\s*(\d{3,4})\s*(?:cal|calories|kcal)",
        ]

        min_cal = MIN_CALORIES_FEMALE if context.sex == "female" else MIN_CALORIES_MALE

        for pattern in patterns:
            match = re.search(pattern, input_lower)
            if match:
                try:
                    calories = int(match.group(1))
                    if calories < min_cal:
                        return PolicyResult(
                            passed=False,
                            action=PolicyAction.MODIFY,
                            severity=PolicySeverity.WARNING,
                            violation_type="calorie_minimum_request",
                            message=(
                                f"I understand you're motivated, but calorie levels below {min_cal} "
                                "aren't recommended for health and safety reasons. Let me help you "
                                "find a sustainable approach that will get you results safely."
                            ),
                        )
                except ValueError:
                    pass

        return PolicyResult(passed=True, action=PolicyAction.ALLOW)

    def check_output(self, llm_output: str, context: UserContext) -> PolicyResult:
        """Check if LLM is recommending dangerous calorie levels."""
        output_lower = llm_output.lower()

        # Extract calorie recommendations from output
        patterns = [
            r"(\d{3,4})\s*(?:cal|kcal|calories)",
            r"eat\s*(?:around|about|approximately)?\s*(\d{3,4})",
            r"target\s*(?:of)?\s*(\d{3,4})",
            r"aim\s*for\s*(\d{3,4})",
        ]

        min_cal = MIN_CALORIES_FEMALE if context.sex == "female" else MIN_CALORIES_MALE

        for pattern in patterns:
            matches = re.findall(pattern, output_lower)
            for match in matches:
                try:
                    calories = int(match)
                    if calories < min_cal:
                        disclaimer = (
                            f"\n\n**Important:** Calorie intake below {min_cal} calories per day "
                            "is generally not recommended without medical supervision. Please "
                            "consult a healthcare provider before making significant changes to your diet."
                        )
                        return PolicyResult(
                            passed=False,
                            action=PolicyAction.MODIFY,
                            severity=PolicySeverity.WARNING,
                            violation_type="calorie_minimum",
                            disclaimer=disclaimer,
                        )
                except ValueError:
                    pass

        return PolicyResult(passed=True, action=PolicyAction.ALLOW)
