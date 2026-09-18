from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db import models
from workouts.models import WorkoutSession, AssignedWorkout, CardioEntry, JourneyProgram
from nutrition.models import NutritionDay, MacroTarget
from progress.models import PersonalRecord, WeightEntry, BodyMeasurement

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

        # Today's nutrition
        nutrition_day = NutritionDay.objects.filter(user=user, date=today).first()
        target, _ = MacroTarget.objects.get_or_create(user=user)

        calories_consumed = nutrition_day.total_calories() if nutrition_day else 0
        protein_consumed = nutrition_day.total_protein() if nutrition_day else 0
        carbs_consumed = nutrition_day.total_carbs() if nutrition_day else 0
        fat_consumed = nutrition_day.total_fat() if nutrition_day else 0
        water_consumed = nutrition_day.water_consumed_ml if nutrition_day else 0

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
        rolling = round(sum(w.weight_kg for w in weights[-7:]) / min(7, len(weights)), 2) if weights else None
        previous = weights[-14:-7]
        weekly_change = round(rolling - (sum(w.weight_kg for w in previous) / len(previous)), 2) if rolling is not None and previous else None
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

        return Response({
            'streak_days': streak,
            'workouts_this_week': workouts_this_week,
            'workouts_this_month': workouts_this_month,
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
            'activity_heatmap': activity_dates,
            'pending_assigned_workout': pending_workout_data,
            'recent_prs': prs_data,
            'journey': {
                'current_weight': current_weight, 'starting_weight': starting_weight,
                'weight_change': round(current_weight - starting_weight, 2) if current_weight is not None and starting_weight is not None else None,
                'seven_day_average': rolling, 'weekly_weight_change': weekly_change,
                'current_waist': current_waist, 'starting_waist': starting_waist,
                'waist_change': round(current_waist - starting_waist, 1) if current_waist is not None and starting_waist is not None else None,
                'cardio_minutes': cardio_minutes, 'cardio_target': target_cardio,
                'program_day': program.current_day if program else None, 'program_length': program.duration_days if program else 60,
                'program_completion_percent': round(((program.current_day - 1) / program.duration_days) * 100, 1) if program else 0,
            },
            'trends': {
                'weight': weight_trend,
                'volume': volume_trend,
                'nutrition': nutrition_trend,
            }
        })
