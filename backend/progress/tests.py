from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from users.models import User
from progress.models import BodyMeasurement

class BodyMeasurementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="athlete@example.com",
            username="athlete",
            password="securepassword123"
        )
        self.client.force_authenticate(user=self.user)

    def test_create_body_measurement(self):
        payload = {
            "date": "2026-09-18",
            "neck_cm": 38.5,
            "shoulders_cm": 122.0,
            "chest_cm": 104.5,
            "waist_cm": 82.0,
            "hips_cm": 98.0,
            "arms_cm": 38.0,
            "biceps_left_cm": 38.0,
            "biceps_right_cm": 38.2,
            "forearms_cm": 31.0,
            "thighs_cm": 59.0,
            "thigh_left_cm": 59.0,
            "thigh_right_cm": 59.2,
            "calves_cm": 38.0,
            "calf_left_cm": 38.0,
            "calf_right_cm": 38.1,
            "notes": "Feeling lean and strong"
        }
        res = self.client.post("/api/progress/measurements/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["shoulders_cm"], 122.0)
        self.assertEqual(res.data["biceps_right_cm"], 38.2)

        measurement = BodyMeasurement.objects.get(id=res.data["id"])
        self.assertEqual(measurement.neck_cm, 38.5)
        self.assertEqual(measurement.user, self.user)

    def test_list_and_delete_measurements(self):
        m = BodyMeasurement.objects.create(
            user=self.user,
            date=date(2026, 9, 10),
            chest_cm=102.0,
            waist_cm=84.0,
            shoulders_cm=120.0
        )
        res = self.client.get("/api/progress/measurements/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get("results", res.data)
        self.assertGreaterEqual(len(results), 1)

        del_res = self.client.delete(f"/api/progress/measurements/{m.id}/")
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(BodyMeasurement.objects.filter(id=m.id).exists())
