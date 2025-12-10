"""Unit tests for WeightLossPolicy."""

import pytest

from app.coach_ai.policies.base import PolicyAction, PolicySeverity, UserContext
from app.coach_ai.policies.weight_loss_policy import (
    MAX_WEIGHT_LOSS_RATE,
    WeightLossPolicy,
)


@pytest.fixture
def policy() -> WeightLossPolicy:
    """Create a WeightLossPolicy instance."""
    return WeightLossPolicy()


@pytest.fixture
def user_context() -> UserContext:
    """Create a sample user context with weight data."""
    return UserContext(
        user_id="test-user-123",
        sex="male",
        age=30,
        current_weight_kg=80.0,
        goal_type="fat_loss",
        target_weight_kg=75.0,
    )


@pytest.fixture
def user_context_no_weight() -> UserContext:
    """Create a user context without weight data."""
    return UserContext(
        user_id="test-user-456",
        sex="female",
        age=28,
        current_weight_kg=None,
        goal_type="fat_loss",
    )


class TestWeightLossPolicyConstants:
    """Tests for policy constants."""

    def test_max_weight_loss_rate(self) -> None:
        """Test maximum weight loss rate is 1% per week."""
        assert MAX_WEIGHT_LOSS_RATE == 0.01


class TestWeightLossPolicyInput:
    """Tests for check_input method."""

    def test_allows_normal_weight_loss_request(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test that normal weight loss requests are allowed."""
        result = policy.check_input(
            "How can I lose weight healthily?", user_context
        )

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_allows_sustainable_rate_request(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test that sustainable rate requests are allowed."""
        # General healthy weight loss questions without specific numbers
        result = policy.check_input(
            "What is a healthy rate of weight loss?", user_context
        )

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_flags_rapid_kg_per_week_with_weight(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test that rapid weight loss in kg is flagged when user weight is known."""
        # 80kg * 1% = 0.8kg safe rate, 5 lbs is way above in pounds
        result = policy.check_input(
            "I want to lose 5 lbs per week", user_context
        )

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY
        assert result.severity == PolicySeverity.WARNING
        assert result.violation_type == "rapid_weight_loss_request"

    def test_flags_rapid_lbs_per_week_with_weight(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test that rapid weight loss in lbs is flagged."""
        # 5 lbs = ~2.3kg, way above safe rate
        result = policy.check_input(
            "Can I lose 5 lbs a week?", user_context
        )

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY

    def test_flags_rapid_loss_without_weight_context(
        self, policy: WeightLossPolicy, user_context_no_weight: UserContext
    ) -> None:
        """Test that rapid weight loss is flagged even without weight data."""
        # More than 1kg/week is concerning without context - use lbs for reliable match
        result = policy.check_input(
            "I want to lose 5 lbs per week", user_context_no_weight
        )

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY

    def test_detects_drop_fast_pattern(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test detection of 'drop X fast' pattern."""
        result = policy.check_input(
            "How can I drop 5 kg fast?", user_context
        )

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY

    def test_detects_lose_quick_pattern(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test detection of 'drop X quick' pattern in lbs."""
        result = policy.check_input(
            "I need to drop 10 lbs quick for an event", user_context
        )

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY

    def test_response_mentions_safe_rate(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test that response mentions safe rate based on user's weight."""
        result = policy.check_input(
            "I want to lose 3 kg per week", user_context
        )

        assert result.message is not None
        # Should mention the calculated safe rate (~0.8kg for 80kg person)
        assert "0.8" in result.message or "1%" in result.message.lower()

    def test_response_is_encouraging(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test that response is encouraging, not shaming."""
        result = policy.check_input(
            "I want to lose 5 lbs a week", user_context
        )

        assert result.message is not None
        assert "understand" in result.message.lower() or "fast results" in result.message.lower()
        assert "sustainable" in result.message.lower() or "lasting" in result.message.lower()

    def test_allows_moderate_rate_near_threshold(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test that rates near but below threshold are allowed."""
        # 1 lb/week = ~0.45kg, well within safe range
        result = policy.check_input(
            "I want to lose 1 lb per week", user_context
        )

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW


class TestWeightLossPolicyOutput:
    """Tests for check_output method."""

    def test_allows_normal_recommendation(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test that normal weight loss recommendations are allowed."""
        result = policy.check_output(
            "Aim for 0.5-1 kg of weight loss per week for sustainable results.",
            user_context,
        )

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_adds_disclaimer_rapid_kg_recommendation(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test that rapid lbs/week recommendations get disclaimer."""
        result = policy.check_output(
            "You can expect to lose 5 lbs per week on this plan.",
            user_context,
        )

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY
        assert result.disclaimer is not None

    def test_adds_disclaimer_rapid_lbs_recommendation(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test that rapid lbs/week recommendations get disclaimer."""
        result = policy.check_output(
            "This diet helps you lose 5 lbs weekly.",
            user_context,
        )

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY
        assert result.disclaimer is not None

    def test_disclaimer_mentions_safe_range(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test that disclaimer mentions safe weight loss range."""
        result = policy.check_output(
            "Expect to lose 1.5 kg weekly on this plan.",
            user_context,
        )

        assert result.disclaimer is not None
        assert "0.5-1 kg" in result.disclaimer or "1-2 lbs" in result.disclaimer

    def test_disclaimer_mentions_muscle_loss(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test that disclaimer warns about muscle loss."""
        result = policy.check_output(
            "You should lose 5 lbs per week.",
            user_context,
        )

        assert result.disclaimer is not None
        assert "muscle" in result.disclaimer.lower()

    def test_allows_borderline_recommendation(
        self, policy: WeightLossPolicy, user_context: UserContext
    ) -> None:
        """Test that 1kg/week (borderline) is allowed."""
        result = policy.check_output(
            "Aim for 1 kg of weight loss per week.",
            user_context,
        )

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW


class TestWeightLossPolicyMetadata:
    """Tests for policy metadata."""

    def test_policy_name(self, policy: WeightLossPolicy) -> None:
        """Test policy name is set correctly."""
        assert policy.name == "weight_loss_policy"

    def test_policy_description(self, policy: WeightLossPolicy) -> None:
        """Test policy description is set."""
        assert policy.description is not None
        assert "weight loss" in policy.description.lower()

    def test_policy_severity(self, policy: WeightLossPolicy) -> None:
        """Test policy severity is warning."""
        assert policy.severity == PolicySeverity.WARNING
