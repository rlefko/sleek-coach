"""Weight loss rate policy."""

from __future__ import annotations

import re

from app.coach_ai.policies.base import (
    BasePolicy,
    PolicyAction,
    PolicyResult,
    PolicySeverity,
    UserContext,
)

# Maximum safe weight loss rate (1% of body weight per week)
MAX_WEIGHT_LOSS_RATE = 0.01


class WeightLossPolicy(BasePolicy):
    """Policy for safe weight loss rate."""

    name = "weight_loss_policy"
    description = "Ensures weight loss recommendations are within safe limits"
    severity = PolicySeverity.WARNING

    def check_input(self, user_input: str, context: UserContext) -> PolicyResult:
        """Check if user is requesting dangerous weight loss rates."""
        input_lower = user_input.lower()

        # Patterns for rapid weight loss requests
        rapid_loss_patterns = [
            r"lose\s+(\d+)\s*(?:lbs?|pounds?|kg|kilos?)\s*(?:in|per)\s*(?:a\s+)?week",
            r"drop\s+(\d+)\s*(?:lbs?|pounds?|kg|kilos?)\s*(?:fast|quick|rapid)",
            r"(\d+)\s*(?:lbs?|pounds?|kg|kilos?)\s*(?:a|per)\s*week",
        ]

        for pattern in rapid_loss_patterns:
            match = re.search(pattern, input_lower)
            if match:
                try:
                    amount = float(match.group(1))

                    # Convert to kg if in pounds
                    if "lb" in pattern or "pound" in pattern:
                        amount_kg = amount * 0.453592
                    else:
                        amount_kg = amount

                    # Check against safe rate if we have user's weight
                    if context.current_weight_kg:
                        safe_rate_kg = context.current_weight_kg * MAX_WEIGHT_LOSS_RATE
                        if amount_kg > safe_rate_kg * 1.5:  # 50% above safe rate
                            return PolicyResult(
                                passed=False,
                                action=PolicyAction.MODIFY,
                                severity=PolicySeverity.WARNING,
                                violation_type="rapid_weight_loss_request",
                                message=(
                                    f"I understand you want fast results! For sustainable, healthy weight loss, "
                                    f"experts recommend no more than {safe_rate_kg:.1f} kg ({safe_rate_kg * 2.2:.1f} lbs) "
                                    f"per week, which is about 1% of your body weight. "
                                    "Faster loss often leads to muscle loss and rebound weight gain. "
                                    "Let me help you with a plan that gets lasting results!"
                                ),
                            )
                    else:
                        # Without weight context, use general guidance
                        if amount_kg > 1.0:  # More than 1kg/week is concerning
                            return PolicyResult(
                                passed=False,
                                action=PolicyAction.MODIFY,
                                severity=PolicySeverity.WARNING,
                                violation_type="rapid_weight_loss_request",
                                message=(
                                    "Losing more than 0.5-1 kg (1-2 lbs) per week can lead to muscle loss, "
                                    "nutrient deficiencies, and rebound weight gain. Let me help you create "
                                    "a sustainable plan that gets you lasting results!"
                                ),
                            )
                except ValueError:
                    pass

        return PolicyResult(passed=True, action=PolicyAction.ALLOW)

    def check_output(self, llm_output: str, _context: UserContext) -> PolicyResult:
        """Check if LLM is recommending dangerous weight loss rates."""
        output_lower = llm_output.lower()

        # Patterns for rapid weight loss recommendations
        rapid_patterns = [
            r"lose\s+(\d+)\s*(?:lbs?|pounds?|kg|kilos?)\s*(?:per|a)\s*week",
            r"expect\s+(?:to\s+)?(?:lose\s+)?(\d+)\s*(?:lbs?|pounds?|kg|kilos?)",
            r"(\d+)\s*(?:lbs?|pounds?|kg|kilos?)\s*(?:weekly|per\s+week)",
        ]

        for pattern in rapid_patterns:
            matches = re.findall(pattern, output_lower)
            for match in matches:
                try:
                    amount = float(match)

                    # Convert to kg if in pounds
                    if "lb" in pattern or "pound" in pattern:
                        amount_kg = amount * 0.453592
                    else:
                        amount_kg = amount

                    if amount_kg > 1.0:  # More than 1kg/week
                        disclaimer = (
                            "\n\n**Note:** For safe, sustainable weight loss, aim for 0.5-1 kg "
                            "(1-2 lbs) per week. Faster weight loss may lead to muscle loss "
                            "and is harder to maintain long-term."
                        )
                        return PolicyResult(
                            passed=False,
                            action=PolicyAction.MODIFY,
                            severity=PolicySeverity.WARNING,
                            violation_type="rapid_weight_loss_recommendation",
                            disclaimer=disclaimer,
                        )
                except ValueError:
                    pass

        return PolicyResult(passed=True, action=PolicyAction.ALLOW)
