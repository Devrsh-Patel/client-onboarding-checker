"""
Gap Analyzer Service
Compares onboarding case submissions against checklist requirements,
identifies missing items, incomplete submissions, unclear specifications,
and runs credential security checks.
"""

from typing import Dict, Any, List
from django.utils import timezone
from onboarding.models import OnboardingCase, ChecklistItem, SubmissionItem, Finding, ActivityLog
from onboarding.services.credential_detector import scan_for_credentials


def run_gap_analysis(case: OnboardingCase, trigger_ai: bool = False) -> Dict[str, Any]:
    """
    Executes a comprehensive gap analysis for the provided onboarding case.
    Synchronizes submissions with template items, evaluates completeness,
    creates structured findings, checks for credentials, and calculates readiness.
    """
    template = case.checklist_template
    if not template:
        return {
            'status': 'error',
            'message': 'No checklist template is assigned to this onboarding case.',
            'findings_count': 0,
            'metrics': {},
        }

    items = ChecklistItem.objects.filter(template=template, is_active=True).order_by('order')

    # Ensure every checklist item has a corresponding SubmissionItem record
    existing_submissions = {sub.checklist_item_id: sub for sub in case.submissions.all()}
    for item in items:
        if item.id not in existing_submissions:
            sub = SubmissionItem.objects.create(
                case=case,
                checklist_item=item,
                received_status='missing',
            )
            existing_submissions[item.id] = sub

    # Reset or refresh automated findings while preserving human-confirmed states
    current_findings = {f.checklist_item_id: f for f in case.findings.filter(status='open')}

    new_findings_created = 0
    security_concerns_count = 0
    missing_required_count = 0
    incomplete_count = 0
    received_count = 0
    total_count = items.count()

    for item in items:
        submission = existing_submissions.get(item.id)
        status = submission.received_status if submission else 'missing'

        # ── 1. Check for Insecure Credentials in Notes or Filenames ──
        text_to_scan = f"{submission.reviewer_notes or ''} {submission.file_name or ''}"
        cred_scan = scan_for_credentials(text_to_scan)

        if cred_scan['has_secrets']:
            security_concerns_count += 1
            types_str = ", ".join(d['type'] for d in cred_scan['detections'])

            # Create or update security alert finding
            sec_finding, created = Finding.objects.get_or_create(
                case=case,
                checklist_item=item,
                finding_type='security_concern',
                defaults={
                    'severity': 'high',
                    'title': f"Security Warning: Potential Credential Exposed in '{item.title}'",
                    'explanation': (
                        f"Automated security check detected potential secret credentials ({types_str}) "
                        "in the submitted metadata or notes. Raw secrets must never be transmitted "
                        "or saved in unencrypted onboarding notes."
                    ),
                    'suggested_next_step': (
                        "Immediately redact the secret from this submission. Advise the client "
                        "to revoke/rotate this key and resubmit credentials via an approved encrypted password manager."
                    ),
                    'status': 'open',
                    'has_sensitive_data_alert': True,
                }
            )
            if created:
                new_findings_created += 1

        # ── 2. Requirement Gap Analysis ──
        if status == 'received':
            received_count += 1
            # Resolve any previous missing_item findings for this item
            Finding.objects.filter(
                case=case,
                checklist_item=item,
                finding_type__in=['missing_item', 'incomplete_submission']
            ).update(status='resolved')

        elif status == 'missing':
            if item.is_required:
                missing_required_count += 1
                finding, created = Finding.objects.get_or_create(
                    case=case,
                    checklist_item=item,
                    finding_type='missing_item',
                    defaults={
                        'severity': 'high',
                        'title': f"Missing Required Item: {item.title}",
                        'explanation': (
                            f"This required item is essential for project kickoff. "
                            f"Expected evidence: {item.acceptable_evidence or 'Documentation as specified'}"
                        ),
                        'suggested_next_step': (
                            f"Request {item.title} from the client in the upcoming onboarding follow-up message."
                        ),
                        'status': 'open',
                    }
                )
                if created:
                    new_findings_created += 1

        elif status == 'incomplete':
            incomplete_count += 1
            finding, created = Finding.objects.get_or_create(
                case=case,
                checklist_item=item,
                finding_type='incomplete_submission',
                defaults={
                    'severity': 'medium',
                    'title': f"Incomplete Submission: {item.title}",
                    'explanation': (
                        f"Submission was recorded but flagged as partial or incomplete. "
                        f"Reviewer notes: {submission.reviewer_notes or 'Pending full documentation.'}"
                    ),
                    'suggested_next_step': (
                        "Clarify remaining missing components with the client team."
                    ),
                    'status': 'open',
                }
            )
            if created:
                new_findings_created += 1

        elif status == 'needs_review':
            finding, created = Finding.objects.get_or_create(
                case=case,
                checklist_item=item,
                finding_type='unclear_requirement',
                defaults={
                    'severity': 'medium',
                    'title': f"Verification Required: {item.title}",
                    'explanation': (
                        f"Asset '{submission.file_name or 'Recorded submission'}' has been received "
                        "but requires inspection by the reviewer to confirm compliance with specifications."
                    ),
                    'suggested_next_step': "Inspect file contents and update status to Received or Incomplete.",
                    'status': 'open',
                }
            )
            if created:
                new_findings_created += 1

        elif status == 'awaiting_clarification':
            finding, created = Finding.objects.get_or_create(
                case=case,
                checklist_item=item,
                finding_type='question',
                defaults={
                    'severity': 'medium',
                    'title': f"Client Clarification Needed: {item.title}",
                    'explanation': (
                        f"Pending clarification from client. "
                        f"Notes: {submission.reviewer_notes or 'Specific requirements require client response.'}"
                    ),
                    'suggested_next_step': "Include clarification query in the client follow-up list.",
                    'status': 'open',
                }
            )
            if created:
                new_findings_created += 1

    # ── 3. Calculate Readiness & Status Recommendation ──
    completion_rate = round((received_count / total_count * 100), 1) if total_count > 0 else 0

    if missing_required_count == 0 and security_concerns_count == 0 and incomplete_count == 0:
        recommended_status = 'ready_for_approval'
    elif security_concerns_count > 0 or missing_required_count > 0:
        recommended_status = 'in_review'
    else:
        recommended_status = 'awaiting_client'

    # Auto-advance draft cases to in_review upon first analysis
    if case.status == 'draft':
        case.status = 'in_review'
        case.save(update_fields=['status', 'updated_at'])

    # Log Activity
    ActivityLog.objects.create(
        case=case,
        action='Gap Analysis Executed',
        details=(
            f"Evaluated {total_count} checklist items: {received_count} received, "
            f"{missing_required_count} missing required, {security_concerns_count} security alerts."
        )
    )

    metrics = {
        'total_items': total_count,
        'received_count': received_count,
        'missing_required_count': missing_required_count,
        'incomplete_count': incomplete_count,
        'security_concerns_count': security_concerns_count,
        'completion_rate': completion_rate,
        'recommended_status': recommended_status,
        'active_findings_count': case.findings.filter(status='open').count(),
    }

    return {
        'status': 'success',
        'case_id': str(case.id),
        'metrics': metrics,
        'findings_count': metrics['active_findings_count'],
        'security_concerns_count': security_concerns_count,
        'new_findings_created': new_findings_created,
        'message': f"Gap analysis complete. {metrics['active_findings_count']} open findings identified.",
    }

