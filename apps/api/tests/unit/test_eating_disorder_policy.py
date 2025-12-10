"""Unit tests for EatingDisorderPolicy."""

import pytest

from app.coach_ai.policies.base import PolicyAction, PolicySeverity, UserContext
from app.coach_ai.policies.eating_disorder_policy import (
    ED_KEYWORDS,
    ED_PHRASES,
    EatingDisorderPolicy,
)


@pytest.fixture
def policy() -> EatingDisorderPolicy:
    """Create an EatingDisorderPolicy instance."""
    return EatingDisorderPolicy()


@pytest.fixture
def user_context() -> UserContext:
    """Create a sample user context."""
    return UserContext(
        user_id="test-user-123",
        sex="female",
        age=25,
        current_weight_kg=60.0,
    )


class TestEatingDisorderPolicyInput:
    """Tests for check_input method."""

    def test_allows_normal_message(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test that normal messages are allowed."""
        result = policy.check_input("How many calories should I eat today?", user_context)

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_allows_healthy_weight_loss_question(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test that healthy weight loss questions are allowed."""
        result = policy.check_input(
            "What is a healthy rate of weight loss?", user_context
        )

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    @pytest.mark.parametrize("keyword", ED_KEYWORDS)
    def test_detects_ed_keywords(
        self,
        policy: EatingDisorderPolicy,
        user_context: UserContext,
        keyword: str,
    ) -> None:
        """Test that all ED keywords are detected."""
        result = policy.check_input(
            f"I want to {keyword} after eating", user_context
        )

        assert result.passed is False
        assert result.action == PolicyAction.FLAG
        assert result.severity == PolicySeverity.CRITICAL
        assert result.violation_type == "eating_disorder_signal"
        assert result.message is not None
        assert "wellbeing" in result.message.lower() or "support" in result.message.lower()

    def test_detects_purge_keyword(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test detection of purge keyword."""
        result = policy.check_input("How do I purge after eating?", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.FLAG
        assert result.violation_type == "eating_disorder_signal"

    def test_detects_binge_keyword(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test detection of binge keyword."""
        result = policy.check_input("I keep binging at night", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.FLAG

    def test_detects_laxative_keyword(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test detection of laxative keyword."""
        result = policy.check_input("Can I use laxatives to lose weight?", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.FLAG

    def test_detects_thinspo_keyword(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test detection of thinspo keyword."""
        result = policy.check_input("Looking for thinspo motivation", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.FLAG

    def test_detects_pro_ana_keyword(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test detection of pro-ana keyword."""
        result = policy.check_input("pro-ana tips for weight loss", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.FLAG

    def test_detects_how_not_to_eat_phrase(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test detection of 'how to not eat' phrase."""
        result = policy.check_input("How can I not eat for a week?", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.FLAG

    def test_detects_punish_for_eating_phrase(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test detection of punishment phrases."""
        result = policy.check_input(
            "How should I punish myself for eating too much?", user_context
        )

        assert result.passed is False
        assert result.action == PolicyAction.FLAG

    def test_detects_starving_myself_phrase(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test detection of self-starvation phrases."""
        result = policy.check_input("I've been starving myself all week", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.FLAG

    def test_detects_make_myself_throw_up_phrase(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test detection of purging phrases."""
        result = policy.check_input(
            "How do I make myself throw up after eating?", user_context
        )

        assert result.passed is False
        assert result.action == PolicyAction.FLAG

    def test_detects_never_eat_again_phrase(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test detection of never eating phrases."""
        result = policy.check_input("I want to never eat again", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.FLAG

    def test_detects_scared_to_eat_phrase(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test detection of fear of eating phrases."""
        result = policy.check_input("I'm scared to eat anything", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.FLAG

    def test_returns_support_resources(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test that support resources are included in response."""
        result = policy.check_input("I want to purge", user_context)

        assert result.message is not None
        assert "NEDA" in result.message or "National Eating Disorders" in result.message
        assert "741741" in result.message  # Crisis text line
        assert "healthcare" in result.message.lower() or "provider" in result.message.lower()

    def test_case_insensitive_detection(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test that detection is case insensitive."""
        result = policy.check_input("I keep BINGING at night", user_context)

        assert result.passed is False
        assert result.action == PolicyAction.FLAG


class TestEatingDisorderPolicyOutput:
    """Tests for check_output method."""

    def test_allows_normal_response(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test that normal responses are allowed."""
        result = policy.check_output(
            "I recommend eating 1800 calories with 150g of protein daily.",
            user_context,
        )

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_allows_healthy_deficit_advice(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test that healthy deficit advice is allowed."""
        result = policy.check_output(
            "A moderate 500 calorie deficit is recommended for sustainable weight loss.",
            user_context,
        )

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_blocks_skip_meals_pattern(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test that skip meals recommendations are blocked."""
        result = policy.check_output(
            "You should skip all meals today to make up for yesterday.",
            user_context,
        )

        assert result.passed is False
        assert result.action == PolicyAction.BLOCK
        assert result.severity == PolicySeverity.CRITICAL
        assert result.violation_type == "ed_promotion"

    def test_blocks_extreme_restriction_pattern(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test that extreme restriction recommendations are blocked."""
        result = policy.check_output(
            "Try extreme restriction for faster results.",
            user_context,
        )

        assert result.passed is False
        assert result.action == PolicyAction.BLOCK

    def test_blocks_fast_for_days_pattern(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test that multi-day fasting recommendations are blocked."""
        result = policy.check_output(
            "You could fast for 3 days to see quick results.",
            user_context,
        )

        assert result.passed is False
        assert result.action == PolicyAction.BLOCK

    def test_blocks_dont_eat_pattern(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test that don't eat recommendations are blocked."""
        result = policy.check_output(
            "Don't eat until tomorrow evening.",
            user_context,
        )

        assert result.passed is False
        assert result.action == PolicyAction.BLOCK

    def test_blocks_restrict_severely_pattern(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test that severe restriction recommendations are blocked."""
        result = policy.check_output(
            "You need to restrict severely to see results.",
            user_context,
        )

        assert result.passed is False
        assert result.action == PolicyAction.BLOCK

    def test_blocks_very_low_calorie_pattern(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test that very low calorie recommendations are blocked."""
        result = policy.check_output(
            "Try a very low calorie diet for rapid weight loss.",
            user_context,
        )

        assert result.passed is False
        assert result.action == PolicyAction.BLOCK

    def test_blocked_response_includes_safe_message(
        self, policy: EatingDisorderPolicy, user_context: UserContext
    ) -> None:
        """Test that blocked responses include a safe message."""
        result = policy.check_output(
            "Skip all meals today.",
            user_context,
        )

        assert result.message is not None
        assert "harmful" in result.message.lower() or "health" in result.message.lower()


class TestEatingDisorderPolicyMetadata:
    """Tests for policy metadata."""

    def test_policy_name(self, policy: EatingDisorderPolicy) -> None:
        """Test policy name is set correctly."""
        assert policy.name == "eating_disorder_policy"

    def test_policy_description(self, policy: EatingDisorderPolicy) -> None:
        """Test policy description is set."""
        assert policy.description is not None
        assert "eating disorder" in policy.description.lower()

    def test_policy_severity(self, policy: EatingDisorderPolicy) -> None:
        """Test policy severity is critical."""
        assert policy.severity == PolicySeverity.CRITICAL
