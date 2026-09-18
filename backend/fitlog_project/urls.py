from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from users.views import RegisterView, MeView
from gyms.views import GymViewSet
from memberships.views import GymMembershipViewSet, TrainerClientViewSet, GymInvitationViewSet, AcceptInvitationView
from exercises.views import ExerciseViewSet, MuscleGroupViewSet, EquipmentTypeViewSet
from workouts.views import WorkoutSessionViewSet, RoutineViewSet, AssignedWorkoutViewSet, CardioEntryViewSet
from nutrition.views import NutritionDayView, MealEntryViewSet, MacroTargetView
from progress.views import WeightEntryViewSet, BodyMeasurementViewSet, PersonalRecordViewSet
from notifications.views import NotificationViewSet
from core.views import AuditLogViewSet
from analytics.views import DashboardStatsView

router = DefaultRouter()
router.register(r'gyms', GymViewSet, basename='gym')
router.register(r'memberships', GymMembershipViewSet, basename='membership')
router.register(r'trainer-clients', TrainerClientViewSet, basename='trainer-client')
router.register(r'invitations', GymInvitationViewSet, basename='invitation')
router.register(r'exercises', ExerciseViewSet, basename='exercise')
router.register(r'muscle-groups', MuscleGroupViewSet, basename='muscle-group')
router.register(r'equipment-types', EquipmentTypeViewSet, basename='equipment-type')
router.register(r'workouts/sessions', WorkoutSessionViewSet, basename='workout-session')
router.register(r'workouts/routines', RoutineViewSet, basename='routine')
router.register(r'assigned-workouts', AssignedWorkoutViewSet, basename='assigned-workout')
router.register(r'workouts/cardio', CardioEntryViewSet, basename='cardio')
router.register(r'nutrition/meals', MealEntryViewSet, basename='meal')
router.register(r'progress/weight', WeightEntryViewSet, basename='weight')
router.register(r'progress/measurements', BodyMeasurementViewSet, basename='measurement')
router.register(r'progress/prs', PersonalRecordViewSet, basename='pr')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', MeView.as_view(), name='auth_me'),

    # Custom Domain Actions
    path('api/invitations/<uuid:token>/accept/', AcceptInvitationView.as_view(), name='accept_invitation'),
    path('api/nutrition/macro-targets/', MacroTargetView.as_view(), name='macro_targets'),
    path('api/analytics/dashboard/', DashboardStatsView.as_view(), name='dashboard_stats'),

    # DRF Router endpoints
    path('api/', include(router.urls)),

    # Catch-all must come after the router so it doesn't shadow routes like /api/nutrition/meals/
    path('api/nutrition/<str:date_str>/', NutritionDayView.as_view(), name='nutrition_day'),
]
