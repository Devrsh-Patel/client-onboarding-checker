import {
  OnboardingCaseListItem,
  OnboardingCaseDetail,
  ClientAccount,
  ChecklistTemplate,
  SubmissionItem,
  Finding,
  FollowUpMessage,
  DashboardStats,
  AnalysisResult,
  CaseStatus,
  ServiceType,
} from '../types';

const envApiUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
export const API_BASE = envApiUrl
  ? (envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl}/api`)
  : '/api';

/**
 * Checks if the Django backend API is reachable.
 */
export async function checkBackendHealth(): Promise<{ status: string; service: string }> {
  try {
    const res = await fetch(`${API_BASE}/health/`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', service: 'django-disconnected' };
  }
}

/**
 * Fetches dashboard high-level statistics.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard/stats/`);
  if (!res.ok) {
    throw new Error(`Failed to load dashboard stats: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Fetches list of onboarding cases with optional filters.
 */
export async function getCases(filters?: {
  status?: string;
  service_type?: string;
  search?: string;
}): Promise<OnboardingCaseListItem[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.service_type) params.append('service_type', filters.service_type);
  if (filters?.search) params.append('search', filters.search);

  const url = `${API_BASE}/cases/${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch cases: ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Fetches single onboarding case with all submissions, findings, and logs.
 */
export async function getCase(id: string): Promise<OnboardingCaseDetail> {
  const res = await fetch(`${API_BASE}/cases/${id}/`);
  if (!res.ok) throw new Error(`Failed to fetch case ${id}: ${res.statusText}`);
  return await res.json();
}

/**
 * Creates a new onboarding case.
 */
export async function createCase(data: {
  client_id: string;
  project_name: string;
  service_type: ServiceType;
  checklist_template_id?: string;
  target_launch_date?: string;
  notes?: string;
}): Promise<OnboardingCaseDetail> {
  const res = await fetch(`${API_BASE}/cases/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err) || 'Failed to create case');
  }
  return await res.json();
}

/**
 * Updates an onboarding case status or notes.
 */
export async function updateCase(id: string, data: Partial<OnboardingCaseDetail>): Promise<OnboardingCaseDetail> {
  const res = await fetch(`${API_BASE}/cases/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update case: ${res.statusText}`);
  return await res.json();
}

/**
 * Runs deterministic rule-based gap analysis.
 */
export async function runGapAnalysis(caseId: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/analyze/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to run gap analysis: ${res.statusText}`);
  return await res.json();
}

/**
 * Runs AI-assisted gap analysis with OpenAI reasoning or rule fallback.
 */
export async function runAiAnalysis(caseId: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/ai_analyze/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to run AI gap analysis: ${res.statusText}`);
  return await res.json();
}

/**
 * Generates structured follow-up message draft.
 */
export async function generateFollowUp(caseId: string): Promise<FollowUpMessage> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/generate_followup/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to generate follow up: ${res.statusText}`);
  return await res.json();
}

/**
 * Updates an existing follow-up message.
 */
export async function updateFollowUp(id: string, data: Partial<FollowUpMessage>): Promise<FollowUpMessage> {
  const res = await fetch(`${API_BASE}/follow-ups/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update follow-up message: ${res.statusText}`);
  return await res.json();
}

/**
 * Updates a submission item (status, file_name, reviewer_notes).
 */
export async function updateSubmission(id: string, data: Partial<SubmissionItem>): Promise<SubmissionItem> {
  const res = await fetch(`${API_BASE}/submissions/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update submission: ${res.statusText}`);
  return await res.json();
}

/**
 * Updates a finding (mark resolved, confirmed, etc.).
 */
export async function updateFinding(id: string, data: Partial<Finding>): Promise<Finding> {
  const res = await fetch(`${API_BASE}/findings/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update finding: ${res.statusText}`);
  return await res.json();
}

/**
 * Fetches clients list.
 */
export async function getClients(): Promise<ClientAccount[]> {
  const res = await fetch(`${API_BASE}/clients/`);
  if (!res.ok) throw new Error(`Failed to fetch clients: ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Creates a new client account.
 */
export async function createClient(data: {
  name: string;
  company: string;
  contact_email: string;
  contact_phone?: string;
  notes?: string;
}): Promise<ClientAccount> {
  const res = await fetch(`${API_BASE}/clients/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create client: ${res.statusText}`);
  return await res.json();
}

/**
 * Fetches checklist templates.
 */
export async function getTemplates(): Promise<ChecklistTemplate[]> {
  const res = await fetch(`${API_BASE}/templates/`);
  if (!res.ok) throw new Error(`Failed to fetch templates: ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
}

/**
 * URL helpers for direct file downloads.
 */
export const getExportCsvUrl = (caseId: string) => `${API_BASE}/cases/${caseId}/export_csv/`;
export const getExportMissingCsvUrl = (caseId: string) => `${API_BASE}/cases/${caseId}/export_missing_csv/`;
export const getExportReportMdUrl = (caseId: string) => `${API_BASE}/cases/${caseId}/export_report_md/`;

