"""Unit tests for MedicalClaimsPolicy."""

import pytest

from app.coach_ai.policies.base import PolicyAction, PolicySeverity, UserContext
from app.coach_ai.policies.medical_claims_policy import (
    MEDICAL_CONDITIONS,
    MEDICAL_KEYWORDS,
    MEDICAL_PATTERNS,
    MedicalClaimsPolicy,
)


@pytest.fixture
def policy() -> MedicalClaimsPolicy:
    """Create a MedicalClaimsPolicy instance."""
    return MedicalClaimsPolicy()


@pytest.fixture
def user_context() -> UserContext:
    """Create a sample user context."""
    return UserContext(
        user_id="test-user-123",
        sex="female",
        age=35,
        current_weight_kg=70.0,
    )


class TestMedicalClaimsPolicyConstants:
    """Tests for policy constants."""

    def test_medical_keywords_exist(self) -> None:
        """Test that medical keywords are defined."""
        assert len(MEDICAL_KEYWORDS) > 0
        assert "diagnose" in MEDICAL_KEYWORDS
        assert "prescription" in MEDICAL_KEYWORDS

    def test_medical_patterns_exist(self) -> None:
        """Test that medical patterns are defined."""
        assert len(MEDICAL_PATTERNS) > 0

    def test_medical_conditions_exist(self) -> None:
        """Test that medical conditions are defined."""
        assert len(MEDICAL_CONDITIONS) > 0
        assert "diabetes" in MEDICAL_CONDITIONS
        assert "pregnancy" in MEDICAL_CONDITIONS


class TestMedicalClaimsPolicyInput:
    """Tests for check_input method."""

    def test_allows_normal_nutrition_question(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that normal nutrition questions are allowed."""
        result = policy.check_input("What should I eat for lunch?", user_context)

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_allows_fitness_question(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that fitness questions are allowed."""
        result = policy.check_input("How often should I exercise?", user_context)

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_flags_diagnosis_request(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that diagnosis requests are flagged."""
        result = policy.check_input("Do I have diabetes based on my symptoms?", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.FLAG
        assert result.violation_type == "medical_request"

    def test_flags_medication_question(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that medication questions are flagged."""
        result = policy.check_input("Should I take medication for my weight?", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.FLAG

    def test_flags_prescription_change_request(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that prescription change requests are flagged."""
        result = policy.check_input("Should I stop my medication to lose weight?", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.FLAG

    def test_referral_response_includes_professionals(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that referral response lists medical professionals."""
        result = policy.check_input("Do I have a thyroid condition?", user_context)

        assert result.message is not None
        assert "physician" in result.message.lower() or "doctor" in result.message.lower()
        assert "dietitian" in result.message.lower()

    def test_adds_disclaimer_for_medical_condition_question(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that questions about medical conditions get disclaimer."""
        result = policy.check_input("Can I still lose weight with diabetes?", user_context)

        # This is a general question, so it's allowed but with disclaimer
        assert result.passed is True
        assert result.action == PolicyAction.ALLOW
        assert result.disclaimer is not None

    def test_adds_disclaimer_for_pregnancy_question(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that pregnancy-related questions get disclaimer."""
        result = policy.check_input("What should I eat while pregnant?", user_context)

        assert result.passed is True
        assert result.disclaimer is not None

    def test_adds_disclaimer_for_thyroid_question(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that thyroid-related questions get disclaimer."""
        result = policy.check_input("How does thyroid affect my weight?", user_context)

        assert result.passed is True
        assert result.disclaimer is not None


class TestMedicalClaimsPolicyOutput:
    """Tests for check_output method."""

    def test_allows_normal_response(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that normal responses are allowed."""
        result = policy.check_output(
            "I recommend eating more protein and vegetables.", user_context
        )

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_blocks_diagnosis_in_output(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that diagnostic statements are blocked."""
        result = policy.check_output("Based on your symptoms, you have diabetes.", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.BLOCK
        assert result.severity == PolicySeverity.BLOCKED
        assert result.violation_type == "medical_diagnosis"

    def test_blocks_may_have_diagnosis(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that 'may have diabetes' diagnoses are blocked."""
        result = policy.check_output("You may have diabetes based on your symptoms.", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.BLOCK

    def test_blocks_sounds_like_diagnosis(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that 'this sounds like a disease' diagnoses are blocked."""
        result = policy.check_output("This sounds like a disease.", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.BLOCK

    def test_blocked_response_includes_referral(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that blocked responses include medical referral."""
        result = policy.check_output("You probably have diabetes.", user_context)

        assert result.message is not None
        assert "healthcare" in result.message.lower() or "medical" in result.message.lower()

    def test_adds_disclaimer_when_mentioning_conditions(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that responses mentioning conditions get disclaimer or block."""
        result = policy.check_output(
            "People with thyroid issues often need to adjust calories.", user_context
        )

        # Medical condition mentioned triggers either disclaimer or block
        assert result.disclaimer is not None or result.action in (
            PolicyAction.MODIFY,
            PolicyAction.BLOCK,
        )

    def test_disclaimer_mentions_consult_provider(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that disclaimer mentions consulting a provider."""
        result = policy.check_output("Thyroid issues can affect metabolism.", user_context)

        assert result.disclaimer is not None
        assert "consult" in result.disclaimer.lower()

    def test_allows_general_health_advice(
        self, policy: MedicalClaimsPolicy, user_context: UserContext
    ) -> None:
        """Test that general health advice without conditions is allowed."""
        result = policy.check_output("Eating more fiber can help with digestion.", user_context)

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW


class TestMedicalClaimsPolicyMetadata:
    """Tests for policy metadata."""

    def test_policy_name(self, policy: MedicalClaimsPolicy) -> None:
        """Test policy name is set correctly."""
        assert policy.name == "medical_claims_policy"

    def test_policy_description(self, policy: MedicalClaimsPolicy) -> None:
        """Test policy description is set."""
        assert policy.description is not None
        assert "medical" in policy.description.lower()

    def test_policy_severity(self, policy: MedicalClaimsPolicy) -> None:
        """Test policy severity is blocked."""
        assert policy.severity == PolicySeverity.BLOCKED
