"""
Derives calorie and macro targets from the user's profile instead of relying on
hand-typed numbers: Mifflin-St Jeor BMR -> activity-scaled TDEE -> goal adjustment.

Reference point (Diet Plan sheet): 31 y/o male, 77.76 kg, ~174.5 cm, moderate
activity -> BMR ~1,718 kcal, maintenance ~2,660 kcal, ~500 kcal deficit -> 2,160 kcal,
165 g protein (2.1 g/kg).
"""
from datetime import date

from progress.models import WeightEntry
from workouts.models import JourneyProgram
from .models import MacroTarget

ACTIVITY_FACTORS = {
    'SEDENTARY': 1.2,
    'LIGHT': 1.375,
    'MODERATE': 1.55,
    'HIGH': 1.725,
    'ATHLETE': 1.9,
}

# An active journey's mode is the most specific statement of intent, so it wins
# over the coarser profile fitness_goal.
MODE_CALORIE_ADJUSTMENT = {
    'CUT': -500,
    'RECOMP': -250,
    'BULK': 300,
    'FOCUS': 0,
    'HABIT': 0,
}
GOAL_CALORIE_ADJUSTMENT = {
    'FAT_LOSS': -500,
    'HYPERTROPHY': 250,
    'STRENGTH': 250,
    'ENDURANCE': 0,
    'GENERAL_FITNESS': 0,
}

MODE_PROTEIN_G_PER_KG = {
    'CUT': 2.1,
    'RECOMP': 2.1,
    'BULK': 1.8,
    'FOCUS': 1.8,
    'HABIT': 1.6,
}
GOAL_PROTEIN_G_PER_KG = {
    'FAT_LOSS': 2.1,
    'HYPERTROPHY': 1.8,
    'STRENGTH': 1.8,
    'ENDURANCE': 1.6,
    'GENERAL_FITNESS': 1.6,
}

FAT_SHARE_OF_CALORIES = 0.25
# Never recommend eating below this, whatever the arithmetic says.
MIN_CALORIES = {'MALE': 1500, 'FEMALE': 1200}


def mifflin_st_jeor_bmr(weight_kg, height_cm, age_years, sex):
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age_years
    return base + 5 if sex == 'MALE' else base - 161


def _age_on(dob, today):
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def calculate_recommended_targets(user, today=None):
    """
    Returns a dict with the full derivation (so the UI can show where the number
    comes from), or {'available': False, 'missing': [...]} if the profile is incomplete.
    """
    today = today or date.today()
    profile = getattr(user, 'profile', None)

    latest_weight = WeightEntry.objects.filter(user=user).order_by('-date').first()
    weight_kg = latest_weight.weight_kg if latest_weight else (profile.weight_kg if profile else None)
    weight_source = 'latest weigh-in' if latest_weight else 'profile'

    missing = []
    if not weight_kg:
        missing.append('weight')
    if not profile or not profile.height_cm:
        missing.append('height_cm')
    if not profile or not profile.date_of_birth:
        missing.append('date_of_birth')
    if not profile or profile.sex not in ('MALE', 'FEMALE'):
        missing.append('sex')
    if missing:
        return {'available': False, 'missing': missing}

    age = _age_on(profile.date_of_birth, today)
    bmr = mifflin_st_jeor_bmr(weight_kg, profile.height_cm, age, profile.sex)
    activity_level = profile.activity_level if profile.activity_level in ACTIVITY_FACTORS else 'MODERATE'
    activity_factor = ACTIVITY_FACTORS[activity_level]
    tdee = bmr * activity_factor

    program = JourneyProgram.objects.filter(user=user, active=True).first()
    if program and program.mode in MODE_CALORIE_ADJUSTMENT:
        goal_source = f"{dict(JourneyProgram.MODE_CHOICES).get(program.mode, program.mode)} (active journey)"
        adjustment = MODE_CALORIE_ADJUSTMENT[program.mode]
        protein_per_kg = MODE_PROTEIN_G_PER_KG[program.mode]
    else:
        goal = profile.fitness_goal
        goal_source = f"{dict(profile.GOAL_CHOICES).get(goal, goal)} (profile goal)"
        adjustment = GOAL_CALORIE_ADJUSTMENT.get(goal, 0)
        protein_per_kg = GOAL_PROTEIN_G_PER_KG.get(goal, 1.6)

    calories = max(MIN_CALORIES[profile.sex], round((tdee + adjustment) / 10) * 10)
    protein_g = round(weight_kg * protein_per_kg)
    fat_g = round(calories * FAT_SHARE_OF_CALORIES / 9)
    carbs_g = max(0, round((calories - protein_g * 4 - fat_g * 9) / 4))

    return {
        'available': True,
        'inputs': {
            'weight_kg': round(weight_kg, 2),
            'weight_source': weight_source,
            'height_cm': profile.height_cm,
            'age_years': age,
            'sex': profile.sex,
            'activity_level': activity_level,
        },
        'bmr': round(bmr),
        'activity_factor': activity_factor,
        'tdee': round(tdee),
        'goal_source': goal_source,
        'calorie_adjustment': adjustment,
        'protein_g_per_kg': protein_per_kg,
        'daily_calories': calories,
        'protein_g': protein_g,
        'carbs_g': carbs_g,
        'fat_g': fat_g,
    }


def get_or_create_macro_target(user):
    """
    Like MacroTarget.objects.get_or_create, but a brand-new target starts from the
    profile-derived recommendation (when the profile is complete) instead of the
    model's generic defaults. Existing targets are never touched.
    """
    target = MacroTarget.objects.filter(user=user).first()
    if target:
        return target
    rec = calculate_recommended_targets(user)
    defaults = {}
    if rec['available']:
        defaults = {k: rec[k] for k in ('daily_calories', 'protein_g', 'carbs_g', 'fat_g')}
    target, _ = MacroTarget.objects.get_or_create(user=user, defaults=defaults)
    return target
