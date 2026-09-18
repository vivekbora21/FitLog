from django.db import models
from django.conf import settings
from core.models import UUIDTimeStampedModel

class WeightEntry(UUIDTimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='weight_entries'
    )
    date = models.DateField()
    weight_kg = models.FloatField()
    body_fat_pct = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-date']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'date'],
                name='unique_user_weight_date'
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.date}: {self.weight_kg}kg"

class BodyMeasurement(UUIDTimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='body_measurements'
    )
    date = models.DateField()
    # Torso & Core
    neck_cm = models.FloatField(null=True, blank=True)
    shoulders_cm = models.FloatField(null=True, blank=True)
    chest_cm = models.FloatField(null=True, blank=True)
    waist_cm = models.FloatField(null=True, blank=True)
    hips_cm = models.FloatField(null=True, blank=True)

    # Arms
    arms_cm = models.FloatField(null=True, blank=True)
    biceps_left_cm = models.FloatField(null=True, blank=True)
    biceps_right_cm = models.FloatField(null=True, blank=True)
    forearms_cm = models.FloatField(null=True, blank=True)

    # Legs
    thighs_cm = models.FloatField(null=True, blank=True)
    thigh_left_cm = models.FloatField(null=True, blank=True)
    thigh_right_cm = models.FloatField(null=True, blank=True)
    calves_cm = models.FloatField(null=True, blank=True)
    calf_left_cm = models.FloatField(null=True, blank=True)
    calf_right_cm = models.FloatField(null=True, blank=True)

    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Measurements {self.user.email} on {self.date}"

class PersonalRecord(UUIDTimeStampedModel):
    """
    Tracks all-time personal bests and calculated 1RM for exercises.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='personal_records'
    )
    exercise = models.ForeignKey(
        'exercises.Exercise',
        on_delete=models.CASCADE,
        related_name='prs'
    )
    max_weight_kg = models.FloatField()
    reps = models.PositiveIntegerField(default=1)
    estimated_one_rep_max = models.FloatField()
    achieved_at = models.DateField()

    class Meta:
        ordering = ['-estimated_one_rep_max']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'exercise'],
                name='unique_user_exercise_pr'
            )
        ]

    @staticmethod
    def calculate_epley_1rm(weight: float, reps: int) -> float:
        """Epley 1RM formula: weight * (1 + reps / 30)"""
        if reps <= 1:
            return round(weight, 1)
        return round(weight * (1 + (reps / 30.0)), 1)

    def __str__(self):
        return f"PR: {self.exercise.name} - {self.max_weight_kg}kg x {self.reps} (1RM: {self.estimated_one_rep_max}kg)"
