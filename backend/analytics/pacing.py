from datetime import date, timedelta
from django.db import models
from django.utils import timezone
from progress.models import WeightEntry, PersonalRecord, BodyMeasurement
from workouts.models import JourneyProgram, ProgramDay, WorkoutSession

MODE_BASE_WEIGHTS = {
    'CUT': {'velocity': 40, 'adherence': 35, 'strength': 25},
    'BULK': {'velocity': 35, 'adherence': 35, 'strength': 30},
    'FOCUS': {'velocity': 10, 'adherence': 40, 'strength': 50},
    'RECOMP': {'velocity': 25, 'adherence': 40, 'strength': 35},
    'HABIT': {'velocity': 15, 'adherence': 70, 'strength': 15},
}

DEFAULT_WEEKLY_RATES = {
    'CUT': -0.5,
    'BULK': 0.3,
    'FOCUS': 0.0,
    'RECOMP': -0.15,
    'HABIT': 0.0,
}

DEFAULT_START_WEIGHT_KG = 75.0

COMPOUND_KEYWORDS = ['bench', 'squat', 'deadlift', 'press', 'overhead', 'row']
COMPOUND_MUSCLES = ['Chest', 'Back', 'Quadriceps', 'Hamstrings', 'Shoulders']


def resolve_start_weight(user, override_kg=None, start_date=None, all_weights=None):
    """
    Single source of truth for the start-weight fallback chain:
    explicit override -> nearest weigh-in on/before start_date (else earliest,
    or latest if no start_date is given) -> profile weight -> hardcoded default.
    """
    if override_kg is not None and override_kg > 0:
        return float(override_kg)

    if all_weights is None:
        all_weights = list(WeightEntry.objects.filter(user=user).order_by('date'))

    if all_weights:
        if start_date is not None:
            on_or_before = [w.weight_kg for w in all_weights if w.date <= start_date]
            return float(on_or_before[-1] if on_or_before else all_weights[0].weight_kg)
        return float(all_weights[-1].weight_kg)

    if hasattr(user, 'profile') and user.profile.weight_kg:
        return float(user.profile.weight_kg)

    return DEFAULT_START_WEIGHT_KG


def resolve_target_weekly_rate(mode, start_weight_kg=None, target_weight_kg=None, duration_days=None, explicit_rate_kg=None):
    """
    Single source of truth for deriving the target weekly weight-change rate:
    explicit rate -> derived from start/target weight over the journey duration
    -> mode's default rate.
    """
    if explicit_rate_kg is not None:
        return float(explicit_rate_kg)

    if start_weight_kg is not None and target_weight_kg is not None and duration_days:
        return round((target_weight_kg - start_weight_kg) / (duration_days / 7.0), 2)

    return DEFAULT_WEEKLY_RATES.get(mode, DEFAULT_WEEKLY_RATES['CUT'])


def calculate_rolling_average(weight_values, window=7):
    """Average of the most recent `window` weight values, or None if empty."""
    recent = weight_values[-window:]
    if not recent:
        return None
    return round(sum(recent) / len(recent), 2)


