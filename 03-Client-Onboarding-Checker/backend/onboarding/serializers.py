from rest_framework import serializers
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
from onboarding.services.credential_detector import scan_for_credentials


class ClientAccountSerializer(serializers.ModelSerializer):
    cases_count = serializers.IntegerField(source='cases.count', read_only=True)

    class Meta:
        model = ClientAccount
        fields = [
            'id',
            'name',
            'company',
            'contact_email',
            'contact_person',
            'notes',
            'cases_count',
            'created_at',
            'updated_at',
        ]


class ChecklistItemSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = ChecklistItem
        fields = [
            'id',
            'template',
            'title',
            'description',
            'category',
            'category_display',
            'is_required',
            'acceptable_evidence',
            'order',
            'is_active',
        ]


class ChecklistTemplateSerializer(serializers.ModelSerializer):
    items = ChecklistItemSerializer(many=True, read_only=True)
    items_count = serializers.IntegerField(source='items.count', read_only=True)
    service_type = serializers.CharField(source='category', read_only=True)
    service_type_display = serializers.CharField(source='category', read_only=True)

    class Meta:
        model = ChecklistTemplate
        fields = [
            'id',
            'name',
            'description',
            'category',
            'service_type',
            'service_type_display',
            'is_active',
            'is_default',
            'items_count',
            'items',
            'created_at',
            'updated_at',
        ]


class SubmissionItemSerializer(serializers.ModelSerializer):
    checklist_item_details = ChecklistItemSerializer(source='checklist_item', read_only=True)
    checklist_item_detail = ChecklistItemSerializer(source='checklist_item', read_only=True)
    received_status_display = serializers.CharField(source='get_received_status_display', read_only=True)
    has_sensitive_data = serializers.SerializerMethodField()

    class Meta:
        model = SubmissionItem
        fields = [
            'id',
            'case',
            'checklist_item',
            'checklist_item_details',
            'checklist_item_detail',
            'received_status',
            'received_status_display',
            'file_name',
            'file_size',
            'file_type',
            'file_upload',
            'reviewer_notes',
            'submitted_date',
            'reviewed_at',
            'has_sensitive_data',
            'created_at',
            'updated_at',
        ]

    def get_has_sensitive_data(self, obj):
        text = f"{obj.reviewer_notes or ''} {obj.file_name or ''}"
        return scan_for_credentials(text)['has_secrets']


class FindingSerializer(serializers.ModelSerializer):
    finding_type_display = serializers.CharField(source='get_finding_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    checklist_item_title = serializers.CharField(source='checklist_item.title', read_only=True, default='')

    class Meta:
        model = Finding
        fields = [
            'id',
            'case',
            'checklist_item',
            'checklist_item_title',
            'finding_type',
            'finding_type_display',
            'severity',
            'severity_display',
            'title',
            'explanation',
            'suggested_next_step',
            'status',
            'is_human_confirmed',
            'has_sensitive_data_alert',
            'created_at',
            'updated_at',
        ]


class FollowUpMessageSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = FollowUpMessage
        fields = [
            'id',
            'case',
            'recipient_name',
            'subject',
            'greeting',
            'body',
            'status',
            'status_display',
            'created_at',
            'updated_at',
        ]


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = ['id', 'action', 'details', 'timestamp']


class OnboardingCaseListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_company = serializers.CharField(source='client.company', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    template_name = serializers.CharField(source='checklist_template.name', read_only=True, default='None')
    total_submissions = serializers.IntegerField(source='submissions.count', read_only=True)
    received_count = serializers.SerializerMethodField()
    open_findings_count = serializers.SerializerMethodField()
    has_security_warnings = serializers.SerializerMethodField()

    class Meta:
        model = OnboardingCase
        fields = [
            'id',
            'client',
            'client_name',
            'client_company',
            'project_name',
            'service_type',
            'service_type_display',
            'checklist_template',
            'template_name',
            'status',
            'status_display',
            'total_submissions',
            'received_count',
            'open_findings_count',
            'has_security_warnings',
            'target_launch_date',
            'created_at',
            'updated_at',
        ]

    def get_received_count(self, obj):
        return obj.submissions.filter(received_status='received').count()

    def get_open_findings_count(self, obj):
        return obj.findings.filter(status='open').count()

    def get_has_security_warnings(self, obj):
        return obj.findings.filter(status='open', finding_type='security_concern').exists()


class OnboardingCaseDetailSerializer(serializers.ModelSerializer):
    client = ClientAccountSerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=ClientAccount.objects.all(),
        source='client',
        write_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    checklist_template = ChecklistTemplateSerializer(read_only=True)
    checklist_template_id = serializers.PrimaryKeyRelatedField(
        queryset=ChecklistTemplate.objects.all(),
        source='checklist_template',
        write_only=True,
        required=False,
        allow_null=True
    )
    submissions = SubmissionItemSerializer(many=True, read_only=True)
    findings = FindingSerializer(many=True, read_only=True)
    follow_up_message = FollowUpMessageSerializer(read_only=True)
    activity_logs = ActivityLogSerializer(many=True, read_only=True)
    completion_stats = serializers.SerializerMethodField()

    class Meta:
        model = OnboardingCase
        fields = [
            'id',
            'client',
            'client_id',
            'project_name',
            'service_type',
            'service_type_display',
            'checklist_template',
            'checklist_template_id',
            'status',
            'status_display',
            'notes',
            'target_launch_date',
            'submissions',
            'findings',
            'follow_up_message',
            'activity_logs',
            'completion_stats',
            'created_at',
            'updated_at',
        ]

    def get_completion_stats(self, obj):
        total = obj.submissions.count()
        received = obj.submissions.filter(received_status='received').count()
        missing = obj.submissions.filter(received_status='missing').count()
        incomplete = obj.submissions.filter(received_status='incomplete').count()
        rate = round((received / total * 100), 1) if total > 0 else 0
        security_count = obj.findings.filter(status='open', finding_type='security_concern').count()
        return {
            'total': total,
            'received': received,
            'missing': missing,
            'incomplete': incomplete,
            'completion_rate': rate,
            'security_warnings': security_count,
        }

