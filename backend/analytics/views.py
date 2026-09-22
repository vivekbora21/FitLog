from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db import models
from workouts.models import WorkoutSession, AssignedWorkout, CardioEntry, JourneyProgram, ProgramDay
from nutrition.models import NutritionDay, MacroTarget
from progress.models import PersonalRecord, WeightEntry, BodyMeasurement, DailyLog
from .pacing import calculate_journey_pacing, calculate_rolling_average

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())
        start_of_month = today.replace(day=1)
        ninety_days_ago = today - timedelta(days=90)

        # Workouts
        user_sessions = WorkoutSession.objects.filter(user=user)
        workouts_this_week = user_sessions.filter(started_at__date__gte=start_of_week).count()
        workouts_this_month = user_sessions.filter(started_at__date__gte=start_of_month).count()

        # Volume calculation this week
        week_sessions = user_sessions.filter(started_at__date__gte=start_of_week)
        total_volume_week = sum(s.total_volume_kg() for s in week_sessions)

        # Activity heatmap: session dates in last 90 days
        recent_sessions = user_sessions.filter(started_at__date__gte=ninety_days_ago)
        activity_dates = {}
        for s in recent_sessions:
            d_str = s.started_at.strftime('%Y-%m-%d')
            activity_dates[d_str] = activity_dates.get(d_str, 0) + 1

        # Current streak calculation (consecutive days backwards from today/yesterday)
        streak = 0
        check_date = today
        if not activity_dates.get(check_date.strftime('%Y-%m-%d')):
            check_date = today - timedelta(days=1)
        while activity_dates.get(check_date.strftime('%Y-%m-%d')):
            streak += 1
            check_date -= timedelta(days=1)

        # Today's nutrition & daily lifestyle log
        nutrition_day = NutritionDay.objects.filter(user=user, date=today).first()
        target, _ = MacroTarget.objects.get_or_create(user=user)

        calories_consumed = nutrition_day.total_calories() if nutrition_day else 0
        protein_consumed = nutrition_day.total_protein() if nutrition_day else 0
        carbs_consumed = nutrition_day.total_carbs() if nutrition_day else 0
        fat_consumed = nutrition_day.total_fat() if nutrition_day else 0
        water_consumed = nutrition_day.water_consumed_ml if nutrition_day else 0

        daily_log_today = DailyLog.objects.filter(user=user, date=today).first()
        steps_today = daily_log_today.steps if daily_log_today and daily_log_today.steps is not None else 0
        sleep_today = daily_log_today.sleep_hours if daily_log_today and daily_log_today.sleep_hours is not None else 0.0
        sleep_quality_today = daily_log_today.sleep_quality if daily_log_today else None
        energy_level_today = daily_log_today.energy_level if daily_log_today else None
        recovery_notes_today = daily_log_today.recovery_notes if daily_log_today else ''


        # Pending assigned workout
        pending_assigned = AssignedWorkout.objects.filter(
            client=user,
            status='PENDING'
        ).select_related('routine', 'trainer').first()

        pending_workout_data = None
        if pending_assigned:
            pending_workout_data = {
                'id': str(pending_assigned.id),
                'routine_name': pending_assigned.routine.name,
                'routine_id': str(pending_assigned.routine.id),
                'trainer_name': pending_assigned.trainer.get_full_name() or pending_assigned.trainer.email,
                'scheduled_date': str(pending_assigned.scheduled_date),
            }

        # Recent PRs
        prs = PersonalRecord.objects.filter(user=user).select_related('exercise')[:5]
        prs_data = [
            {
                'exercise': pr.exercise.name,
                'max_weight_kg': pr.max_weight_kg,
                'reps': pr.reps,
                'estimated_1rm': pr.estimated_one_rep_max,
                'achieved_at': str(pr.achieved_at)
            }
            for pr in prs
        ]

        weights = list(WeightEntry.objects.filter(user=user).order_by('date'))
        current_weight = weights[-1].weight_kg if weights else None
        starting_weight = weights[0].weight_kg if weights else None
        rolling = calculate_rolling_average([w.weight_kg for w in weights])
        previous_avg = calculate_rolling_average([w.weight_kg for w in weights[-14:-7]])
        weekly_change = round(rolling - previous_avg, 2) if rolling is not None and previous_avg is not None else None
        measurements = list(BodyMeasurement.objects.filter(user=user).order_by('date'))
        current_waist = next((m.waist_cm for m in reversed(measurements) if m.waist_cm is not None), None)
        starting_waist = next((m.waist_cm for m in measurements if m.waist_cm is not None), None)
        cardio_minutes = sum(CardioEntry.objects.filter(user=user, date__gte=start_of_week, completed=True).values_list('duration_minutes', flat=True))
        program = JourneyProgram.objects.filter(user=user, active=True).first()
        target_cardio = program.target_cardio_minutes_early if program and program.current_day <= 14 else (program.target_cardio_minutes_later if program else 120)

        # Trend Series for Dashboard Charts
        measurement_waist_by_date = {m.date: m.waist_cm for m in measurements if m.waist_cm is not None}
        weight_trend = [
            {
                'date': w.date.strftime('%Y-%m-%d'),
                'label': w.date.strftime('%b %d'),
                'weight_kg': float(w.weight_kg),
                'waist_cm': float(measurement_waist_by_date[w.date]) if w.date in measurement_waist_by_date else None,
            }
            for w in weights[-14:]
        ]

        recent_sessions = list(
            user_sessions.prefetch_related('exercises__sets')
            .order_by('started_at')
        )
        volume_trend = [
            {
                'date': s.started_at.strftime('%Y-%m-%d'),
                'label': s.started_at.strftime('%b %d'),
                'title': s.title or (s.routine.name if s.routine else 'Session'),
                'volume_kg': round(s.total_volume_kg(), 1),
            }
            for s in recent_sessions[-8:]
        ]

        last_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
        nutrition_days_map = {
            nd.date: nd for nd in NutritionDay.objects.filter(
                user=user, date__gte=last_7_days[0], date__lte=last_7_days[-1]
            ).prefetch_related('meals')
        }
        nutrition_trend = [
            {
                'date': d.strftime('%Y-%m-%d'),
                'label': d.strftime('%a'),
                'calories': nutrition_days_map[d].total_calories() if d in nutrition_days_map else 0,
                'calories_target': target.daily_calories,
                'protein': nutrition_days_map[d].total_protein() if d in nutrition_days_map else 0,
                'protein_target': target.protein_g,
            }
            for d in last_7_days
        ]

        pacing_data = calculate_journey_pacing(user, program)
        resolved_starting_weight = (pacing_data.get('velocity') or {}).get('start_weight') or starting_weight
        resolved_starting_waist = pacing_data.get('starting_waist') or starting_waist
        resolved_current_waist = pacing_data.get('current_waist') or current_waist
        weekly_workouts_target = pacing_data.get('weekly_workouts_target', 5)

        # Server-computed adherence payload
        adh_pacing = pacing_data.get('adherence') or {}
        workout_adh_pct = adh_pacing.get('adherence_pct')
        if workout_adh_pct is None:
            workout_adh_pct = min(100.0, round((workouts_this_week / max(1, weekly_workouts_target)) * 100.0, 1))

        cal_target = target.daily_calories or 0
        cal_pct = min(100.0, round((calories_consumed / max(1, cal_target)) * 100.0, 1)) if cal_target else 0.0

        protein_target = target.protein_g or 0
        protein_pct = min(100.0, round((protein_consumed / max(1, protein_target)) * 100.0, 1)) if protein_target else 0.0

        water_target = target.water_ml or 3000
        water_pct = min(100.0, round((water_consumed / max(1, water_target)) * 100.0, 1)) if water_target else 0.0

        cardio_pct = min(100.0, round((cardio_minutes / max(1, target_cardio)) * 100.0, 1)) if target_cardio else 0.0

        adherence_data = {
            'workout': {
                'label': 'Workout Adherence' if program else 'Weekly Workouts',
                'actual': adh_pacing.get('completed_sessions', workouts_this_week),
                'target': adh_pacing.get('scheduled_sessions', weekly_workouts_target),
                'percent': workout_adh_pct,
                'unit': 'sessions',
                'status': adh_pacing.get('status', 'EXCELLENT' if workout_adh_pct >= 85 else 'WARN'),
                'is_program': bool(program),
                'message': adh_pacing.get('message', ''),
            },
            'weekly_workouts': {
                'label': 'Weekly Workouts',
                'actual': workouts_this_week,
                'target': weekly_workouts_target,
                'percent': min(100.0, round((workouts_this_week / max(1, weekly_workouts_target)) * 100.0, 1)),
                'unit': 'sessions',
            },
            'calories': {
                'label': 'Calories',
                'actual': calories_consumed,
                'target': cal_target,
                'percent': cal_pct,
                'unit': 'kcal',
            },
            'protein': {
                'label': 'Protein',
                'actual': protein_consumed,
                'target': protein_target,
                'percent': protein_pct,
                'unit': 'g',
            },
            'water': {
                'label': 'Water',
                'actual': water_consumed,
                'target': water_target,
                'actual_cups': round(water_consumed / 250),
                'target_cups': round(water_target / 250),
                'percent': water_pct,
                'unit': 'cups',
            },
            'cardio': {
                'label': 'Weekly Cardio',
                'actual': cardio_minutes,
                'target': target_cardio,
                'percent': cardio_pct,
                'unit': 'min',
            },
            'steps': {
                'label': 'Daily Steps',
                'actual': steps_today,
                'target': 10000,
                'percent': min(100.0, round((steps_today / 10000) * 100.0, 1)),
                'unit': 'steps',
            },
            'sleep': {
                'label': 'Nightly Sleep',
                'actual': sleep_today,
                'target': 8.0,
                'percent': min(100.0, round((sleep_today / 8.0) * 100.0, 1)),
                'unit': 'hours',
            },
        }

        # Sheet 11: Automated Weekly Review & Adaptive Decision Protocol
        weekly_review = []
        if program and program.start_date:
            prog_start = program.start_date
            if isinstance(prog_start, str):
                prog_start = date.fromisoformat(prog_start)
            duration = program.duration_days or 60
            num_weeks = (duration + 6) // 7

            all_u_weights = weights
            all_u_nutrition = list(NutritionDay.objects.filter(user=user).prefetch_related('meals'))
            all_u_daily = list(DailyLog.objects.filter(user=user))
            all_u_cardio = list(CardioEntry.objects.filter(user=user, completed=True))
            all_u_measurements = measurements
            all_u_days = list(ProgramDay.objects.filter(program=program))

            for w_idx in range(num_weeks):
                w_start = prog_start + timedelta(days=w_idx * 7)
                w_end = min(prog_start + timedelta(days=w_idx * 7 + 6), prog_start + timedelta(days=duration - 1))
                w_label = f"Week {w_idx + 1}"
                d_range_str = f"{w_start.strftime('%b %d')} – {w_end.strftime('%b %d')}"

                # Weight
                wk_weights = [w.weight_kg for w in all_u_weights if w_start <= w.date <= w_end]
                avg_w = round(sum(wk_weights) / len(wk_weights), 2) if wk_weights else None
                w_change = round(avg_w - resolved_starting_weight, 2) if avg_w is not None and resolved_starting_weight is not None else None

                # Nutrition
                wk_nutr = [nd for nd in all_u_nutrition if w_start <= nd.date <= w_end]
                avg_cal = round(sum(nd.total_calories() for nd in wk_nutr) / len(wk_nutr)) if wk_nutr else None
                avg_prot = round(sum(nd.total_protein() for nd in wk_nutr) / len(wk_nutr)) if wk_nutr else None

                # Steps & Sleep
                wk_daily = [dl for dl in all_u_daily if w_start <= dl.date <= w_end]
                wk_steps = [dl.steps for dl in wk_daily if dl.steps is not None]
                wk_sleep = [dl.sleep_hours for dl in wk_daily if dl.sleep_hours is not None]
                avg_steps = int(round(sum(wk_steps) / len(wk_steps))) if wk_steps else None
                avg_sleep = round(sum(wk_sleep) / len(wk_sleep), 1) if wk_sleep else None

                # Cardio
                wk_cardio = sum(c.duration_minutes for c in all_u_cardio if w_start <= c.date <= w_end)

                # Workouts
                wk_completed = sum(1 for pd in all_u_days if pd.day_number is not None and (w_idx * 7 + 1) <= pd.day_number <= min((w_idx + 1) * 7, duration) and pd.status == 'COMPLETED')
                eff_target = min(weekly_workouts_target, (w_end - w_start).days + 1)
                workout_pct = round(wk_completed / max(1, eff_target), 2)

                # Waist
                wk_meas = [m for m in all_u_measurements if w_start <= m.date <= w_end and m.waist_cm is not None]
                latest_waist = wk_meas[-1].waist_cm if wk_meas else None
                waist_change = round(latest_waist - resolved_starting_waist, 1) if latest_waist is not None and resolved_starting_waist is not None else None

                # Strength Trend
                strength_trend = "Maintained / Increasing"
                if w_idx == 0:
                    strength_trend = "Baseline Set"

                # Energy & Recovery Notes
                recovery_notes_list = [dl.recovery_notes for dl in wk_daily if dl.recovery_notes]
                if recovery_notes_list:
                    energy_notes = recovery_notes_list[0]
                elif w_idx == 0:
                    energy_notes = "Return-to-training week; focus on clean form and consistent logging."
                elif w_idx == num_weeks - 1:
                    energy_notes = f"Final days; prepare Day {duration} measurements and photos."
                else:
                    energy_notes = f"Week {w_idx + 1} progression; maintain consistency across sleep and training."

                # Action for Next Week (Automated Decision Protocol Rules 1-5)
                if avg_w is None and not wk_daily and not wk_nutr:
                    action_rec = f"Awaiting Week {w_idx + 1} daily entries"
                elif strength_trend == "Declining":
                    action_rec = "Rule 5: Do not increase training volume. Assess sleep, calories, recovery and fatigue."
                elif w_change is not None and w_change < -0.8:
                    action_rec = "Rule 4: Weight dropping too fast. Increase calories slightly (+100–150 kcal) and/or reduce cardio."
                elif w_change is not None and abs(w_change) < 0.2 and waist_change is not None and abs(waist_change) < 0.2:
                    action_rec = "Rule 3: Weight & waist unchanged for 2 wks. Consider small adjustment (~100–150 kcal/day) OR modest increase in activity."
                elif w_change is not None and w_change <= 0 and (waist_change is None or waist_change <= 0):
                    action_rec = "Rule 1 & 2: Maintain current plan. Steady recomposition and waist reduction on track."
                else:
                    action_rec = "Maintain current plan; monitor 7-day trend."

                weekly_review.append({
                    'week': w_label,
                    'week_index': w_idx,
                    'date_range': d_range_str,
                    'avg_weight': avg_w,
                    'weight_change': w_change,
                    'avg_calories': avg_cal,
                    'avg_protein': avg_prot,
                    'avg_steps': avg_steps,
                    'avg_sleep': avg_sleep,
                    'cardio_minutes': wk_cardio,
                    'workout_pct': workout_pct,
                    'waist': latest_waist,
                    'waist_change': waist_change,
                    'strength_trend': strength_trend,
                    'energy_notes': energy_notes,
                    'action_recommendation': action_rec,
                    'is_current': (w_start <= today <= w_end),
                })

        return Response({
            'streak_days': streak,
            'workouts_this_week': workouts_this_week,
            'workouts_this_month': workouts_this_month,
            'weekly_workouts_target': weekly_workouts_target,
            'total_volume_kg_week': round(total_volume_week, 1),
            'nutrition': {
                'calories_consumed': calories_consumed,
                'calories_target': target.daily_calories,
                'protein_consumed': protein_consumed,
                'protein_target': target.protein_g,
                'carbs_consumed': carbs_consumed,
                'carbs_target': target.carbs_g,
                'fat_consumed': fat_consumed,
                'fat_target': target.fat_g,
                'water_consumed_ml': water_consumed,
                'water_target_ml': target.water_ml,
            },
            'daily_log': {
                'steps': steps_today,
                'sleep_hours': sleep_today,
                'sleep_quality': sleep_quality_today,
                'energy_level': energy_level_today,
                'recovery_notes': recovery_notes_today,
            },
            'activity_heatmap': activity_dates,
            'pending_assigned_workout': pending_workout_data,
            'recent_prs': prs_data,
            'journey': {
                'mode': program.mode if program else 'CUT',
                'mode_label': dict(JourneyProgram.MODE_CHOICES).get(program.mode, program.mode) if program else 'Cut Mode',
                'copilot_insight': pacing_data.get('copilot_insight', ''),
                'current_weight': current_weight,
                'starting_weight': resolved_starting_weight,
                'target_weight': pacing_data.get('target_weight'),
                'weight_change': round(current_weight - resolved_starting_weight, 2) if current_weight is not None and resolved_starting_weight is not None else None,
                'seven_day_average': rolling,
                'weekly_weight_change': weekly_change,
                'current_waist': resolved_current_waist,
                'starting_waist': resolved_starting_waist,
                'waist_change': round(resolved_current_waist - resolved_starting_waist, 1) if resolved_current_waist is not None and resolved_starting_waist is not None else None,
                'cardio_minutes': cardio_minutes,
                'cardio_target': target_cardio,
                'weekly_workouts_target': weekly_workouts_target,
                'program_day': program.current_day if program else None,
                'program_length': program.duration_days if program else 60,
                'program_completion_percent': round(((program.current_day - 1) / program.duration_days) * 100, 1) if program else 0,
            },
            'journey_pacing': pacing_data,
            'weekly_review': weekly_review,
            'adherence': adherence_data,
            'trends': {
                'weight': weight_trend,
                'volume': volume_trend,
                'nutrition': nutrition_trend,
            }
        })


class JourneyPacingStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        pacing = calculate_journey_pacing(request.user)
        return Response(pacing)

