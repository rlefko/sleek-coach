"""Base policy class for safety policies."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum


class PolicySeverity(str, Enum):
    """Severity of policy violation."""

    INFO = "info"
    WARNING = "warning"
    BLOCKED = "blocked"
    CRITICAL = "critical"


class PolicyAction(str, Enum):
    """Action to take on policy violation."""

    ALLOW = "allow"
    MODIFY = "modify"
    BLOCK = "block"
    FLAG = "flag"


@dataclass
class PolicyResult:
    """Result from policy check."""

    passed: bool
    action: PolicyAction
    severity: PolicySeverity | None = None
    violation_type: str | None = None
    message: str | None = None
    modified_content: str | None = None
    disclaimer: str | None = None


@dataclass
class UserContext:
    """User context for policy evaluation."""

    user_id: str
    sex: str | None = None
    age: int | None = None
    current_weight_kg: float | None = None
    goal_type: str | None = None
    target_calories: int | None = None
    target_weight_kg: float | None = None


class BasePolicy(ABC):
    """Abstract base class for safety policies."""

    name: str
    description: str
    severity: PolicySeverity

    @abstractmethod
    def check_input(self, user_input: str, context: UserContext) -> PolicyResult:
        """Check user input against policy.

        Args:
            user_input: The user's message.
            context: User context for evaluation.

        Returns:
            PolicyResult indicating if the check passed and any actions to take.
        """
        pass

    @abstractmethod
    def check_output(self, llm_output: str, context: UserContext) -> PolicyResult:
        """Check LLM output against policy.

        Args:
            llm_output: The LLM's response.
            context: User context for evaluation.

        Returns:
            PolicyResult indicating if the check passed and any actions to take.
        """
        pass
