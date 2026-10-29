import os
import csv
import io
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from onboarding.models import (
    ClientAccount,
    ChecklistTemplate,
    ChecklistItem,
    OnboardingCase,
    SubmissionItem,
    Finding,
    FollowUpMessage,
    ActivityLog,
)
from onboarding.serializers import (
    ClientAccountSerializer,
    ChecklistTemplateSerializer,
    ChecklistItemSerializer,
    OnboardingCaseListSerializer,
    OnboardingCaseDetailSerializer,
    SubmissionItemSerializer,
    FindingSerializer,
    FollowUpMessageSerializer,
)
from onboarding.services.gap_analyzer import run_gap_analysis
from onboarding.services.followup_generator import generate_follow_up_message
from onboarding.services.ai_service import analyze_case_with_ai
from onboarding.services.credential_detector import scan_for_credentials


class ClientAccountViewSet(viewsets.ModelViewSet):
    queryset = ClientAccount.objects.all()
    serializer_class = ClientAccountSerializer


class ChecklistTemplateViewSet(viewsets.ModelViewSet):
    queryset = ChecklistTemplate.objects.all()
    serializer_class = ChecklistTemplateSerializer

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        template = self.get_object()
        new_template = ChecklistTemplate.objects.create(
            name=f"{template.name} (Copy)",
            description=template.description,
            category=template.category,
            is_active=True,
            is_default=False,
        )
        for item in template.items.all():
            ChecklistItem.objects.create(
                template=new_template,
                title=item.title,
                description=item.description,
                category=item.category,
                is_required=item.is_required,
                acceptable_evidence=item.acceptable_evidence,
                order=item.order,
                is_active=item.is_active,
            )
        return Response(ChecklistTemplateSerializer(new_template).data, status=status.HTTP_201_CREATED)


class ChecklistItemViewSet(viewsets.ModelViewSet):
    queryset = ChecklistItem.objects.all()
    serializer_class = ChecklistItemSerializer


