from django.urls import path, include
from rest_framework.routers import DefaultRouter
from onboarding.views import (
    ClientAccountViewSet,
    ChecklistTemplateViewSet,
    ChecklistItemViewSet,
    OnboardingCaseViewSet,
    SubmissionItemViewSet,
    FindingViewSet,
    FollowUpMessageViewSet,
    dashboard_stats,
    health_check,
)

router = DefaultRouter()
router.register(r'clients', ClientAccountViewSet)
router.register(r'templates', ChecklistTemplateViewSet)
router.register(r'checklist-items', ChecklistItemViewSet)
router.register(r'cases', OnboardingCaseViewSet)
router.register(r'submissions', SubmissionItemViewSet)
router.register(r'findings', FindingViewSet)
router.register(r'followup', FollowUpMessageViewSet, basename='followup')
router.register(r'follow-ups', FollowUpMessageViewSet, basename='follow-ups')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('health/', health_check, name='health-check'),
]

