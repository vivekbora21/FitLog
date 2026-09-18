from django.db import models
from django.conf import settings
from core.models import UUIDTimeStampedModel

class Routine(UUIDTimeStampedModel):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    gym = models.ForeignKey(
        'gyms.Gym',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='routines'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='personal_routines'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_routines'
    )
    last_modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='modified_routines'
    )

    def is_gym_template(self):
        return self.gym is not None

    def __str__(self):
        prefix = f"[{self.gym.name} Template] " if self.gym else "[Personal] "
        return f"{prefix}{self.name}"

class RoutineExercise(UUIDTimeStampedModel):
    routine = models.ForeignKey(Routine, on_delete=models.CASCADE, related_name='exercises')
    exercise = models.ForeignKey('exercises.Exercise', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=1)
    target_sets = models.PositiveIntegerField(default=3)
    target_reps = models.CharField(max_length=20, default='8-12')
    rest_seconds = models.PositiveIntegerField(default=90)
    notes = models.TextField(blank=True, default='')
    target_rpe = models.FloatField(null=True, blank=True)
    suggested_weight_kg = models.FloatField(null=True, blank=True)
    focus = models.CharField(max_length=80, blank=True, default='')

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.routine.name} - #{self.order} {self.exercise.name}"

class JourneyProgram(UUIDTimeStampedModel):
    """Calendar-independent member program; it advances only on completion."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='journey_programs')
    name = models.CharField(max_length=150, default='60-Day Fitness Journey')
    start_date = models.DateField()
    duration_days = models.PositiveSmallIntegerField(default=60)
    current_day = models.PositiveSmallIntegerField(default=1)
    active = models.BooleanField(default=True)
    target_cardio_minutes_early = models.PositiveSmallIntegerField(default=120)
    target_cardio_minutes_later = models.PositiveSmallIntegerField(default=150)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['user'], condition=models.Q(active=True), name='one_active_journey_per_user')]

class ProgramDay(UUIDTimeStampedModel):
    STATUS_CHOICES = [('UPCOMING', 'Upcoming'), ('COMPLETED', 'Completed'), ('MISSED', 'Missed')]
    program = models.ForeignKey(JourneyProgram, on_delete=models.CASCADE, related_name='days')
    day_number = models.PositiveSmallIntegerField()
    routine = models.ForeignKey(Routine, on_delete=models.PROTECT, related_name='program_days')
    label = models.CharField(max_length=60, blank=True, default='')
    is_optional = models.BooleanField(default=False)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='UPCOMING')
    completed_session = models.OneToOneField('WorkoutSession', null=True, blank=True, on_delete=models.SET_NULL, related_name='program_day_completion')
    class Meta:
        ordering = ['day_number']
        constraints = [models.UniqueConstraint(fields=['program', 'day_number'], name='unique_program_day')]
        indexes = [models.Index(fields=['program', 'status'])]

class CardioEntry(UUIDTimeStampedModel):
    MODALITIES = [('TREADMILL', 'Treadmill'), ('CYCLING', 'Cycling'), ('CROSS_TRAINER', 'Cross Trainer'), ('ELLIPTICAL', 'Elliptical'), ('ROWING', 'Rowing'), ('OTHER', 'Other')]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cardio_entries')
    date = models.DateField()
    modality = models.CharField(max_length=20, choices=MODALITIES)
    duration_minutes = models.PositiveSmallIntegerField()
    intensity = models.CharField(max_length=40, default='Zone 2')
    heart_rate = models.PositiveSmallIntegerField(null=True, blank=True)
    target_zone = models.CharField(max_length=40, blank=True, default='')
    completed = models.BooleanField(default=True)

class AssignedWorkout(UUIDTimeStampedModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('SKIPPED', 'Skipped'),
    ]

    gym = models.ForeignKey(
        'gyms.Gym',
        on_delete=models.CASCADE,
        related_name='assigned_workouts'
    )
    trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trainer_assignments_made'
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assigned_workouts_received'
    )
    routine = models.ForeignKey(Routine, on_delete=models.CASCADE, related_name='assignments')
    scheduled_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    trainer_feedback = models.TextField(blank=True, default='')
    feedback_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-scheduled_date']

    def __str__(self):
        return f"Assigned: {self.routine.name} to {self.client.email} ({self.status})"

class WorkoutSession(UUIDTimeStampedModel):
    """
    Member-owned personal workout session.
    Retained for life by user, with optional gym & assigned program context.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='workout_sessions'
    )
    gym = models.ForeignKey(
        'gyms.Gym',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logged_sessions'
    )
    assigned_workout = models.OneToOneField(
        AssignedWorkout,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_session'
    )
    routine = models.ForeignKey(
        Routine,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sessions'
    )
    title = models.CharField(max_length=150, default='Workout Session')
    started_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    overall_rpe = models.PositiveSmallIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-started_at']

    def total_volume_kg(self):
        total = 0.0
        for we in self.exercises.all():
            for s in we.sets.filter(completed=True):
                total += (s.weight_kg * s.reps)
        return round(total, 1)

    def __str__(self):
        return f"{self.title} - {self.user.email} ({self.started_at.strftime('%Y-%m-%d')})"

class WorkoutExercise(UUIDTimeStampedModel):
    """
    Structural bridge between WorkoutSession and WorkoutSet.
    Enables exercise-level ordering, notes, and superset logic.
    """
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name='exercises')
    exercise = models.ForeignKey('exercises.Exercise', on_delete=models.CASCADE, related_name='performed_exercises')
    order = models.PositiveIntegerField(default=1)
    rest_seconds = models.PositiveIntegerField(default=90)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.session.title} - #{self.order} {self.exercise.name}"

class WorkoutSet(UUIDTimeStampedModel):
    SET_TYPES = [
        ('WARMUP', 'Warmup'),
        ('NORMAL', 'Normal'),
        ('DROP', 'Drop Set'),
        ('FAILURE', 'To Failure'),
    ]

    workout_exercise = models.ForeignKey(WorkoutExercise, on_delete=models.CASCADE, related_name='sets')
    set_number = models.PositiveIntegerField(default=1)
    set_type = models.CharField(max_length=15, choices=SET_TYPES, default='NORMAL')
    weight_kg = models.FloatField(default=0)
    reps = models.PositiveIntegerField(default=0)
    rpe = models.FloatField(null=True, blank=True)
    completed = models.BooleanField(default=True)

    class Meta:
        ordering = ['set_number']

    def volume_kg(self):
        return round(self.weight_kg * self.reps, 1) if self.completed else 0.0

    def __str__(self):
        return f"Set {self.set_number}: {self.weight_kg}kg x {self.reps} reps"
