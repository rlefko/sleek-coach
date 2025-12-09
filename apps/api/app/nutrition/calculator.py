"""TDEE and macro target calculations.

This module provides pure functions for calculating:
- BMR (Basal Metabolic Rate) using Mifflin-St Jeor formula
- TDEE (Total Daily Energy Expenditure)
- Macro targets based on goals

All functions are stateless and have no database dependencies for easy testing.
"""

from dataclasses import dataclass

# Activity level multipliers for TDEE calculation
ACTIVITY_MULTIPLIERS: dict[str, float] = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}

# Safety thresholds from nutrition science guidelines
MIN_CALORIES_FEMALE = 1200
MIN_CALORIES_MALE = 1500
MAX_DEFICIT = 1000
MIN_PROTEIN_G = 80
MIN_FAT_G = 50


@dataclass
class MacroTargets:
    """Calculated macro targets."""

    tdee: int
    bmr: int
    target_calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    deficit_surplus: int
    warnings: list[str]


def calculate_bmr(
    weight_kg: float,
    height_cm: float,
    age: int,
    sex: str,
) -> float:
    """Calculate BMR using Mifflin-St Jeor formula.

    Formula:
        Male: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
        Female: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161

    Args:
        weight_kg: Body weight in kilograms.
        height_cm: Height in centimeters.
        age: Age in years.
        sex: Biological sex ('male' or 'female').

    Returns:
        Basal Metabolic Rate in calories per day.
    """
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    if sex.lower() == "male":
        return base + 5
    else:
        return base - 161


def calculate_tdee(bmr: float, activity_level: str) -> float:
    """Calculate TDEE from BMR and activity level.

    Args:
        bmr: Basal Metabolic Rate.
        activity_level: Activity level key (sedentary, light, moderate, active, very_active).

    Returns:
        Total Daily Energy Expenditure in calories per day.
    """
    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level.lower(), 1.2)
    return bmr * multiplier


def calculate_macro_targets(
    tdee: float,
    weight_kg: float,
    goal_type: str,
    pace: str = "moderate",
    sex: str = "male",
) -> MacroTargets:
    """Calculate macro targets based on goal.

    Args:
        tdee: Total Daily Energy Expenditure.
        weight_kg: Body weight in kilograms.
        goal_type: Goal type (fat_loss, muscle_gain, maintenance, recomp, performance).
        pace: Pace preference (slow, moderate, aggressive).
        sex: Biological sex for minimum calorie calculation.

    Returns:
        MacroTargets dataclass with all calculated values.
    """
    warnings: list[str] = []
    bmr = tdee / 1.55  # Approximate BMR for reference

    # Calculate deficit/surplus based on goal and pace
    deficit_surplus = _get_deficit_surplus(goal_type, pace)
    target_calories = int(tdee + deficit_surplus)

    # Apply safety minimums
    min_calories = MIN_CALORIES_MALE if sex.lower() == "male" else MIN_CALORIES_FEMALE
    if target_calories < min_calories:
        warnings.append(f"Target adjusted to minimum safe level ({min_calories} cal)")
        target_calories = min_calories
        deficit_surplus = target_calories - int(tdee)

    # Check max deficit
    if deficit_surplus < -MAX_DEFICIT:
        warnings.append(f"Deficit limited to maximum safe level ({MAX_DEFICIT} cal)")

    # Protein: varies by goal (g per lb of body weight)
    weight_lb = weight_kg * 2.205
    protein_g = _calculate_protein(weight_lb, goal_type)

    # Ensure minimum protein
    if protein_g < MIN_PROTEIN_G:
        protein_g = MIN_PROTEIN_G
        warnings.append(f"Protein adjusted to minimum safe level ({MIN_PROTEIN_G}g)")

    # Fat: minimum 50g, approximately 25% of calories
    fat_g = max(MIN_FAT_G, int(target_calories * 0.25 / 9))

    # Carbs: remainder of calories
    protein_cal = protein_g * 4
    fat_cal = fat_g * 9
    carbs_g = int((target_calories - protein_cal - fat_cal) / 4)
    carbs_g = max(0, carbs_g)  # Ensure non-negative

    return MacroTargets(
        tdee=int(tdee),
        bmr=int(bmr),
        target_calories=target_calories,
        protein_g=protein_g,
        carbs_g=carbs_g,
        fat_g=fat_g,
        deficit_surplus=deficit_surplus,
        warnings=warnings,
    )


def _get_deficit_surplus(goal_type: str, pace: str) -> int:
    """Get calorie adjustment based on goal and pace.

    Args:
        goal_type: Type of fitness goal.
        pace: Desired pace of change.

    Returns:
        Calorie adjustment (negative for deficit, positive for surplus).
    """
    pace_multipliers = {"slow": 0.5, "moderate": 0.75, "aggressive": 1.0}
    multiplier = pace_multipliers.get(pace.lower(), 0.75)

    if goal_type == "fat_loss":
        base_deficit = -750
        return max(int(base_deficit * multiplier), -MAX_DEFICIT)
    elif goal_type == "muscle_gain":
        base_surplus = 300
        return int(base_surplus * multiplier)
    elif goal_type == "recomp":
        return 0
    elif goal_type == "performance":
        # Slight surplus for performance-focused goals
        return int(200 * multiplier)
    else:  # maintenance
        return 0


def _calculate_protein(weight_lb: float, goal_type: str) -> int:
    """Calculate protein target in grams.

    Args:
        weight_lb: Body weight in pounds.
        goal_type: Type of fitness goal.

    Returns:
        Protein target in grams.
    """
    if goal_type == "muscle_gain":
        return int(weight_lb * 1.0)  # 1g/lb
    elif goal_type == "fat_loss":
        return int(weight_lb * 1.0)  # Higher to preserve muscle during deficit
    elif goal_type == "recomp":
        return int(weight_lb * 0.9)  # Between maintenance and gain
    elif goal_type == "performance":
        return int(weight_lb * 0.9)  # Support training
    else:  # maintenance
        return int(weight_lb * 0.8)  # 0.8g/lb


def calculate_calories_from_macros(
    protein_g: float | None,
    carbs_g: float | None,
    fat_g: float | None,
) -> int | None:
    """Calculate total calories from macronutrients.

    Uses the 4/4/9 rule:
    - Protein: 4 cal/g
    - Carbohydrates: 4 cal/g
    - Fat: 9 cal/g

    Args:
        protein_g: Protein in grams.
        carbs_g: Carbohydrates in grams.
        fat_g: Fat in grams.

    Returns:
        Total calories, or None if all macros are None.
    """
    if all(v is None for v in [protein_g, carbs_g, fat_g]):
        return None

    protein = protein_g or 0
    carbs = carbs_g or 0
    fat = fat_g or 0

    return int(protein * 4 + carbs * 4 + fat * 9)
