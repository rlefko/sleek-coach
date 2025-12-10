"""Unit tests for CaloriePolicy."""

import pytest

from app.coach_ai.policies.base import PolicyAction, PolicySeverity, UserContext
from app.coach_ai.policies.calorie_policy import (
    MAX_DEFICIT,
    MIN_CALORIES_FEMALE,
    MIN_CALORIES_MALE,
    CaloriePolicy,
)


@pytest.fixture
def policy() -> CaloriePolicy:
    """Create a CaloriePolicy instance."""
    return CaloriePolicy()


@pytest.fixture
def male_context() -> UserContext:
    """Create a male user context."""
    return UserContext(
        user_id="test-user-male",
        sex="male",
        age=30,
        current_weight_kg=80.0,
        target_calories=2000,
    )


@pytest.fixture
def female_context() -> UserContext:
    """Create a female user context."""
    return UserContext(
        user_id="test-user-female",
        sex="female",
        age=28,
        current_weight_kg=65.0,
        target_calories=1600,
    )


class TestCaloriePolicyConstants:
    """Tests for policy constants."""

    def test_min_calories_female(self) -> None:
        """Test minimum calories for females."""
        assert MIN_CALORIES_FEMALE == 1200

    def test_min_calories_male(self) -> None:
        """Test minimum calories for males."""
        assert MIN_CALORIES_MALE == 1500

    def test_max_deficit(self) -> None:
        """Test maximum deficit."""
        assert MAX_DEFICIT == 1000


class TestCaloriePolicyInput:
    """Tests for check_input method."""

    def test_allows_normal_calorie_request(
        self, policy: CaloriePolicy, male_context: UserContext
    ) -> None:
        """Test that normal calorie requests are allowed."""
        result = policy.check_input("I want to eat about 1800 calories a day", male_context)

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_allows_high_calorie_request(
        self, policy: CaloriePolicy, male_context: UserContext
    ) -> None:
        """Test that high calorie requests are allowed."""
        result = policy.check_input("Can I eat 2500 calories?", male_context)

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_blocks_extremely_low_male_calories(
        self, policy: CaloriePolicy, male_context: UserContext
    ) -> None:
        """Test that extremely low calorie requests for males are blocked."""
        result = policy.check_input("I want to eat only 1000 calories", male_context)

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY
        assert result.severity == PolicySeverity.WARNING
        assert result.violation_type == "calorie_minimum_request"
        assert "1500" in result.message  # Male minimum

    def test_blocks_extremely_low_female_calories(
        self, policy: CaloriePolicy, female_context: UserContext
    ) -> None:
        """Test that extremely low calorie requests for females are blocked."""
        result = policy.check_input("I want to eat only 1000 calories", female_context)

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY
        assert "1200" in result.message  # Female minimum

    def test_detects_under_pattern(self, policy: CaloriePolicy, male_context: UserContext) -> None:
        """Test detection of 'under X calories' pattern."""
        result = policy.check_input("Can I eat under 1200 calories?", male_context)

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY

    def test_detects_only_pattern(self, policy: CaloriePolicy, female_context: UserContext) -> None:
        """Test detection of 'only X calories' pattern."""
        result = policy.check_input("I only want 800 calories a day", female_context)

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY

    def test_detects_less_than_pattern(
        self, policy: CaloriePolicy, male_context: UserContext
    ) -> None:
        """Test detection of 'less than X calories' pattern."""
        result = policy.check_input("Can I eat less than 1400 calories?", male_context)

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY

    def test_allows_female_at_minimum(
        self, policy: CaloriePolicy, female_context: UserContext
    ) -> None:
        """Test that female minimum (1200) is allowed."""
        result = policy.check_input("I want to eat 1200 calories", female_context)

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_allows_male_at_minimum(self, policy: CaloriePolicy, male_context: UserContext) -> None:
        """Test that male minimum (1500) is allowed."""
        result = policy.check_input("I want to eat 1500 calories", male_context)

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_detects_two_digit_calories(
        self, policy: CaloriePolicy, female_context: UserContext
    ) -> None:
        """Test detection of unreasonably low 2-digit calorie numbers."""
        result = policy.check_input("I'll eat 50 calories today", female_context)

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY

    def test_response_message_is_supportive(
        self, policy: CaloriePolicy, male_context: UserContext
    ) -> None:
        """Test that the response message is supportive, not shaming."""
        result = policy.check_input("I want to eat only 1000 calories", male_context)

        assert result.message is not None
        assert "motivated" in result.message.lower() or "understand" in result.message.lower()
        assert "sustainable" in result.message.lower() or "safely" in result.message.lower()


