from rest_framework import serializers
from .models import MacroTarget, NutritionDay, MealEntry

class MealEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = MealEntry
        fields = ['id', 'meal_type', 'name', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'time_logged']

class NutritionDaySerializer(serializers.ModelSerializer):
    meals = MealEntrySerializer(many=True, read_only=True)
    total_calories = serializers.IntegerField(read_only=True)
    total_protein = serializers.FloatField(read_only=True)
    total_carbs = serializers.FloatField(read_only=True)
    total_fat = serializers.FloatField(read_only=True)

    class Meta:
        model = NutritionDay
        fields = [
            'id', 'user', 'date', 'water_consumed_ml', 'notes',
            'meals', 'total_calories', 'total_protein', 'total_carbs', 'total_fat'
        ]
        read_only_fields = ['user']

class MacroTargetSerializer(serializers.ModelSerializer):
    class Meta:
        model = MacroTarget
        fields = ['id', 'user', 'daily_calories', 'protein_g', 'carbs_g', 'fat_g', 'water_ml']
        read_only_fields = ['user']
