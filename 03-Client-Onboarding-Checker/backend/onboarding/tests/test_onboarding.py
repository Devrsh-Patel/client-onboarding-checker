from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from onboarding.models import (
    ClientAccount,
    ChecklistTemplate,
    ChecklistItem,
    OnboardingCase,
    SubmissionItem,
    Finding,
    FollowUpMessage,
)
from onboarding.services.credential_detector import scan_for_credentials, sanitize_submission_notes
from onboarding.services.gap_analyzer import run_gap_analysis
from onboarding.services.followup_generator import generate_follow_up_message


class CredentialDetectorTests(TestCase):
    """
    Tests conservative credential & sensitive secret detection and redaction.
    """
    def test_aws_access_key_detection(self):
        sample = "Developer note: AWS key is AKIAIOSFODNN7EXAMPLE for staging."
        result = scan_for_credentials(sample)
        self.assertTrue(result['has_secrets'])
        self.assertEqual(result['match_count'], 1)
        self.assertEqual(result['detections'][0]['type'], 'AWS Access Key ID')
        self.assertIn('[REDACTED_AWS_ACCESS_KEY]', result['redacted_text'])
        self.assertNotIn('AKIAIOSFODNN7EXAMPLE', result['redacted_text'])

    def test_stripe_key_detection(self):
        sample = "Stripe secret: sk_live_51A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P"
        result = scan_for_credentials(sample)
        self.assertTrue(result['has_secrets'])
        self.assertIn('[REDACTED_STRIPE_KEY]', result['redacted_text'])
        self.assertNotIn('sk_live_51A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P', result['redacted_text'])

    def test_password_string_detection(self):
        sample = "Database password: MySecretP@ssword123; host: db.internal"
        result = scan_for_credentials(sample)
        self.assertTrue(result['has_secrets'])
        self.assertIn('[REDACTED_PASSWORD]', result['redacted_text'])
        self.assertNotIn('MySecretP@ssword123', result['redacted_text'])

    def test_openai_api_key_detection(self):
        sample = "Use model key: sk-abcdef1234567890abcdef1234567890"
        result = scan_for_credentials(sample)
        self.assertTrue(result['has_secrets'])
        self.assertIn('[REDACTED_OPENAI_KEY]', result['redacted_text'])

    def test_legitimate_technical_text_no_false_positives(self):
        legitimate = (
            "We discussed the React 19 frontend architecture, Tailwind styling, "
            "and Docker container deployment window scheduled for Saturday."
        )
        result = scan_for_credentials(legitimate)
        self.assertFalse(result['has_secrets'])
        self.assertEqual(result['match_count'], 0)
        self.assertEqual(result['redacted_text'], legitimate)


class GapAnalyzerTests(TestCase):
    """
    Tests gap analysis, requirement matching, and finding generation.
    """
    def setUp(self):
        self.client_account = ClientAccount.objects.create(
            name="Test Client Corp",
            company="Test Client Ltd"
        )
        self.template = ChecklistTemplate.objects.create(
            name="Test Web Template",
            category="Web Development"
        )
        self.item_req = ChecklistItem.objects.create(
            template=self.template,
            title="Production Domain DNS Delegation",
            is_required=True,
            category="technical_details",
            acceptable_evidence="Cloudflare DNS Delegation",
            order=1
        )
        self.item_opt = ChecklistItem.objects.create(
            template=self.template,
            title="Staging Analytics Tracking ID",
            is_required=False,
            category="content",
            order=2
        )
        self.case = OnboardingCase.objects.create(
            client=self.client_account,
            project_name="E-Commerce Launch",
            checklist_template=self.template,
            service_type="web_app"
        )

    def test_missing_required_item_generates_high_severity_finding(self):
        result = run_gap_analysis(self.case)
        self.assertEqual(result['status'], 'success')

        finding = Finding.objects.filter(
            case=self.case,
            checklist_item=self.item_req,
            finding_type='missing_item'
        ).first()
        self.assertIsNotNone(finding)
        self.assertEqual(finding.severity, 'high')
        self.assertIn("Production Domain DNS Delegation", finding.title)

    def test_received_item_resolves_gap(self):
        sub = SubmissionItem.objects.get(case=self.case, checklist_item=self.item_req)
        sub.received_status = 'received'
        sub.file_name = 'dns_records.csv'
        sub.save()

        result = run_gap_analysis(self.case)
        self.assertEqual(result['metrics']['missing_required_count'], 0)
        self.assertEqual(result['metrics']['received_count'], 1)

    def test_insecure_credential_in_notes_triggers_security_alert(self):
        sub = SubmissionItem.objects.get(case=self.case, checklist_item=self.item_req)
        sub.reviewer_notes = "Client provided AWS key AKIA1234567890ABCDEF in onboarding note."
        sub.save()

        run_gap_analysis(self.case)

        sec_finding = Finding.objects.filter(
            case=self.case,
            finding_type='security_concern'
        ).first()
        self.assertIsNotNone(sec_finding)
        self.assertEqual(sec_finding.severity, 'high')
        self.assertTrue(sec_finding.has_sensitive_data_alert)