class TestCaloriePolicyOutput:
    """Tests for check_output method."""

    def test_allows_normal_recommendation(
        self, policy: CaloriePolicy, male_context: UserContext
    ) -> None:
        """Test that normal calorie recommendations are allowed."""
        result = policy.check_output(
            "I recommend eating around 1800 calories per day.", male_context
        )

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW

    def test_adds_disclaimer_low_female_recommendation(
        self, policy: CaloriePolicy, female_context: UserContext
    ) -> None:
        """Test that low calorie recommendations for females get disclaimer."""
        result = policy.check_output(
            "Try eating around 1100 calories for faster results.", female_context
        )

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY
        assert result.disclaimer is not None
        assert "1200" in result.disclaimer

    def test_adds_disclaimer_low_male_recommendation(
        self, policy: CaloriePolicy, male_context: UserContext
    ) -> None:
        """Test that low calorie recommendations for males get disclaimer."""
        result = policy.check_output("Aim for 1400 calories to speed up weight loss.", male_context)

        assert result.passed is False
        assert result.action == PolicyAction.MODIFY
        assert result.disclaimer is not None
        assert "1500" in result.disclaimer

    def test_detects_eat_around_pattern(
        self, policy: CaloriePolicy, male_context: UserContext
    ) -> None:
        """Test detection of 'eat around X' pattern."""
        result = policy.check_output("You should eat around 1200 calories daily.", male_context)

        assert result.passed is False
        assert result.disclaimer is not None

    def test_detects_target_pattern(
        self, policy: CaloriePolicy, female_context: UserContext
    ) -> None:
        """Test detection of 'target of X' pattern."""
        result = policy.check_output("Set a target of 1000 calories per day.", female_context)

        assert result.passed is False
        assert result.disclaimer is not None

    def test_detects_aim_for_pattern(
        self, policy: CaloriePolicy, male_context: UserContext
    ) -> None:
        """Test detection of 'aim for X' pattern."""
        result = policy.check_output("Aim for 1300 calories to maximize fat loss.", male_context)

        assert result.passed is False
        assert result.disclaimer is not None

    def test_disclaimer_includes_medical_advice(
        self, policy: CaloriePolicy, female_context: UserContext
    ) -> None:
        """Test that disclaimer mentions medical consultation."""
        result = policy.check_output("Try eating 1000 calories for a week.", female_context)

        assert result.disclaimer is not None
        assert (
            "healthcare" in result.disclaimer.lower()
            or "medical" in result.disclaimer.lower()
            or "consult" in result.disclaimer.lower()
        )

    def test_allows_calorie_recommendation_above_minimum(
        self, policy: CaloriePolicy, female_context: UserContext
    ) -> None:
        """Test that recommendations above minimum are allowed."""
        result = policy.check_output("I recommend eating 1400 calories per day.", female_context)

        assert result.passed is True
        assert result.action == PolicyAction.ALLOW


class TestCaloriePolicyMetadata:
    """Tests for policy metadata."""

    def test_policy_name(self, policy: CaloriePolicy) -> None:
        """Test policy name is set correctly."""
        assert policy.name == "calorie_policy"

    def test_policy_description(self, policy: CaloriePolicy) -> None:
        """Test policy description is set."""
        assert policy.description is not None
        assert "calorie" in policy.description.lower()

    def test_policy_severity(self, policy: CaloriePolicy) -> None:
        """Test policy severity is blocked."""
        assert policy.severity == PolicySeverity.BLOCKED
