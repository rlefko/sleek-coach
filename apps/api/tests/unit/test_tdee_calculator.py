"""Tests for TDEE and macro calculations."""


from app.nutrition.calculator import (
    ACTIVITY_MULTIPLIERS,
    MIN_CALORIES_FEMALE,
    MIN_CALORIES_MALE,
    calculate_bmr,
    calculate_calories_from_macros,
    calculate_macro_targets,
    calculate_tdee,
)


class TestCalculateBMR:
    """Tests for BMR calculation."""

    def test_calculate_bmr_male(self) -> None:
        """Test BMR calculation for male."""
        # 80kg, 180cm, 30 years old, male
        # BMR = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
        bmr = calculate_bmr(weight_kg=80, height_cm=180, age=30, sex="male")
        assert bmr == 1780

    def test_calculate_bmr_female(self) -> None:
        """Test BMR calculation for female."""
        # 60kg, 165cm, 25 years old, female
        # BMR = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
        bmr = calculate_bmr(weight_kg=60, height_cm=165, age=25, sex="female")
        assert bmr == 1345.25

    def test_calculate_bmr_case_insensitive(self) -> None:
        """Test that sex parameter is case insensitive."""
        bmr_lower = calculate_bmr(weight_kg=70, height_cm=175, age=30, sex="male")
        bmr_upper = calculate_bmr(weight_kg=70, height_cm=175, age=30, sex="MALE")
        assert bmr_lower == bmr_upper


class TestCalculateTDEE:
    """Tests for TDEE calculation."""

    def test_calculate_tdee_sedentary(self) -> None:
        """Test TDEE calculation for sedentary activity."""
        bmr = 1800
        tdee = calculate_tdee(bmr, "sedentary")
        assert tdee == 1800 * 1.2

    def test_calculate_tdee_light(self) -> None:
        """Test TDEE calculation for light activity."""
        bmr = 1800
        tdee = calculate_tdee(bmr, "light")
        assert tdee == 1800 * 1.375

    def test_calculate_tdee_moderate(self) -> None:
        """Test TDEE calculation for moderate activity."""
        bmr = 1800
        tdee = calculate_tdee(bmr, "moderate")
        assert tdee == 1800 * 1.55

    def test_calculate_tdee_active(self) -> None:
        """Test TDEE calculation for active."""
        bmr = 1800
        tdee = calculate_tdee(bmr, "active")
        assert tdee == 1800 * 1.725

    def test_calculate_tdee_very_active(self) -> None:
        """Test TDEE calculation for very active."""
        bmr = 1800
        tdee = calculate_tdee(bmr, "very_active")
        assert tdee == 1800 * 1.9

    def test_calculate_tdee_unknown_defaults_to_sedentary(self) -> None:
        """Test that unknown activity level defaults to sedentary."""
        bmr = 1800
        tdee = calculate_tdee(bmr, "unknown")
        assert tdee == 1800 * ACTIVITY_MULTIPLIERS["sedentary"]

    def test_calculate_tdee_case_insensitive(self) -> None:
        """Test that activity level is case insensitive."""
        bmr = 1800
        tdee_lower = calculate_tdee(bmr, "moderate")
        tdee_upper = calculate_tdee(bmr, "MODERATE")
        assert tdee_lower == tdee_upper