class FollowUpGeneratorTests(TestCase):
    """
    Tests client follow-up email/letter generation.
    """
    def setUp(self):
        self.client_account = ClientAccount.objects.create(
            name="Vanguard Logistics",
            contact_person="Sarah Connor"
        )
        self.template = ChecklistTemplate.objects.create(name="Logistics App Checklist")
        self.item = ChecklistItem.objects.create(
            template=self.template,
            title="Carrier API Documentation",
            is_required=True
        )
        self.case = OnboardingCase.objects.create(
            client=self.client_account,
            project_name="Fleet Management Portal",
            checklist_template=self.template
        )
        run_gap_analysis(self.case)

    def test_followup_message_includes_recipient_and_missing_items(self):
        msg = generate_follow_up_message(self.case)
        self.assertIn("Sarah Connor", msg.greeting)
        self.assertIn("Fleet Management Portal", msg.subject)
        self.assertIn("Carrier API Documentation", msg.body)
        self.assertIn("Outstanding Required Materials", msg.body)


class OnboardingAPITests(TestCase):
    """
    Tests REST API endpoints.
    """
    def setUp(self):
        self.api = APIClient()
        self.client_account = ClientAccount.objects.create(name="Nexus Enterprise")
        self.template = ChecklistTemplate.objects.create(name="Enterprise Template")
        self.item = ChecklistItem.objects.create(
            template=self.template,
            title="Architecture Topology",
            is_required=True
        )
        self.case = OnboardingCase.objects.create(
            client=self.client_account,
            project_name="Cloud Modernization",
            checklist_template=self.template
        )

    def test_dashboard_stats_endpoint(self):
        url = reverse('dashboard-stats')
        response = self.api.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_cases', response.data)
        self.assertIn('active_cases', response.data)
        self.assertIn('recent_cases', response.data)
        self.assertGreaterEqual(response.data['total_cases'], 1)

    def test_gap_analysis_endpoint(self):
        url = reverse('onboardingcase-analyze', kwargs={'pk': self.case.id})
        response = self.api.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('metrics', response.data)

    def test_generate_followup_endpoint(self):
        url = reverse('onboardingcase-generate-followup', kwargs={'pk': self.case.id})
        response = self.api.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('body', response.data)
        self.assertIn('subject', response.data)

    def test_export_csv_endpoint(self):
        url = reverse('onboardingcase-export-csv', kwargs={'pk': self.case.id})
        response = self.api.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('Checklist Item', response.content.decode('utf-8'))

    def test_export_report_md_endpoint(self):
        url = reverse('onboardingcase-export-report-md', kwargs={'pk': self.case.id})
        response = self.api.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/markdown')
        self.assertIn('Client Onboarding Review Report', response.content.decode('utf-8'))

    def test_health_endpoint(self):
        url = reverse('health-check')
        response = self.api.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'healthy')

    def test_create_case_via_api(self):
        payload = {
            'client_id': self.client_account.id,
            'project_name': 'Automated Test Case',
            'service_type': 'web_app',
            'checklist_template_id': self.template.id,
        }
        response = self.api.post('/api/cases/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['project_name'], 'Automated Test Case')
        self.assertGreaterEqual(len(response.data['submissions']), 1)

    def test_patch_followup_route(self):
        followup = FollowUpMessage.objects.create(
            case=self.case,
            subject='Initial draft',
            body='Please provide details.'
        )
        response = self.api.patch(f'/api/follow-ups/{followup.id}/', {'status': 'sent'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        followup.refresh_from_db()
        self.assertEqual(followup.status, 'sent')

