import uuid
from django.db import models


class ClientAccount(models.Model):
    """
    Non-sensitive client profile and contact details.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, help_text="Client or organization name")
    company = models.CharField(max_length=200, blank=True, help_text="Company trading or legal name")
    contact_email = models.EmailField(blank=True)
    contact_person = models.CharField(max_length=150, blank=True)
    notes = models.TextField(blank=True, help_text="General client context (non-sensitive)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.company})" if self.company else self.name


class ChecklistTemplate(models.Model):
    """
    Reusable onboarding checklist templates (e.g. Web App MVP, AI Integration, Cloud Migration).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, default='General')
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', 'name']

    def __str__(self):
        return self.name


class ChecklistItem(models.Model):
    """
    Individual requirements belonging to a template.
    """
    CATEGORY_CHOICES = [
        ('brand_assets', 'Brand & Design Assets'),
        ('access_setup', 'Access & Environment Credentials'),
        ('content', 'Copy, Assets & Content'),
        ('technical_details', 'Technical Specifications & Architecture'),
        ('approvals', 'Approvals & Governance'),
        ('legal', 'Legal & Compliance Agreements'),
        ('other', 'Other Requirements'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(ChecklistTemplate, related_name='items', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='technical_details')
    is_required = models.BooleanField(default=True, help_text="Required for launch / delivery")
    acceptable_evidence = models.TextField(
        blank=True,
        help_text="Examples of acceptable documentation or formats"
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order', 'title']

    def __str__(self):
        req = "[Required]" if self.is_required else "[Optional]"
        return f"{self.title} {req}"


class OnboardingCase(models.Model):
    """
    An onboarding case for a specific client and project engagement.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft Intake'),
        ('in_review', 'In Review'),
        ('awaiting_client', 'Awaiting Client Clarification'),
        ('ready_for_approval', 'Ready for Human Approval'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    SERVICE_CHOICES = [
        ('web_app', 'Web Application Development'),
        ('ai_agent', 'AI Agent / LLM Integration'),
        ('cloud_infrastructure', 'Cloud Infrastructure & DevOps'),
        ('branding_design', 'UX/UI & Brand Design'),
        ('custom_software', 'Custom Enterprise Software'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(ClientAccount, related_name='cases', on_delete=models.CASCADE)
    project_name = models.CharField(max_length=255)
    service_type = models.CharField(max_length=50, choices=SERVICE_CHOICES, default='web_app')
    checklist_template = models.ForeignKey(
        ChecklistTemplate,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='cases'
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True, help_text="Internal reviewer onboarding notes")
    target_launch_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.project_name} — {self.client.name}"

    def populate_submissions_from_template(self):
        """Creates submission tracking records for all template items."""
        if self.checklist_template:
            for item in self.checklist_template.items.filter(is_active=True):
                SubmissionItem.objects.get_or_create(
                    case=self,
                    checklist_item=item,
                    defaults={'received_status': 'missing'}
                )

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new and self.checklist_template:
            self.populate_submissions_from_template()


class SubmissionItem(models.Model):
    """
    Tracks client-submitted evidence for each checklist requirement.
    """
    STATUS_CHOICES = [
        ('received', 'Received'),
        ('missing', 'Missing'),
        ('incomplete', 'Incomplete'),
        ('needs_review', 'Needs Review'),
        ('not_applicable', 'Not Applicable'),
        ('awaiting_clarification', 'Awaiting Client Clarification'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(OnboardingCase, related_name='submissions', on_delete=models.CASCADE)
    checklist_item = models.ForeignKey(ChecklistItem, related_name='submissions', on_delete=models.CASCADE)
    received_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='missing')
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True, help_text="Size in bytes")
    file_type = models.CharField(max_length=100, blank=True)
    file_upload = models.FileField(upload_to='submissions/%Y/%m/', null=True, blank=True)
    reviewer_notes = models.TextField(blank=True)
    submitted_date = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('case', 'checklist_item')
        ordering = ['checklist_item__order']

    def __str__(self):
        return f"{self.checklist_item.title}: {self.get_received_status_display()}"


class Finding(models.Model):
    """
    Observations, gaps, security alerts, and questions identified during review.
    """
    TYPE_CHOICES = [
        ('missing_item', 'Missing Required Item'),
        ('incomplete_submission', 'Incomplete or Partial Submission'),
        ('unclear_requirement', 'Ambiguous / Unclear Requirement'),
        ('missing_approval', 'Missing Sign-Off / Approval'),
        ('security_concern', 'Security / Insecure Credential Alert'),
        ('question', 'Question for Client'),
    ]

    SEVERITY_CHOICES = [
        ('high', 'High Priority / Blocker'),
        ('medium', 'Medium Priority'),
        ('low', 'Low / Informational'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed / N/A'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(OnboardingCase, related_name='findings', on_delete=models.CASCADE)
    checklist_item = models.ForeignKey(ChecklistItem, null=True, blank=True, on_delete=models.SET_NULL)
    finding_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    title = models.CharField(max_length=255)
    explanation = models.TextField()
    suggested_next_step = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    is_human_confirmed = models.BooleanField(default=False)
    has_sensitive_data_alert = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-severity', 'created_at']

    def __str__(self):
        return f"[{self.get_severity_display()}] {self.title}"


class FollowUpMessage(models.Model):
    """
    Drafted follow-up communication based strictly on confirmed findings.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft (Pending Review)'),
        ('reviewed', 'Reviewed & Approved by Human'),
        ('sent', 'Sent to Client'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.OneToOneField(OnboardingCase, related_name='follow_up_message', on_delete=models.CASCADE)
    recipient_name = models.CharField(max_length=150, blank=True)
    subject = models.CharField(max_length=255, default="Scalezix Onboarding — Required Documentation & Next Steps")
    greeting = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Follow-up for {self.case.project_name} ({self.status})"


class ActivityLog(models.Model):
    """
    Audit trail for case changes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(OnboardingCase, related_name='activity_logs', on_delete=models.CASCADE)
    action = models.CharField(max_length=100)
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M')}: {self.action}"