class OnboardingCaseViewSet(viewsets.ModelViewSet):
    queryset = OnboardingCase.objects.select_related('client', 'checklist_template').prefetch_related(
        'submissions__checklist_item', 'findings', 'activity_logs'
    ).all()

    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return OnboardingCaseDetailSerializer
        return OnboardingCaseListSerializer

    def perform_create(self, serializer):
        case = serializer.save()
        ActivityLog.objects.create(
            case=case,
            action='Case Created',
            details=f"Created onboarding case for {case.client.name} ({case.project_name})."
        )
        # Populate initial SubmissionItem records from selected template
        if case.checklist_template:
            for item in case.checklist_template.items.filter(is_active=True):
                SubmissionItem.objects.get_or_create(
                    case=case,
                    checklist_item=item,
                    defaults={'received_status': 'missing'}
                )
            # Run initial gap analysis
            run_gap_analysis(case)

    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        case = self.get_object()
        result = run_gap_analysis(case)
        return Response(result)

    @action(detail=True, methods=['post'])
    def ai_analyze(self, request, pk=None):
        case = self.get_object()
        result = analyze_case_with_ai(case)
        return Response(result)

    @action(detail=True, methods=['post'])
    def generate_followup(self, request, pk=None):
        case = self.get_object()
        message = generate_follow_up_message(case)
        return Response(FollowUpMessageSerializer(message).data)

    @action(detail=True, methods=['get'])
    def export_csv(self, request, pk=None):
        case = self.get_object()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{case.project_name.lower().replace(" ", "_")}_checklist.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Checklist Item', 'Category', 'Required', 'Status', 'File / Reference',
            'Notes (Sanitized)', 'Review Date'
        ])

        for sub in case.submissions.select_related('checklist_item').all():
            cred_res = scan_for_credentials(sub.reviewer_notes)
            writer.writerow([
                sub.checklist_item.title,
                sub.checklist_item.get_category_display(),
                'Yes' if sub.checklist_item.is_required else 'No',
                sub.get_received_status_display(),
                sub.file_name or 'None',
                cred_res['redacted_text'],
                sub.reviewed_at.strftime('%Y-%m-%d') if sub.reviewed_at else 'Pending'
            ])

        return response

    @action(detail=True, methods=['get'])
    def export_missing_csv(self, request, pk=None):
        case = self.get_object()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{case.project_name.lower().replace(" ", "_")}_missing_items.csv"'

        writer = csv.writer(response)
        writer.writerow(['Missing Requirement', 'Category', 'Required', 'Expected Evidence', 'Action Required'])

        missing_subs = case.submissions.filter(received_status__in=['missing', 'incomplete']).select_related('checklist_item')
        for sub in missing_subs:
            writer.writerow([
                sub.checklist_item.title,
                sub.checklist_item.get_category_display(),
                'Required' if sub.checklist_item.is_required else 'Optional',
                sub.checklist_item.acceptable_evidence or 'Documentation required',
                'Request from client' if sub.received_status == 'missing' else 'Clarify incomplete components'
            ])

        return response

    @action(detail=True, methods=['get'])
    def export_report_md(self, request, pk=None):
        case = self.get_object()
        response = HttpResponse(content_type='text/markdown')
        response['Content-Disposition'] = f'attachment; filename="{case.project_name.lower().replace(" ", "_")}_report.md"'

        total = case.submissions.count()
        received = case.submissions.filter(received_status='received').count()
        rate = round((received / total * 100), 1) if total > 0 else 0

        lines = [
            f"# Client Onboarding Review Report — {case.project_name}",
            f"**Client:** {case.client.name} ({case.client.company})  ",
            f"**Service:** {case.get_service_type_display()}  ",
            f"**Status:** {case.get_status_display()}  ",
            f"**Completion Rate:** {rate}% ({received}/{total} items received)  ",
            f"**Date Generated:** {timezone.now().strftime('%Y-%m-%d %H:%M UTC')}  ",
            "",
            "---",
            "",
            "## 1. Onboarding Checklist Summary",
            "",
            "| Item | Category | Required | Status | Evidence Reference |",
            "|---|---|---|---|---|",
        ]

        for sub in case.submissions.select_related('checklist_item').all():
            req_str = "Yes" if sub.checklist_item.is_required else "No"
            lines.append(f"| {sub.checklist_item.title} | {sub.checklist_item.get_category_display()} | {req_str} | {sub.get_received_status_display()} | {sub.file_name or '—'} |")

        lines.extend([
            "",
            "## 2. Active Review Findings & Security Alerts",
            "",
        ])

        open_findings = case.findings.filter(status='open')
        if open_findings.exists():
            for f in open_findings:
                lines.append(f"### [{f.get_severity_display()}] {f.title}")
                lines.append(f"- **Type:** {f.get_finding_type_display()}")
                lines.append(f"- **Explanation:** {f.explanation}")
                if f.suggested_next_step:
                    lines.append(f"- **Next Step:** {f.suggested_next_step}")
                lines.append("")
        else:
            lines.append("No open findings or blockers identified.")

        lines.extend([
            "",
            "---",
            "*Report generated by Scalezix Client Onboarding Document Checker. Requires human review before external distribution.*"
        ])

        response.write("\n".join(lines))
        return response