def calculate_journey_pacing(user, program=None):
    """
    Computes real-time pacing, score, trajectory curve, and copilot insights
    for the user's active JourneyProgram across 3 pillars:
      1. Weight Velocity Corridor
      2. Routine Adherence
      3. Strength / Progressive Overload Index
    """
    if program is None:
        program = JourneyProgram.objects.filter(user=user, active=True).first()

    if not program:
        return {
            'has_program': False,
            'pacing_status': 'NO_PROGRAM',
            'pacing_score': 0,
            'headline': 'No active journey',
            'copilot_insight': 'Start a new journey by selecting a mode (Cut, Bulk, Focus, Recomp) to begin tracking your path.',
            'mode': 'CUT',
            'days_elapsed': 0,
            'duration_days': 60,
            'current_day': 1,
            'is_calibrating': False,
            'velocity': None,
            'adherence': None,
            'strength': None,
            'trajectory_curve': [],
            'starting_waist': None,
            'current_waist': None,
            'target_weight': None,
            'expected_weight_change': None,
            'weekly_workouts_target': 5,
        }

    mode = program.mode or 'CUT'
    start_date = program.start_date
    if isinstance(start_date, str):
        start_date = date.fromisoformat(start_date)
    duration_days = program.duration_days or 60
    current_day = max(1, min(duration_days, program.current_day or 1))
    today = date.today()

    # All user weight entries
    all_weights = list(WeightEntry.objects.filter(user=user).order_by('date'))
    weights_by_date = {w.date: w.weight_kg for w in all_weights}

    # Target weekly rate
    target_weekly_rate = resolve_target_weekly_rate(
        mode,
        start_weight_kg=program.start_weight_kg,
        target_weight_kg=program.target_weight_kg,
        duration_days=duration_days,
        explicit_rate_kg=program.target_weekly_rate_kg,
    )

    # Resolve start weight
    start_weight = resolve_start_weight(
        user,
        override_kg=program.start_weight_kg,
        start_date=start_date,
        all_weights=all_weights,
    )

    # Weigh-ins recorded during this journey
    journey_weigh_ins = [w for w in all_weights if w.date >= start_date]
    latest_weight = all_weights[-1].weight_kg if all_weights else start_weight

    # Rolling 7-day average
    rolling_7_avg = calculate_rolling_average([w.weight_kg for w in all_weights]) or float(latest_weight)

    # 1. PILLAR: Weight Velocity
    is_calibrating = (current_day <= 7) or (len(journey_weigh_ins) < 3)
    target_weight_today = round(start_weight + (target_weekly_rate * ((current_day - 1) / 7.0)), 2)
    expected_final_weight = round(start_weight + (target_weekly_rate * (duration_days / 7.0)), 2)

    # Actual rate calculation
    actual_weekly_rate = None
    if len(journey_weigh_ins) >= 2:
        earliest_j = journey_weigh_ins[0]
        latest_j = journey_weigh_ins[-1]
        days_diff = (latest_j.date - earliest_j.date).days
        if days_diff >= 3:
            actual_weekly_rate = round(((latest_j.weight_kg - earliest_j.weight_kg) / days_diff) * 7.0, 2)

    velocity_status = 'ON_TRACK'
    velocity_score = 95
    velocity_message = 'Weight trajectory is aligned with targets.'

    if is_calibrating:
        velocity_status = 'CALIBRATING'
        velocity_score = 100
        weigh_count = len(journey_weigh_ins)
        velocity_message = f"Calibrating baseline (Day {current_day} of 7). {weigh_count}/3 minimum weigh-ins recorded."
    else:
        diff_from_target = round(rolling_7_avg - target_weight_today, 2)
        rate = actual_weekly_rate if actual_weekly_rate is not None else (diff_from_target / max(1, current_day / 7.0))

        if mode == 'CUT':
            if rate < -1.0:
                velocity_status = 'TOO_FAST'
                velocity_score = 65
                velocity_message = f"Dropping {abs(rate)} kg/wk. Risk of muscle catabolism & energy crash."
            elif rate <= -0.25:
                velocity_status = 'ON_TRACK'
                velocity_score = 96
                velocity_message = f"Losing {abs(rate)} kg/wk. Within optimal fat oxidation corridor (-0.3 to -0.7 kg/wk)."
            elif rate < 0:
                velocity_status = 'SLIGHTLY_SLOW'
                velocity_score = 78
                velocity_message = f"Losing {abs(rate)} kg/wk. Slightly behind projected pace."
            else:
                velocity_status = 'STALLED'
                velocity_score = 50
                velocity_message = f"Weight trending +{rate} kg/wk. Deficit may be compromised."

        elif mode == 'BULK':
            if rate > 0.55:
                velocity_status = 'TOO_FAST'
                velocity_score = 68
                velocity_message = f"Gaining {rate} kg/wk. Exceeds lean tissue growth rate; risk of adipose gain."
            elif rate >= 0.15:
                velocity_status = 'ON_TRACK'
                velocity_score = 96
                velocity_message = f"Gaining +{rate} kg/wk. Optimal clean surplus corridor (+0.2 to +0.4 kg/wk)."
            elif rate >= 0:
                velocity_status = 'SLIGHTLY_SLOW'
                velocity_score = 80
                velocity_message = f"Gaining +{rate} kg/wk. Surplus slightly conservative."
            else:
                velocity_status = 'LOSING_WEIGHT'
                velocity_score = 50
                velocity_message = f"Weight dropped {abs(rate)} kg/wk. Calorie surplus insufficient."

        elif mode in ('FOCUS', 'HABIT'):
            if abs(rate) <= 0.25:
                velocity_status = 'ON_TRACK'
                velocity_score = 98
                velocity_message = f"Weight stable ({rate:+.2f} kg/wk). Perfect for pure strength/habit focus."
            else:
                velocity_status = 'DRIFTING'
                velocity_score = 75
                velocity_message = f"Weight drifting ({rate:+.2f} kg/wk). Recommended maintenance target ±0.2 kg/wk."

        elif mode == 'RECOMP':
            if -0.35 <= rate <= 0.1:
                velocity_status = 'ON_TRACK'
                velocity_score = 96
                velocity_message = f"Body recomp corridor maintained ({rate:+.2f} kg/wk)."
            elif rate < -0.35:
                velocity_status = 'TOO_FAST'
                velocity_score = 75
                velocity_message = f"Losing {abs(rate)} kg/wk. Deficit may inhibit hypertrophy."
            else:
                velocity_status = 'SLIGHTLY_SLOW'
                velocity_score = 70
                velocity_message = f"Weight drifting +{rate} kg/wk."

    # 2. PILLAR: Routine Adherence
    if program.id:
        scheduled_days = program.days.filter(day_number__lte=current_day)
        scheduled_sessions = scheduled_days.count()
        completed_sessions = scheduled_days.filter(status='COMPLETED').count()
    else:
        scheduled_sessions = 0
        completed_sessions = 0

    if scheduled_sessions == 0 or (current_day == 1 and completed_sessions == 0):
        adherence_pct = 100.0
        adherence_status = 'STARTING'
        adherence_score = 100
        adherence_message = 'Day 1 initialized. Ready for your first workout!'
    elif completed_sessions >= current_day - 1:
        adherence_pct = 100.0
        adherence_status = 'EXCELLENT'
        adherence_score = 98
        adherence_message = f"All {completed_sessions} prior sessions completed! Day {current_day} is scheduled for today."
    else:
        # Prior days were missed
        adherence_pct = round((completed_sessions / max(1, current_day - 1)) * 100.0, 1)
        if adherence_pct >= 85:
            adherence_status = 'EXCELLENT'
            adherence_score = 95
            adherence_message = f"Completed {completed_sessions} of {scheduled_sessions} scheduled sessions ({adherence_pct}%)."
        elif adherence_pct >= 70:
            adherence_status = 'GOOD'
            adherence_score = 82
            missed = (current_day - 1) - completed_sessions
            adherence_message = f"{completed_sessions}/{current_day - 1} completed ({adherence_pct}%). {missed} catch-up session recommended."
        elif adherence_pct >= 50:
            adherence_status = 'LAGGING'
            adherence_score = 65
            missed = (current_day - 1) - completed_sessions
            adherence_message = f"Attendance at {adherence_pct}%. {missed} missed workouts. Plan recalibration suggested."
        else:
            adherence_status = 'CRITICAL'
            adherence_score = 45
            adherence_message = f"Attendance at {adherence_pct}%. Significant consistency gap."

    # 3. PILLAR: Strength & Overload Index
    tracked_prs = []
    compound_prs = PersonalRecord.objects.filter(user=user).select_related('exercise')

    if program.focus_exercise:
        focus_pr = compound_prs.filter(exercise=program.focus_exercise).first()
        if focus_pr:
            tracked_prs.append(focus_pr)

    if not tracked_prs:
        for pr in compound_prs:
            name_lower = pr.exercise.name.lower()
            muscle_name = pr.exercise.primary_muscle.name if pr.exercise.primary_muscle else ''
            if any(kw in name_lower for kw in COMPOUND_KEYWORDS) or muscle_name in COMPOUND_MUSCLES:
                tracked_prs.append(pr)
                if len(tracked_prs) >= 4:
                    break

    strength_active = len(tracked_prs) > 0
    strength_score = 90
    strength_status = 'NEUTRAL'
    strength_message = 'No compound baseline lifts logged yet.'
    strength_details = []

    if strength_active:
        for pr in tracked_prs:
            target_1rm = program.target_focus_1rm if (program.focus_exercise and pr.exercise_id == program.focus_exercise_id and program.target_focus_1rm) else None
            change_str = f"1RM: {pr.estimated_one_rep_max}kg"
            if target_1rm:
                pct_target = round((pr.estimated_one_rep_max / target_1rm) * 100, 1)
                change_str += f" ({pct_target}% of {target_1rm}kg target)"

            strength_details.append({
                'exercise': pr.exercise.name,
                'max_weight_kg': pr.max_weight_kg,
                'reps': pr.reps,
                'estimated_1rm': pr.estimated_one_rep_max,
                'achieved_at': str(pr.achieved_at),
                'summary': change_str,
            })

        if mode == 'CUT':
            strength_status = 'MAINTAINED'
            strength_score = 95
            strength_message = f"Strength preserved across {len(tracked_prs)} compound anchors."
        elif mode in ('BULK', 'FOCUS'):
            strength_status = 'PROGRESSING'
            strength_score = 96
            strength_message = f"Overload active across {len(tracked_prs)} primary lifts."
        else:
            strength_status = 'MAINTAINED'
            strength_score = 92
            strength_message = f"Core lifts stable across {len(tracked_prs)} anchors."

    # Dynamic Proportional Weight Normalization
    base_weights = MODE_BASE_WEIGHTS.get(mode, MODE_BASE_WEIGHTS['CUT'])
    active_weights = {}

    if not is_calibrating:
        active_weights['velocity'] = (base_weights['velocity'], velocity_score)

    active_weights['adherence'] = (base_weights['adherence'], adherence_score)

    if strength_active:
        active_weights['strength'] = (base_weights['strength'], strength_score)

    total_active_base = sum(w for w, _ in active_weights.values())
    if total_active_base > 0:
        composite_score = sum((weight / total_active_base) * score for weight, score in active_weights.values())
    else:
        composite_score = 90

    final_score = int(round(max(10, min(100, composite_score))))

    # Overall Pacing Status
    if is_calibrating and adherence_score >= 80:
        overall_status = 'ON_TRACK'
    elif final_score >= 85:
        overall_status = 'ON_TRACK'
    elif final_score >= 70:
        overall_status = 'PACING_ALERT'
    else:
        overall_status = 'OFF_TRACK'

    copilot_insight = _generate_copilot_insight(
        mode=mode,
        status=overall_status,
        score=final_score,
        is_calibrating=is_calibrating,
        velocity_status=velocity_status,
        adherence_status=adherence_status,
        strength_status=strength_status,
        actual_weekly_rate=actual_weekly_rate,
        target_weekly_rate=target_weekly_rate,
        adherence_pct=adherence_pct,
        current_day=current_day,
        duration_days=duration_days,
        rolling_7_avg=rolling_7_avg,
        target_weight_today=target_weight_today,
    )

    trajectory_curve = []
    for day_i in range(1, duration_days + 1):
        d_date = start_date + timedelta(days=day_i - 1)
        expected_w = round(start_weight + (target_weekly_rate * ((day_i - 1) / 7.0)), 2)
        actual_w = float(weights_by_date[d_date]) if d_date in weights_by_date else None

        trajectory_curve.append({
            'day': day_i,
            'date': d_date.strftime('%Y-%m-%d'),
            'label': f"Day {day_i}",
            'target_weight': expected_w,
            'actual_weight': actual_w,
        })

    # Resolve program-specific waist measurements
    all_measurements = list(BodyMeasurement.objects.filter(user=user).order_by('date'))
    starting_waist = None
    current_waist = None
    if all_measurements:
        journey_measurements = [m for m in all_measurements if m.date >= start_date and m.waist_cm is not None]
        if journey_measurements:
            starting_waist = journey_measurements[0].waist_cm
            current_waist = journey_measurements[-1].waist_cm
        else:
            first_w = next((m.waist_cm for m in all_measurements if m.waist_cm is not None), None)
            latest_w = next((m.waist_cm for m in reversed(all_measurements) if m.waist_cm is not None), None)
            starting_waist = first_w
            current_waist = latest_w

    target_weight = program.target_weight_kg if (program and program.target_weight_kg) else expected_final_weight
    expected_weight_change = round(target_weight - start_weight, 2)

    weekly_workouts_target = 5
    if program and program.id:
        day_count = program.days.filter(day_number__lte=7).count()
        if day_count > 0:
            weekly_workouts_target = day_count

    return {
        'has_program': True,
        'program_id': str(program.id),
        'program_name': program.name,
        'mode': mode,
        'mode_label': dict(JourneyProgram.MODE_CHOICES).get(mode, mode),
        'pacing_status': overall_status,
        'pacing_score': final_score,
        'current_day': current_day,
        'duration_days': duration_days,
        'start_date': str(start_date),
        'is_calibrating': is_calibrating,
        'copilot_insight': copilot_insight,
        'starting_waist': starting_waist,
        'current_waist': current_waist,
        'target_weight': target_weight,
        'expected_weight_change': expected_weight_change,
        'weekly_workouts_target': weekly_workouts_target,
        'velocity': {
            'status': velocity_status,
            'score': velocity_score,
            'message': velocity_message,
            'rolling_7_avg': rolling_7_avg,
            'target_today': target_weight_today,
            'start_weight': start_weight,
            'target_weight': target_weight,
            'expected_final_weight': expected_final_weight,
            'actual_weekly_rate': actual_weekly_rate,
            'target_weekly_rate': target_weekly_rate,
        },
        'adherence': {
            'status': adherence_status,
            'score': adherence_score,
            'message': adherence_message,
            'completed_sessions': completed_sessions,
            'scheduled_sessions': scheduled_sessions,
            'adherence_pct': adherence_pct,
        },
        'strength': {
            'status': strength_status,
            'score': strength_score,
            'message': strength_message,
            'tracked_lifts': strength_details,
        },
        'trajectory_curve': trajectory_curve,
    }


