export type ServiceType = 
  | 'web_app' 
  | 'ai_agent' 
  | 'cloud_infrastructure' 
  | 'branding_design' 
  | 'custom_software';

export type CaseStatus = 
  | 'draft' 
  | 'in_review' 
  | 'awaiting_client' 
  | 'approved' 
  | 'blocked';

export type SubmissionStatus = 
  | 'received' 
  | 'missing' 
  | 'incomplete' 
  | 'needs_review' 
  | 'not_applicable' 
  | 'awaiting_clarification';

export type FindingSeverity = 'low' | 'medium' | 'high' | 'critical';

export type FindingType = 
  | 'missing_item' 
  | 'incomplete_submission' 
  | 'unclear_spec' 
  | 'security_concern' 
  | 'recommendation';

export type ChecklistCategory = 
  | 'architecture' 
  | 'credentials' 
  | 'domain_dns' 
  | 'brand_design' 
  | 'legal_compliance' 
  | 'tech_specs';

export interface ClientAccount {
  id: string;
  name: string;
  company: string;
  contact_email: string;
  contact_phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  template: string;
  category: ChecklistCategory;
  category_display?: string;
  title: string;
  description: string;
  is_required: boolean;
  acceptable_evidence: string;
  order: number;
  is_active: boolean;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  slug: string;
  service_type: ServiceType;
  service_type_display?: string;
  description: string;
  is_default: boolean;
  items_count?: number;
  items?: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface SubmissionItem {
  id: string;
  case: string;
  checklist_item: string;
  checklist_item_detail?: ChecklistItem;
  received_status: SubmissionStatus;
  received_status_display?: string;
  file_name: string;
  file_size?: number | null;
  file_type?: string;
  file_upload?: string | null;
  reviewer_notes: string;
  submitted_date?: string | null;
  reviewed_at?: string | null;
  has_sensitive_data?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Finding {
  id: string;
  case: string;
  checklist_item?: string | null;
  checklist_item_title?: string;
  finding_type: FindingType;
  finding_type_display?: string;
  severity: FindingSeverity;
  severity_display?: string;
  title: string;
  explanation: string;
  suggested_next_step: string;
  status: 'open' | 'resolved' | 'dismissed';
  is_human_confirmed: boolean;
  has_sensitive_data_alert: boolean;
  created_at: string;
  updated_at: string;
}

export interface FollowUpMessage {
  id: string;
  case: string;
  recipient_name: string;
  subject: string;
  greeting: string;
  body: string;
  status: 'draft' | 'reviewed' | 'sent';
  status_display?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface OnboardingCaseListItem {
  id: string;
  client: string;
  client_name: string;
  client_company: string;
  project_name: string;
  service_type: ServiceType;
  service_type_display: string;
  checklist_template: string | null;
  template_name: string;
  status: CaseStatus;
  status_display: string;
  total_submissions: number;
  received_count: number;
  open_findings_count: number;
  has_security_warnings: boolean;
  target_launch_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingCaseDetail {
  id: string;
  client: ClientAccount;
  project_name: string;
  service_type: ServiceType;
  service_type_display: string;
  checklist_template: ChecklistTemplate | null;
  status: CaseStatus;
  status_display: string;
  notes: string;
  target_launch_date: string | null;
  submissions: SubmissionItem[];
  findings: Finding[];
  follow_up_message: FollowUpMessage | null;
  activity_logs: ActivityLog[];
  completion_stats: {
    total: number;
    received: number;
    missing: number;
    incomplete: number;
    completion_rate: number;
    security_warnings: number;
  };
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_cases: number;
  cases_by_status: Record<string, number>;
  total_missing_items: number;
  total_security_concerns: number;
  ready_cases_count: number;
  recent_cases: OnboardingCaseListItem[];
}

export interface AnalysisResult {
  status: 'success' | 'error';
  mode?: 'rule_based' | 'ai_assisted';
  findings_count: number;
  security_concerns_count?: number;
  summary?: string;
  metrics?: {
    total_items: number;
    received_count: number;
    missing_required_count: number;
    incomplete_count: number;
    security_concerns_count: number;
    readiness_percentage: number;
  };
}

