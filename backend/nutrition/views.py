from datetime import date
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import MacroTarget, NutritionDay, MealEntry
from .serializers import MacroTargetSerializer, NutritionDaySerializer, MealEntrySerializer

class NutritionDayView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, date_str=None):
        if not date_str or date_str == 'today':
            target_date = date.today()
        else:
            try:
                target_date = date.fromisoformat(date_str)
            except ValueError:
                target_date = date.today()

        day, _ = NutritionDay.objects.get_or_create(user=request.user, date=target_date)
        target, _ = MacroTarget.objects.get_or_create(user=request.user)

        return Response({
            'day': NutritionDaySerializer(day).data,
            'targets': MacroTargetSerializer(target).data
        })

    def patch(self, request, date_str=None):
        target_date = date.today() if not date_str or date_str == 'today' else date.fromisoformat(date_str)
        day, _ = NutritionDay.objects.get_or_create(user=request.user, date=target_date)
        
        water = request.data.get('water_consumed_ml')
        if water is not None:
            day.water_consumed_ml = water
            day.save()
            
        return Response(NutritionDaySerializer(day).data)

class MealEntryViewSet(viewsets.ModelViewSet):
    serializer_class = MealEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MealEntry.objects.filter(nutrition_day__user=self.request.user)

    def perform_create(self, serializer):
        date_str = self.request.data.get('date')
        target_date = date.fromisoformat(date_str) if date_str else date.today()
        day, _ = NutritionDay.objects.get_or_create(user=self.request.user, date=target_date)
        serializer.save(nutrition_day=day)

class MacroTargetView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        target, _ = MacroTarget.objects.get_or_create(user=request.user)
        return Response(MacroTargetSerializer(target).data)

    def put(self, request):
        target, _ = MacroTarget.objects.get_or_create(user=request.user)
        serializer = MacroTargetSerializer(target, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
