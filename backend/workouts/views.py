from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from .models import Routine, AssignedWorkout, WorkoutSession, JourneyProgram, CardioEntry
from .serializers import RoutineSerializer, AssignedWorkoutSerializer, WorkoutSessionSerializer, ProgramDaySerializer, CardioEntrySerializer
from memberships.models import TrainerClientAssignment, GymMembership
from core.models import AuditLog
from notifications.models import Notification

class WorkoutSessionViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        client_id = self.request.query_params.get('client_id')

        if client_id:
            # Check if requesting user is assigned trainer for this client and client shared workouts
            is_coach = TrainerClientAssignment.objects.filter(
                trainer_membership__user=user,
                client_membership__user_id=client_id,
                is_active=True,
                client_membership__share_workouts_with_trainers=True
            ).exists()
            if is_coach:
                return WorkoutSession.objects.filter(user_id=client_id).prefetch_related(
                    'exercises__sets', 'exercises__exercise'
                )
            return WorkoutSession.objects.none()

        # By default, member sees their own personal sessions
        return WorkoutSession.objects.filter(user=user).prefetch_related(
            'exercises__sets', 'exercises__exercise'
        )

    @action(detail=False, methods=['get'], url_path='today')
    def today(self, request):
        program = JourneyProgram.objects.filter(user=request.user, active=True).first()
        if not program:
            return Response({'program': None, 'today': None})
        day = program.days.filter(day_number=program.current_day).select_related('routine').prefetch_related('routine__exercises__exercise').first()
        return Response({'program': {'id': str(program.id), 'current_day': program.current_day, 'duration_days': program.duration_days}, 'today': ProgramDaySerializer(day).data if day else None})

    @action(detail=False, methods=['get'], url_path='plan')
    def plan(self, request):
        program = JourneyProgram.objects.filter(user=request.user, active=True).first()
        if not program:
            return Response({'program': None, 'days': []})
        days = program.days.select_related('routine').prefetch_related(
            'routine__exercises__exercise',
            'routine__exercises__exercise__primary_muscle'
        ).order_by('day_number')
        return Response({
            'program': {
                'id': str(program.id),
                'name': program.name,
                'start_date': program.start_date,
                'current_day': program.current_day,
                'duration_days': program.duration_days,
                'target_cardio_minutes_early': program.target_cardio_minutes_early,
                'target_cardio_minutes_later': program.target_cardio_minutes_later,
            },
            'days': ProgramDaySerializer(days, many=True).data,
        })

class RoutineViewSet(viewsets.ModelViewSet):
    serializer_class = RoutineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # User's active gym IDs
        user_gym_ids = GymMembership.objects.filter(user=user, status='ACTIVE').values_list('gym_id', flat=True)

        # Personal routines OR templates from gyms user belongs to
        return Routine.objects.filter(
            models.Q(user=user) | models.Q(gym_id__in=user_gym_ids)
        ).prefetch_related('exercises__exercise').distinct()

class AssignedWorkoutViewSet(viewsets.ModelViewSet):
    serializer_class = AssignedWorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Return workouts assigned TO the user, or workouts assigned BY the user (if trainer)
        return AssignedWorkout.objects.filter(
            models.Q(client=user) | models.Q(trainer=user)
        ).select_related('routine', 'client', 'trainer', 'gym').order_by('-scheduled_date')

    @action(detail=True, methods=['post'], url_path='feedback')
    def give_feedback(self, request, pk=None):
        assigned = self.get_object()
        feedback = request.data.get('feedback', '')
        if not feedback:
            return Response({'error': 'Feedback text is required.'}, status=status.HTTP_400_BAD_REQUEST)

        assigned.trainer_feedback = feedback
        assigned.feedback_date = timezone.now()
        assigned.save()

        # Notify member
        Notification.objects.create(
            recipient=assigned.client,
            actor=request.user,
            gym=assigned.gym,
            verb='FEEDBACK_POSTED',
            message=f"Coach {request.user.get_full_name() or request.user.email} left feedback on your workout: {assigned.routine.name}",
            target_type='AssignedWorkout',
            target_id=str(assigned.id)
        )

        AuditLog.objects.create(
            actor=request.user,
            gym=assigned.gym,
            action='FEEDBACK_POSTED',
            resource_type='AssignedWorkout',
            resource_id=str(assigned.id),
            details={'client': assigned.client.email, 'routine': assigned.routine.name}
        )

        return Response(AssignedWorkoutSerializer(assigned).data)

class CardioEntryViewSet(viewsets.ModelViewSet):
    serializer_class = CardioEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return CardioEntry.objects.filter(user=self.request.user).order_by('-date')
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