class TestCalculateMacroTargets:
    """Tests for macro target calculations."""

    def test_fat_loss_targets(self) -> None:
        """Test macro targets for fat loss goal."""
        targets = calculate_macro_targets(
            tdee=2500,
            weight_kg=80,
            goal_type="fat_loss",
            pace="moderate",
            sex="male",
        )
        # Should have a deficit
        assert targets.deficit_surplus < 0
        assert targets.target_calories < 2500
        # Protein should be high for muscle preservation
        assert targets.protein_g >= 150  # ~1g/lb for 80kg person

    def test_muscle_gain_targets(self) -> None:
        """Test macro targets for muscle gain goal."""
        targets = calculate_macro_targets(
            tdee=2500,
            weight_kg=80,
            goal_type="muscle_gain",
            pace="moderate",
            sex="male",
        )
        # Should have a surplus
        assert targets.deficit_surplus > 0
        assert targets.target_calories > 2500

    def test_maintenance_targets(self) -> None:
        """Test macro targets for maintenance goal."""
        targets = calculate_macro_targets(
            tdee=2500,
            weight_kg=80,
            goal_type="maintenance",
            pace="moderate",
            sex="male",
        )
        # Should be around TDEE
        assert targets.deficit_surplus == 0
        assert targets.target_calories == 2500

    def test_recomp_targets(self) -> None:
        """Test macro targets for recomp goal."""
        targets = calculate_macro_targets(
            tdee=2500,
            weight_kg=80,
            goal_type="recomp",
            pace="moderate",
            sex="male",
        )
        # Should be at TDEE
        assert targets.deficit_surplus == 0

    def test_safety_minimum_calories_male(self) -> None:
        """Test that minimum calorie safety is enforced for males."""
        # Very low TDEE that would result in below minimum
        targets = calculate_macro_targets(
            tdee=1600,
            weight_kg=60,
            goal_type="fat_loss",
            pace="aggressive",
            sex="male",
        )
        assert targets.target_calories >= MIN_CALORIES_MALE
        assert len(targets.warnings) > 0  # Should have a warning

    def test_safety_minimum_calories_female(self) -> None:
        """Test that minimum calorie safety is enforced for females."""
        targets = calculate_macro_targets(
            tdee=1400,
            weight_kg=50,
            goal_type="fat_loss",
            pace="aggressive",
            sex="female",
        )
        assert targets.target_calories >= MIN_CALORIES_FEMALE

    def test_pace_slow(self) -> None:
        """Test that slow pace results in smaller deficit."""
        targets_slow = calculate_macro_targets(
            tdee=2500,
            weight_kg=80,
            goal_type="fat_loss",
            pace="slow",
            sex="male",
        )
        targets_aggressive = calculate_macro_targets(
            tdee=2500,
            weight_kg=80,
            goal_type="fat_loss",
            pace="aggressive",
            sex="male",
        )
        # Slow should have smaller deficit (less negative)
        assert targets_slow.deficit_surplus > targets_aggressive.deficit_surplus

    def test_fat_minimum_enforced(self) -> None:
        """Test that minimum fat intake (50g) is enforced."""
        targets = calculate_macro_targets(
            tdee=1500,
            weight_kg=50,
            goal_type="maintenance",
            sex="female",
        )
        assert targets.fat_g >= 50

    def test_carbs_non_negative(self) -> None:
        """Test that carbs are never negative."""
        targets = calculate_macro_targets(
            tdee=1200,
            weight_kg=100,  # High weight = high protein
            goal_type="fat_loss",
            sex="female",
        )
        assert targets.carbs_g >= 0


class TestCalculateCaloriesFromMacros:
    """Tests for calorie calculation from macros."""

    def test_full_macros(self) -> None:
        """Test calorie calculation with all macros provided."""
        # 150g protein (600 cal) + 200g carbs (800 cal) + 70g fat (630 cal) = 2030
        calories = calculate_calories_from_macros(
            protein_g=150,
            carbs_g=200,
            fat_g=70,
        )
        assert calories == 2030

    def test_partial_macros(self) -> None:
        """Test calorie calculation with some macros missing."""
        # 100g protein (400 cal) + 0 carbs + 50g fat (450 cal) = 850
        calories = calculate_calories_from_macros(
            protein_g=100,
            carbs_g=None,
            fat_g=50,
        )
        assert calories == 850

    def test_all_none_returns_none(self) -> None:
        """Test that all None values returns None."""
        calories = calculate_calories_from_macros(
            protein_g=None,
            carbs_g=None,
            fat_g=None,
        )
        assert calories is None

    def test_zero_values(self) -> None:
        """Test calorie calculation with zero values."""
        calories = calculate_calories_from_macros(
            protein_g=0,
            carbs_g=0,
            fat_g=0,
        )
        assert calories == 0
