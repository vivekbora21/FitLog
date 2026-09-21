from datetime import date
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from workouts.models import JourneyProgram, ProgramDay, Routine

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
