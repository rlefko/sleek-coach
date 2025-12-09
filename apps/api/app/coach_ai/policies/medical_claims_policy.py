"""Medical claims policy."""

from __future__ import annotations

import re

from app.coach_ai.policies.base import (
    BasePolicy,
    PolicyAction,
    PolicyResult,
    PolicySeverity,
    UserContext,
)

# Keywords that indicate medical claims or diagnoses
MEDICAL_KEYWORDS = [
    "diagnose",
    "diagnosis",
    "prescribe",
    "prescription",
    "medication",
    "medicine",
    "disease",
    "disorder",
    "syndrome",
    "condition",
    "treatment",
    "cure",
    "heal",
]

# Patterns for medical questions/requests
MEDICAL_PATTERNS = [
    r"do\s+i\s+have\s+(?:\w+\s+)?(?:diabetes|anorexia|bulimia|thyroid|hormone)",
    r"should\s+i\s+(?:take|stop|change)\s+(?:my\s+)?(?:medication|medicine|prescription)",
    r"(?:what|which)\s+(?:medication|medicine|drug)\s+should",
    r"is\s+(?:this|it)\s+(?:\w+\s+)?(?:safe|dangerous)\s+(?:to|for)",
]

# Medical conditions we should not advise on
MEDICAL_CONDITIONS = [
    "diabetes",
    "thyroid",
    "hormone",
    "pcos",
    "insulin resistance",
    "heart disease",
    "hypertension",
    "high blood pressure",
    "kidney disease",
    "liver disease",
    "cancer",
    "pregnancy",
    "pregnant",
    "breastfeeding",
    "nursing",
]


class MedicalClaimsPolicy(BasePolicy):
    """Policy for detecting and refusing medical claims."""

    name = "medical_claims_policy"
    description = "Prevents medical diagnoses and ensures appropriate disclaimers"
    severity = PolicySeverity.BLOCKED

    def check_input(self, user_input: str, _context: UserContext) -> PolicyResult:
        """Check if user is requesting medical advice."""
        input_lower = user_input.lower()

        # Check for medical patterns
        for pattern in MEDICAL_PATTERNS:
            if re.search(pattern, input_lower):
                return self._create_medical_referral_response()

        # Check for medical conditions
        for condition in MEDICAL_CONDITIONS:
            # Allow general questions but flag for disclaimer
            if condition in input_lower and (
                "?" in user_input
                or any(q in input_lower for q in ["what should", "how should", "can i", "should i"])
            ):
                return PolicyResult(
                    passed=True,
                    action=PolicyAction.ALLOW,
                    disclaimer=self._get_medical_disclaimer(),
                )

        return PolicyResult(passed=True, action=PolicyAction.ALLOW)

    def check_output(self, llm_output: str, _context: UserContext) -> PolicyResult:
        """Check if LLM output makes medical claims."""
        output_lower = llm_output.lower()

        # Check for diagnostic language
        diagnostic_patterns = [
            r"you\s+(?:have|may\s+have|might\s+have|probably\s+have)\s+(?:\w+\s+)?(?:diabetes|disorder|disease|condition)",
            r"this\s+(?:is|sounds\s+like|could\s+be)\s+(?:\w+\s+)?(?:diabetes|disorder|disease|condition)",
            r"i\s+(?:diagnose|recommend)\s+(?:you|that\s+you)",
        ]

        for pattern in diagnostic_patterns:
            if re.search(pattern, output_lower):
                return PolicyResult(
                    passed=False,
                    action=PolicyAction.BLOCK,
                    severity=PolicySeverity.BLOCKED,
                    violation_type="medical_diagnosis",
                    message=(
                        "I'm not able to provide medical diagnoses or advice. "
                        "For health concerns, please consult with a healthcare provider "
                        "who can properly evaluate your situation."
                    ),
                )

        # Check if discussing medical conditions - add disclaimer
        for condition in MEDICAL_CONDITIONS:
            if condition in output_lower:
                return PolicyResult(
                    passed=True,
                    action=PolicyAction.MODIFY,
                    disclaimer=self._get_medical_disclaimer(),
                )

        return PolicyResult(passed=True, action=PolicyAction.ALLOW)

    def _create_medical_referral_response(self) -> PolicyResult:
        """Create a response that refers to medical professionals."""
        message = (
            "I'm a fitness coach, not a medical professional. For questions about medical "
            "conditions, medications, or health diagnoses, please consult with:\n\n"
            "- Your primary care physician\n"
            "- A registered dietitian (RD)\n"
            "- An endocrinologist (for hormone-related questions)\n"
            "- A mental health professional (for eating-related concerns)\n\n"
            "I'm happy to help with general fitness and nutrition guidance once you've "
            "gotten medical clearance!"
        )

        return PolicyResult(
            passed=False,
            action=PolicyAction.FLAG,
            severity=PolicySeverity.WARNING,
            violation_type="medical_request",
            message=message,
        )

    def _get_medical_disclaimer(self) -> str:
        """Get standard medical disclaimer."""
        return (
            "\n\n**Disclaimer:** This is general fitness information and not medical advice. "
            "Please consult with a healthcare provider for personalized medical guidance, "
            "especially if you have any health conditions."
        )
