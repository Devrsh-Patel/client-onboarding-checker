from django.core.management.base import BaseCommand
from django.utils import timezone
from onboarding.models import (
    ClientAccount,
    ChecklistTemplate,
    ChecklistItem,
    OnboardingCase,
    SubmissionItem,
    Finding,
    ActivityLog,
)
from onboarding.services.gap_analyzer import run_gap_analysis
from onboarding.services.followup_generator import generate_follow_up_message


class Command(BaseCommand):
    help = 'Seeds standard onboarding checklist templates and clearly labelled fictional demo cases.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding standard checklist templates...")

        # ── 1. Web App MVP Template ──
        tmpl_web, _ = ChecklistTemplate.objects.get_or_create(
            name="Web Application MVP Onboarding Checklist",
            defaults={
                'description': "Standard onboarding requirements for modern full-stack web applications and SaaS MVPs.",
                'category': "Web Development",
                'is_active': True,
                'is_default': True,
            }
        )

        web_items = [
            ("Brand Guidelines & Vector Logo", "Vector SVG/EPS logo files, typography rules, brand color hex codes.", "brand_assets", True, "SVG, AI, PDF, Figma Brand Guide", 1),
            ("Figma UI/UX Prototype Link", "Link to finalized Figma design file with developer handoff specs enabled.", "brand_assets", True, "Figma URL with view/inspect permissions", 2),
            ("Product Requirements Document (PRD)", "Documented scope, user stories, acceptance criteria, and edge cases.", "content", True, "PDF, Google Doc, or Markdown PRD", 3),
            ("Staging Cloud Environment Access", "IAM invitation or access credentials to AWS/GCP/Vercel staging account.", "access_setup", True, "1Password/Bitwarden vault share, IAM invite", 4),
            ("Third-Party API Credentials (Stripe / SendGrid)", "Test/Sandbox API keys for payment processing and email notifications.", "access_setup", False, "Vault share or test keys (no prod secrets)", 5),
            ("DNS / Domain Management Authorization", "Access or delegated DNS records for launching staging and production domains.", "technical_details", True, "Cloudflare / Route53 delegation or records list", 6),
            ("Executed Master Services Agreement & SOW", "Signed engagement agreement, payment milestones, and liability terms.", "legal", True, "DocuSign / signed PDF agreement", 7),
        ]

        for title, desc, cat, req, evidence, order in web_items:
            ChecklistItem.objects.get_or_create(
                template=tmpl_web,
                title=title,
                defaults={
                    'description': desc,
                    'category': cat,
                    'is_required': req,
                    'acceptable_evidence': evidence,
                    'order': order,
                }
            )

        # ── 2. AI Agent & LLM Integration Template ──
        tmpl_ai, _ = ChecklistTemplate.objects.get_or_create(
            name="AI Agent & LLM Integration Checklist",
            defaults={
                'description': "Requirements for building, evaluating, and integrating generative AI or conversational agents.",
                'category': "AI & Machine Learning",
                'is_active': True,
                'is_default': False,
            }
        )

        ai_items = [
            ("Agent Persona & Policy Document", "Guidelines specifying agent tone, boundaries, prohibited topics, and fallback behaviors.", "approvals", True, "Markdown / PDF specification", 1),
            ("Knowledge Base & RAG Source Documents", "Curated documentation, FAQs, product catalogs, or SOP manuals for retrieval.", "content", True, "PDFs, Markdown, or clean CSV/JSON exports", 2),
            ("LLM Provider API Account Access", "Dedicated OpenAI/Anthropic/Google Cloud project access with billing active.", "access_setup", True, "IAM role or encrypted vault link", 3),
            ("Target API Endpoints & Webhook Specs", "OpenAPI / Swagger specifications of services the AI agent needs to call.", "technical_details", True, "OpenAPI 3.0 JSON/YAML specification", 4),
            ("Test Evaluation Scenarios & Benchmark Queries", "Set of at least 25 golden Q&A pairs for automated regression testing.", "technical_details", True, "Spreadsheet or JSON benchmark dataset", 5),
            ("Data Privacy & Enterprise Compliance Sign-Off", "Written confirmation that client data handling meets GDPR/SOC2 policies.", "legal", True, "Signed compliance confirmation memo", 6),
        ]

        for title, desc, cat, req, evidence, order in ai_items:
            ChecklistItem.objects.get_or_create(
                template=tmpl_ai,
                title=title,
                defaults={
                    'description': desc,
                    'category': cat,
                    'is_required': req,
                    'acceptable_evidence': evidence,
                    'order': order,
                }
            )

        # ── 3. Cloud Infrastructure & DevOps Template ──
        tmpl_cloud, _ = ChecklistTemplate.objects.get_or_create(
            name="Cloud Infrastructure & DevOps Checklist",
            defaults={
                'description': "Workload migration, Terraform scaffolding, and containerized deployment prerequisites.",
                'category': "Cloud & DevOps",
                'is_active': True,
                'is_default': False,
            }
        )

        cloud_items = [
            ("Current Architecture Topology Diagram", "Diagram showing network VPCs, existing services, databases, and dependencies.", "technical_details", True, "Draw.io, Lucidchart, or PDF architecture diagram", 1),
            ("Target Cloud Provider Master Account Access", "Root/Admin delegation or cross-account IAM role for Terraform automation.", "access_setup", True, "Cross-account IAM role ARN", 2),
            ("Database Sizing & Data Migration Snapshot Specs", "Volume requirements, IOPS requirements, and retention schedule.", "technical_details", True, "Sizing spreadsheet or RDS configuration export", 3),
            ("Scheduled Maintenance Window Approval", "Written sign-off on allowable cutover window and maximum tolerance for downtime.", "approvals", True, "Written confirmation from Head of Engineering", 4),
            ("On-Call & Incident Escalation Directory", "Directory of internal client engineers for deployment escalation.", "other", False, "PagerDuty escalation policy or contact table", 5),
        ]

        for title, desc, cat, req, evidence, order in cloud_items:
            ChecklistItem.objects.get_or_create(
                template=tmpl_cloud,
                title=title,
                defaults={
                    'description': desc,
                    'category': cat,
                    'is_required': req,
                    'acceptable_evidence': evidence,
                    'order': order,
                }
            )

        self.stdout.write("Templates seeded successfully. Seeding fictional demo cases...")

        # ── 4. Seed Fictional Demo Clients & Cases ──
        client1, _ = ClientAccount.objects.get_or_create(
            name="Apex Retail Global (DEMO)",
            defaults={
                'company': "Apex Commerce Ltd",
                'contact_email': "alex.vance@apexretail-demo.com",
                'contact_person': "Alex Vance",
                'notes': "Fictional demo client for e-commerce web app development.",
            }
        )

        case1, _ = OnboardingCase.objects.get_or_create(
            project_name="Apex Direct-to-Consumer Web Storefront",
            client=client1,
            defaults={
                'service_type': 'web_app',
                'checklist_template': tmpl_web,
                'status': 'in_review',
                'notes': "Initial materials submitted via portal. Reviewing assets and credentials.",
                'target_launch_date': timezone.now().date() + timezone.timedelta(days=45),
            }
        )

        # Populate submissions for case 1:
        for idx, item in enumerate(tmpl_web.items.all()):
            sub, _ = SubmissionItem.objects.get_or_create(case=case1, checklist_item=item)
            if idx == 0:
                sub.received_status = 'received'
                sub.file_name = 'apex_brand_kit_2026.zip'
                sub.reviewer_notes = "Received SVG logos and color guidelines. Complete."
                sub.save()
            elif idx == 1:
                sub.received_status = 'received'
                sub.file_name = 'figma_storefront_v2_spec.pdf'
                sub.reviewer_notes = "Figma link verified. Developer specs enabled."
                sub.save()
            elif idx == 3:
                sub.received_status = 'needs_review'
                sub.file_name = 'aws_staging_credentials.txt'
                # Note: Simulated credential for testing detector safely
                sub.reviewer_notes = "Client uploaded credentials. Contains note: AKIA1234567890ABCDEF."
                sub.save()
            elif idx == 4:
                sub.received_status = 'incomplete'
                sub.reviewer_notes = "Stripe test keys provided, but webhook signing secret was missing."
                sub.save()
            else:
                sub.received_status = 'missing'
                sub.save()

        run_gap_analysis(case1)
        generate_follow_up_message(case1)

        # Case 2: AI Agent
        client2, _ = ClientAccount.objects.get_or_create(
            name="Novacare Health Systems (DEMO)",
            defaults={
                'company': "Novacare Diagnostics Inc.",
                'contact_email': "dr.chen@novacare-health-demo.com",
                'contact_person': "Dr. Marcus Chen",
                'notes': "Healthcare provider scoping patient intake AI assistant.",
            }
        )

        case2, _ = OnboardingCase.objects.get_or_create(
            project_name="Patient Triage AI Assistant",
            client=client2,
            defaults={
                'service_type': 'ai_agent',
                'checklist_template': tmpl_ai,
                'status': 'awaiting_client',
                'notes': "Awaiting updated compliance documentation and golden evaluation Q&As.",
                'target_launch_date': timezone.now().date() + timezone.timedelta(days=60),
            }
        )

        for idx, item in enumerate(tmpl_ai.items.all()):
            sub, _ = SubmissionItem.objects.get_or_create(case=case2, checklist_item=item)
            if idx == 0:
                sub.received_status = 'received'
                sub.file_name = 'novacare_ai_tone_and_safeguards.pdf'
                sub.reviewer_notes = "Policy verified by clinical operations lead."
                sub.save()
            elif idx == 1:
                sub.received_status = 'incomplete'
                sub.file_name = 'intake_faq_draft.docx'
                sub.reviewer_notes = "FAQ draft received but contains only 8 questions out of required 30."
                sub.save()
            else:
                sub.received_status = 'missing'
                sub.save()

        run_gap_analysis(case2)
        generate_follow_up_message(case2)

        self.stdout.write(self.style.SUCCESS("Successfully seeded templates, demo clients, cases, and gap analyses!"))

