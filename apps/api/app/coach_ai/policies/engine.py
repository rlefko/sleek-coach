"""Safety policy engine for AI Coach."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

import structlog

from app.coach_ai.models import AIPolicyViolationLog, PolicyViolationType
from app.coach_ai.policies.base import BasePolicy, PolicyAction, PolicyResult, UserContext
from app.coach_ai.policies.calorie_policy import CaloriePolicy
from app.coach_ai.policies.eating_disorder_policy import EatingDisorderPolicy
from app.coach_ai.policies.medical_claims_policy import MedicalClaimsPolicy
from app.coach_ai.policies.weight_loss_policy import WeightLossPolicy

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger()


class SafetyPolicyEngine:
    """Coordinates all safety policies."""

    def __init__(self, session: AsyncSession | None = None) -> None:
        """Initialize the policy engine.

        Args:
            session: Database session for logging violations.
        """
        self.session = session
        self._policies: list[BasePolicy] = [
            EatingDisorderPolicy(),  # Check first - most critical
            CaloriePolicy(),
            WeightLossPolicy(),
            MedicalClaimsPolicy(),
        ]

    async def check_input(self, user_input: str, context: UserContext) -> PolicyResult:
        """Check user input against all policies.

        Args:
            user_input: The user's message.
            context: User context for evaluation.

        Returns:
            PolicyResult with aggregated results.
        """
        for policy in self._policies:
            result = policy.check_input(user_input, context)
            if not result.passed:
                await self._log_violation(result, context, user_input, is_input=True)

                # If blocked or flagged with a message, return immediately
                if result.action in (PolicyAction.BLOCK, PolicyAction.FLAG) and result.message:
                    return result

        return PolicyResult(passed=True, action=PolicyAction.ALLOW)

    async def check_output(
        self,
        llm_output: str,
        context: UserContext,
    ) -> PolicyResult:
        """Check LLM output against all policies.

        Args:
            llm_output: The LLM's response.
            context: User context for evaluation.

        Returns:
            PolicyResult with potentially modified content and disclaimers.
        """
        modified_output = llm_output
        disclaimers: list[str] = []

        for policy in self._policies:
            result = policy.check_output(modified_output, context)

            if not result.passed:
                await self._log_violation(result, context, modified_output, is_input=False)

                if result.action == PolicyAction.BLOCK:
                    return result

                if result.action == PolicyAction.MODIFY and result.modified_content:
                    modified_output = result.modified_content

            if result.disclaimer:
                disclaimers.append(result.disclaimer)

        # Inject disclaimers if any
        if disclaimers:
            # Deduplicate disclaimers
            unique_disclaimers = list(dict.fromkeys(disclaimers))
            disclaimer_text = "\n".join(unique_disclaimers)
            modified_output = modified_output + disclaimer_text

        return PolicyResult(
            passed=True,
            action=PolicyAction.ALLOW,
            modified_content=modified_output if modified_output != llm_output else None,
        )

    async def _log_violation(
        self,
        result: PolicyResult,
        context: UserContext,
        content: str,
        is_input: bool,
    ) -> None:
        """Log policy violation to database.

        Args:
            result: The policy result.
            context: User context.
            content: The content that triggered the violation.
            is_input: Whether this was an input or output violation.
        """
        logger.warning(
            "policy_violation",
            violation_type=result.violation_type,
            severity=result.severity.value if result.severity else None,
            action=result.action.value,
            user_id=context.user_id,
            is_input=is_input,
        )

        # Store in database if session available
        if self.session and result.violation_type:
            try:
                # Map violation type string to enum
                violation_type_map = {
                    "calorie_minimum": PolicyViolationType.CALORIE_MINIMUM,
                    "calorie_minimum_request": PolicyViolationType.CALORIE_MINIMUM,
                    "calorie_maximum": PolicyViolationType.CALORIE_MAXIMUM,
                    "rapid_weight_loss_request": PolicyViolationType.WEIGHT_LOSS_RATE,
                    "rapid_weight_loss_recommendation": PolicyViolationType.WEIGHT_LOSS_RATE,
                    "eating_disorder_signal": PolicyViolationType.EATING_DISORDER_SIGNAL,
                    "ed_promotion": PolicyViolationType.EATING_DISORDER_SIGNAL,
                    "medical_request": PolicyViolationType.MEDICAL_CLAIM,
                    "medical_diagnosis": PolicyViolationType.MEDICAL_CLAIM,
                }

                violation_type_enum = violation_type_map.get(
                    result.violation_type, PolicyViolationType.UNSAFE_CONTENT
                )

                log_entry = AIPolicyViolationLog(
                    user_id=uuid.UUID(context.user_id),
                    violation_type=violation_type_enum,
                    severity=result.severity.value if result.severity else "warning",
                    trigger_content=content[:500] if content else None,  # Truncate
                    action_taken=result.action.value,
                    details={
                        "is_input": is_input,
                        "original_violation_type": result.violation_type,
                    },
                )
                self.session.add(log_entry)
                # Don't commit here - let the calling code handle the transaction

            except Exception:
                logger.exception("failed_to_log_violation")