def _generate_copilot_insight(
    mode, status, score, is_calibrating, velocity_status, adherence_status,
    strength_status, actual_weekly_rate, target_weekly_rate, adherence_pct,
    current_day, duration_days, rolling_7_avg, target_weight_today
):
    if is_calibrating:
        return (
            f"You are on Day {current_day} of {duration_days}. Weight baseline is currently calibrating. "
            "Keep daily protein high and log your weight every morning after waking to form the rolling curve."
        )

    if mode == 'CUT':
        if velocity_status == 'TOO_FAST':
            return (
                f"Weight is dropping at {abs(actual_weekly_rate or 0):.2f} kg/wk (target: {target_weekly_rate} kg/wk). "
                "This pace risks muscle loss. Add 150–200 kcal or reduce high-intensity cardio duration by 10 mins."
            )
        if velocity_status == 'STALLED':
            return (
                "Weight loss has stalled over recent weigh-ins. Verify tracking accuracy on cooking oils and snacks, "
                "or increase daily steps by 1,500 to restore your caloric deficit."
            )
        if adherence_status in ('LAGGING', 'CRITICAL'):
            return (
                f"Workout attendance is at {adherence_pct}%. Missing resistance sessions compromises muscle preservation. "
                "Prioritize your compound anchor lifts this week."
            )
        return (
            f"Excellent execution! You are on target at {rolling_7_avg} kg (target {target_weight_today} kg). "
            "Strength is preserved and cardio adherence is locked in. Stay the course."
        )

    elif mode == 'BULK':
        if velocity_status == 'TOO_FAST':
            return (
                f"Weight is advancing at +{actual_weekly_rate or 0:.2f} kg/wk. This exceeds optimal muscle protein synthesis rates. "
                "Trim 200 kcal to keep gains lean and minimize fat accrual."
            )
        if velocity_status == 'LOSING_WEIGHT':
            return (
                "Weight is drifting downward instead of upward. You need a surplus: add a dense 300 kcal snack "
                "(oats, peanut butter, or banana smoothie) on training days."
            )
        return (
            "Hypertrophy pacing is locked in. Progressive overload confirmed on compound lifts with clean weight velocity."
        )

    elif mode == 'FOCUS':
        if adherence_status != 'EXCELLENT':
            return (
                f"Strength peaking requires neural consistency. Attendance is at {adherence_pct}%. "
                "Do not skip the scheduled heavy anchor sessions."
            )
        return (
            "PR Index is tracking strong. Ensure 3–4 minutes rest on primary compound sets and maintain caloric maintenance."
        )

    elif mode == 'HABIT':
        return (
            f"Consistency streak at {adherence_pct}%. Focus strictly on showing up and finishing the prescribed 35-minute sessions."
        )

    return (
        f"Pacing score is {score}% ({status.replace('_', ' ')}). Continue tracking your daily nutrition and training volume."
    )
