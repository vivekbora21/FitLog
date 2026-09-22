from datetime import date, timedelta
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from workouts.models import JourneyProgram, ProgramDay, Routine
from progress.models import DailyLog, WeightEntry

class AnalyticsAdherenceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="athlete@example.com",
            username="athlete",
            password="testpassword123"
        )
        self.client.force_authenticate(user=self.user)

    def test_dashboard_stats_adherence_without_program(self):
        response = self.client.get('/api/analytics/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('adherence', data)
        adherence = data['adherence']
        self.assertIn('workout', adherence)
        self.assertIn('weekly_workouts', adherence)
        self.assertIn('calories', adherence)
        self.assertIn('protein', adherence)
        self.assertIn('water', adherence)
        self.assertIn('cardio', adherence)

    def test_dashboard_stats_adherence_matches_pacing_with_program(self):
        routine = Routine.objects.create(
            user=self.user,
            name="Upper Body Power",
        )
        program = JourneyProgram.objects.create(
            user=self.user,
            name="Cut 60",
            mode="CUT",
            current_day=3,
            duration_days=60,
            active=True,
            start_date=date.today(),
        )
        ProgramDay.objects.create(program=program, day_number=1, routine=routine, status='COMPLETED')
        ProgramDay.objects.create(program=program, day_number=2, routine=routine, status='COMPLETED')
        ProgramDay.objects.create(program=program, day_number=3, routine=routine, status='UPCOMING')

        response = self.client.get('/api/analytics/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        adherence = data['adherence']
        pacing_adherence = data['journey_pacing']['adherence']

        # Verify adherence in both places is synchronized to identical numbers
        self.assertEqual(adherence['workout']['percent'], pacing_adherence['adherence_pct'])
        self.assertEqual(adherence['workout']['actual'], pacing_adherence['completed_sessions'])
        self.assertEqual(adherence['workout']['target'], pacing_adherence['scheduled_sessions'])
        self.assertEqual(adherence['workout']['status'], pacing_adherence['status'])

    def test_recovery_pillar_and_weekly_review_aggregation(self):
        start_d = date.today() - timedelta(days=6)
        program = JourneyProgram.objects.create(
            user=self.user,
            name="Cut 60",
            mode="CUT",
            current_day=7,
            duration_days=60,
            active=True,
            start_date=start_d,
            start_weight_kg=80.0,
        )

        # Log daily step & sleep entries across the week
        for i in range(7):
            d = start_d + timedelta(days=i)
            DailyLog.objects.create(
                user=self.user,
                date=d,
                steps=8500,
                sleep_hours=8.0,
                energy_level=4,
                recovery_notes="Feeling recovered"
            )
            WeightEntry.objects.create(user=self.user, date=d, weight_kg=79.5)

        response = self.client.get('/api/analytics/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check recovery pillar
        pacing = data['journey_pacing']
        self.assertIn('recovery', pacing)
        rec = pacing['recovery']
        self.assertEqual(rec['status'], 'OPTIMAL')
        self.assertEqual(rec['avg_sleep_hours'], 8.0)
        self.assertEqual(rec['avg_daily_steps'], 8500)
        self.assertFalse(rec['fatigue_debt_detected'])

        # Check adherence payload includes steps and sleep
        self.assertIn('steps', data['adherence'])
        self.assertIn('sleep', data['adherence'])

        # Check weekly review sheet
        self.assertIn('weekly_review', data)
        self.assertTrue(len(data['weekly_review']) > 0)
        w1 = data['weekly_review'][0]
        self.assertEqual(w1['week'], 'Week 1')
        self.assertEqual(w1['avg_steps'], 8500)
        self.assertEqual(w1['avg_sleep'], 8.0)
        self.assertEqual(w1['avg_weight'], 79.5)
        self.assertEqual(w1['weight_change'], -0.5)

    def test_fatigue_debt_detection_rule_5(self):
        start_d = date.today() - timedelta(days=6)
        JourneyProgram.objects.create(
            user=self.user,
            name="Cut 60",
            mode="CUT",
            current_day=7,
            duration_days=60,
            active=True,
            start_date=start_d,
            start_weight_kg=80.0,
        )

        # Log daily entries with sleep deficit (< 6.5h)
        for i in range(7):
            d = start_d + timedelta(days=i)
            DailyLog.objects.create(
                user=self.user,
                date=d,
                steps=5000,
                sleep_hours=5.5,
                energy_level=2,
            )
            WeightEntry.objects.create(user=self.user, date=d, weight_kg=79.5)

        response = self.client.get('/api/analytics/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        pacing = data['journey_pacing']
        rec = pacing['recovery']
        self.assertTrue(rec['fatigue_debt_detected'])
        self.assertEqual(rec['status'], 'FATIGUE_RISK')
        # Rule 5 check in insight
        self.assertIn('Rule 5', pacing['copilot_insight'])

