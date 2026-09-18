from django.db import models
from django.conf import settings
from core.models import UUIDTimeStampedModel

class MacroTarget(UUIDTimeStampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='macro_target'
    )
    daily_calories = models.PositiveIntegerField(default=2400)
    protein_g = models.PositiveIntegerField(default=160)
    carbs_g = models.PositiveIntegerField(default=250)
    fat_g = models.PositiveIntegerField(default=70)
    water_ml = models.PositiveIntegerField(default=3000)

    def __str__(self):
        return f"Targets for {self.user.email}: {self.daily_calories} kcal"

class NutritionDay(UUIDTimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='nutrition_days'
    )
    date = models.DateField()
    water_consumed_ml = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-date']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'date'],
                name='unique_user_nutrition_day'
            )
        ]

    def total_calories(self):
        return sum(m.calories for m in self.meals.all())

    def total_protein(self):
        return round(sum(m.protein_g for m in self.meals.all()), 1)

    def total_carbs(self):
        return round(sum(m.carbs_g for m in self.meals.all()), 1)

    def total_fat(self):
        return round(sum(m.fat_g for m in self.meals.all()), 1)

    def __str__(self):
        return f"{self.user.email} - {self.date}"

class MealEntry(UUIDTimeStampedModel):
    MEAL_TYPES = [
        ('BREAKFAST', 'Breakfast'),
        ('LUNCH', 'Lunch'),
        ('DINNER', 'Dinner'),
        ('SNACK', 'Snack / Pre-Workout'),
    ]

    nutrition_day = models.ForeignKey(NutritionDay, on_delete=models.CASCADE, related_name='meals')
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPES, default='BREAKFAST')
    name = models.CharField(max_length=150)
    calories = models.PositiveIntegerField()
    protein_g = models.FloatField(default=0.0)
    carbs_g = models.FloatField(default=0.0)
    fat_g = models.FloatField(default=0.0)
    time_logged = models.TimeField(auto_now_add=True)

    class Meta:
        ordering = ['time_logged']

    def __str__(self):
        return f"[{self.meal_type}] {self.name} ({self.calories} kcal)"