class SubmissionItemViewSet(viewsets.ModelViewSet):
    queryset = SubmissionItem.objects.all()
    serializer_class = SubmissionItemSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        # Check for potential credentials in submitted notes
        notes = request.data.get('reviewer_notes')
        if notes:
            cred_res = scan_for_credentials(notes)
            if cred_res['has_secrets']:
                Finding.objects.get_or_create(
                    case=instance.case,
                    checklist_item=instance.checklist_item,
                    finding_type='security_concern',
                    defaults={
                        'severity': 'high',
                        'title': f"Security Warning: Possible Credential Detected in '{instance.checklist_item.title}'",
                        'explanation': (
                            "Automated scanning detected potential API keys or passwords in the entered reviewer notes. "
                            "Plaintext secrets must not be stored in onboarding submissions."
                        ),
                        'suggested_next_step': "Redact the secret string immediately and request credentials via an encrypted manager.",
                        'status': 'open',
                        'has_sensitive_data_alert': True,
                    }
                )

        # File validation if file is uploaded
        uploaded_file = request.FILES.get('file_upload')
        if uploaded_file:
            allowed_exts = ['.pdf', '.png', '.jpg', '.jpeg', '.svg', '.docx', '.xlsx', '.csv', '.txt', '.json', '.zip']
            ext = os.path.splitext(uploaded_file.name)[1].lower()
            if ext not in allowed_exts:
                return Response(
                    {'error': f"Unsupported file format '{ext}'. Allowed formats: {', '.join(allowed_exts)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if uploaded_file.size > 10 * 1024 * 1024:
                return Response(
                    {'error': "File size exceeds the 10 MB limit."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        response = super().update(request, *args, **kwargs)

        # Auto-log and trigger gap analysis update
        instance.reviewed_at = timezone.now()
        instance.save(update_fields=['reviewed_at'])
        run_gap_analysis(instance.case)

        ActivityLog.objects.create(
            case=instance.case,
            action='Submission Updated',
            details=f"Updated status for '{instance.checklist_item.title}' to {instance.get_received_status_display()}."
        )

        return response


class FindingViewSet(viewsets.ModelViewSet):
    queryset = Finding.objects.all()
    serializer_class = FindingSerializer

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        finding = self.get_object()
        finding.is_human_confirmed = True
        finding.save(update_fields=['is_human_confirmed', 'updated_at'])
        return Response({'status': 'confirmed', 'id': str(finding.id)})

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        finding = self.get_object()
        finding.status = 'resolved'
        finding.save(update_fields=['status', 'updated_at'])
        return Response({'status': 'resolved', 'id': str(finding.id)})


class FollowUpMessageViewSet(viewsets.ModelViewSet):
    queryset = FollowUpMessage.objects.all()
    serializer_class = FollowUpMessageSerializer


@api_view(['GET'])
def dashboard_stats(request):
    """
    Returns aggregated real database metrics for the executive dashboard.
    """
    cases = OnboardingCase.objects.all()

    total_cases = cases.count()
    active_cases = cases.exclude(status__in=['completed', 'archived']).count()
    needs_review = cases.filter(status='in_review').count()
    awaiting_client = cases.filter(status='awaiting_client').count()
    approved_count = cases.filter(status='approved').count()

    missing_required_items = SubmissionItem.objects.filter(
        case__status__in=['draft', 'in_review', 'awaiting_client'],
        checklist_item__is_required=True,
        received_status='missing'
    ).count()

    security_alerts = Finding.objects.filter(
        status='open',
        finding_type='security_concern'
    ).count()

    recent_cases = OnboardingCaseListSerializer(cases.order_by('-updated_at')[:8], many=True).data

    cases_by_status = {
        'draft': cases.filter(status='draft').count(),
        'in_review': needs_review,
        'awaiting_client': awaiting_client,
        'approved': approved_count,
        'blocked': cases.filter(status='blocked').count(),
    }

    return Response({
        'total_cases': total_cases,
        'active_cases': active_cases,
        'needs_review': needs_review,
        'awaiting_client': awaiting_client,
        'cases_by_status': cases_by_status,
        'total_missing_items': missing_required_items,
        'missing_required_items': missing_required_items,
        'total_security_concerns': security_alerts,
        'security_alerts': security_alerts,
        'ready_cases_count': approved_count,
        'recent_cases': recent_cases,
    })


@api_view(['GET'])
def health_check(request):
    return Response({'status': 'healthy', 'service': 'Scalezix Client Onboarding Document Checker'})
