import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  Calendar, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ListChecks, 
  FileCheck2, 
  ChevronRight,
  ShieldAlert,
  Layers,
  Share2,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { 
  OnboardingCaseDetail, 
  SubmissionItem, 
  SubmissionStatus, 
  CaseStatus, 
  FollowUpMessage 
} from '../types';
import { 
  getCase, 
  updateCase, 
  updateSubmission, 
  updateFinding, 
  runGapAnalysis, 
  runAiAnalysis, 
  generateFollowUp, 
  updateFollowUp,
  getExportCsvUrl,
  getExportMissingCsvUrl,
  getExportReportMdUrl
} from '../services/api';
import { MOCK_CASE_DETAIL } from '../services/mockData';
import { CaseChecklistTable } from '../components/CaseChecklistTable';
import { FindingsList } from '../components/FindingsList';
import { FollowUpEditor } from '../components/FollowUpEditor';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { FileUploadModal } from '../components/FileUploadModal';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [caseData, setCaseData] = useState<OnboardingCaseDetail>(MOCK_CASE_DETAIL);
  const [activeTab, setActiveTab] = useState<'checklist' | 'findings' | 'followup' | 'activity'>('checklist');
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Evidence modal state
  const [activeSubmission, setActiveSubmission] = useState<SubmissionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadCaseData(id);
    }
  }, [id]);

  const loadCaseData = async (caseId: string) => {
    setIsLoading(true);
    try {
      const fetched = await getCase(caseId);
      setCaseData(fetched);
    } catch (err) {
      console.warn('Backend API unavailable, using mock case data:', err);
      setCaseData(MOCK_CASE_DETAIL);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: CaseStatus) => {
    try {
      const updated = await updateCase(caseData.id, { status: newStatus });
      setCaseData((prev) => ({ ...prev, status: newStatus, status_display: updated.status_display || newStatus }));
    } catch (err) {
      setCaseData((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const handleQuickStatusChange = async (submissionId: string, newStatus: SubmissionStatus) => {
    try {
      await updateSubmission(submissionId, { received_status: newStatus });
      setCaseData((prev) => {
        const nextSubmissions = prev.submissions.map((sub) =>
          sub.id === submissionId ? { ...sub, received_status: newStatus } : sub
        );
        const receivedCount = nextSubmissions.filter((s) => s.received_status === 'received').length;
        const total = nextSubmissions.length;
        const rate = total > 0 ? Math.round((receivedCount / total) * 100) : 0;

        return {
          ...prev,
          submissions: nextSubmissions,
          completion_stats: {
            ...prev.completion_stats,
            received: receivedCount,
            completion_rate: rate,
          },
        };
      });
    } catch (err) {
      console.error('Quick status update failed:', err);
    }
  };

  const handleSaveSubmissionEvidence = async (submissionId: string, updates: Partial<SubmissionItem>) => {
    try {
      const updated = await updateSubmission(submissionId, updates);
      setCaseData((prev) => ({
        ...prev,
        submissions: prev.submissions.map((s) => (s.id === submissionId ? { ...s, ...updated } : s)),
      }));
      // Automatically refresh gap analysis to recalculate readiness and findings
      handleTriggerGapAnalysis();
    } catch (err) {
      console.error('Submission update error:', err);
      // Fallback local state update
      setCaseData((prev) => ({
        ...prev,
        submissions: prev.submissions.map((s) => (s.id === submissionId ? { ...s, ...updates } : s)),
      }));
    }
  };

  const handleTriggerGapAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await runGapAnalysis(caseData.id);
      await loadCaseData(caseData.id);
    } catch (err) {
      console.error('Gap analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTriggerAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await runAiAnalysis(caseData.id);
      await loadCaseData(caseData.id);
    } catch (err) {
      console.error('AI gap analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleResolveFinding = async (findingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'resolved' : 'open';
    try {
      await updateFinding(findingId, { status: newStatus as any });
      setCaseData((prev) => ({
        ...prev,
        findings: prev.findings.map((f) => (f.id === findingId ? { ...f, status: newStatus as any } : f)),
      }));
    } catch (err) {
      setCaseData((prev) => ({
        ...prev,
        findings: prev.findings.map((f) => (f.id === findingId ? { ...f, status: newStatus as any } : f)),
      }));
    }
  };

  const handleToggleConfirmFinding = async (findingId: string, currentConfirmed: boolean) => {
    try {
      await updateFinding(findingId, { is_human_confirmed: !currentConfirmed });
      setCaseData((prev) => ({
        ...prev,
        findings: prev.findings.map((f) =>
          f.id === findingId ? { ...f, is_human_confirmed: !currentConfirmed } : f
        ),
      }));
    } catch (err) {
      setCaseData((prev) => ({
        ...prev,
        findings: prev.findings.map((f) =>
          f.id === findingId ? { ...f, is_human_confirmed: !currentConfirmed } : f
        ),
      }));
    }
  };

  const handleGenerateFollowUp = async () => {
    setIsGeneratingFollowUp(true);
    try {
      const generated = await generateFollowUp(caseData.id);
      setCaseData((prev) => ({ ...prev, follow_up_message: generated }));
      setActiveTab('followup');
    } catch (err) {
      console.error('Follow-up generation error:', err);
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const handleSaveFollowUp = async (fupId: string, updates: Partial<FollowUpMessage>) => {
    try {
      const saved = await updateFollowUp(fupId, updates);
      setCaseData((prev) => ({ ...prev, follow_up_message: saved }));
    } catch (err) {
      setCaseData((prev) => ({
        ...prev,
        follow_up_message: prev.follow_up_message ? { ...prev.follow_up_message, ...updates } : null,
      }));
    }
  };

  const openEvidenceModal = (submission: SubmissionItem) => {
    setActiveSubmission(submission);
    setIsModalOpen(true);
  };

  const completionPercentage = caseData.completion_stats?.completion_rate ?? 0;
  const openFindingsCount = caseData.findings.filter((f) => f.status === 'open').length;
  const securityAlertsCount = caseData.findings.filter(
    (f) => f.status === 'open' && f.finding_type === 'security_concern'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 animate-in fade-in duration-200">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 mb-4 overflow-x-auto whitespace-nowrap py-1">
        <Link to="/" className="hover:text-slate-900 transition-colors flex-shrink-0">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <Link to="/cases" className="hover:text-slate-900 transition-colors flex-shrink-0">
          Onboarding Cases
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-md">
          {caseData.project_name}
        </span>
      </nav>

      {/* Case Header Card */}
      <div className="scalezix-card p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 bg-white border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: Project & Client Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200">
                {caseData.service_type_display}
              </span>
              {securityAlertsCount > 0 && (
                <span className="text-xs font-bold bg-red-100 text-red-800 border border-red-300 px-2.5 py-0.5 rounded flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                  <span>{securityAlertsCount} Security Alert{securityAlertsCount > 1 ? 's' : ''}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight break-words">
              {caseData.project_name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{caseData.client.company}</span>
                <span className="text-slate-400">({caseData.client.name})</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-500">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <a 
                  href={`mailto:${caseData.client.contact_email}`} 
                  className="hover:text-emerald-600 underline font-mono break-all"
                >
                  {caseData.client.contact_email}
                </a>
              </div>

              {caseData.target_launch_date && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Target Kickoff: <strong>{caseData.target_launch_date}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Status Dropdown & Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:items-end gap-2.5 sm:gap-3 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            
            {/* Status Selector */}
            <div className="w-full sm:w-auto">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Workflow Status
              </label>
              <select
                value={caseData.status}
                onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
                className="select-field text-xs font-semibold py-1.5 min-h-[38px] w-full"
              >
                <option value="draft">Draft Intake</option>
                <option value="in_review">In Technical Review</option>
                <option value="awaiting_client">Awaiting Client Input</option>
                <option value="approved">Approved for Kickoff</option>
                <option value="blocked">Blocked on Critical Item</option>
              </select>
            </div>

            {/* Export Dropdown */}
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="btn-secondary text-xs w-full sm:w-auto justify-between min-h-[38px]"
              >
                <Download className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Export Reports</span>
              </button>

              {showExportMenu && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-2 animate-in fade-in duration-150">
                  <a
                    href={getExportCsvUrl(caseData.id)}
                    download
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-700 font-medium"
                    onClick={() => setShowExportMenu(false)}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Checklist Audit CSV</span>
                  </a>
                  <a
                    href={getExportMissingCsvUrl(caseData.id)}
                    download
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-rose-700 font-medium"
                    onClick={() => setShowExportMenu(false)}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>Missing Items CSV</span>
                  </a>
                  <a
                    href={getExportReportMdUrl(caseData.id)}
                    download
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-sky-700 font-medium"
                    onClick={() => setShowExportMenu(false)}
                  >
                    <FileText className="w-4 h-4 text-sky-600 flex-shrink-0" />
                    <span>Review Report (.md)</span>
                  </a>
                </div>
              )}
            </div>

            {/* Quick Generate Follow-Up Button */}
            <div className="w-full sm:w-auto">
              <button
                onClick={handleGenerateFollowUp}
                disabled={isGeneratingFollowUp}
                className="btn-primary text-xs w-full sm:w-auto min-h-[38px] justify-center"
              >
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isGeneratingFollowUp ? 'Drafting...' : 'Follow-Up Email'}</span>
              </button>
            </div>

          </div>

        </div>

        {/* Progress Metric Bar */}
        <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-100">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Intake Readiness:</span>
              <span className="font-mono font-bold text-emerald-700">
                {caseData.completion_stats?.received || 0} of {caseData.completion_stats?.total || 0} items verified
              </span>
            </div>
            <span className="font-mono font-extrabold text-slate-900 text-sm">
              {completionPercentage}% Complete
            </span>
          </div>

          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1 touch-pan-x">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === 'checklist'
              ? 'border-emerald-500 text-slate-950 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ListChecks className="w-4 h-4 flex-shrink-0" />
          <span>Checklist Matrix ({caseData.submissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('findings')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === 'findings'
              ? 'border-emerald-500 text-slate-950 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Gap Findings & Alerts</span>
          {openFindingsCount > 0 && (
            <span className="bg-amber-100 text-amber-900 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {openFindingsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('followup')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === 'followup'
              ? 'border-emerald-500 text-slate-950 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span>Client Follow-Up Composer</span>
          {caseData.follow_up_message && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === 'activity'
              ? 'border-emerald-500 text-slate-950 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>Activity Log ({caseData.activity_logs.length})</span>
        </button>
      </div>

      {/* Tab 1: Checklist & Submissions Matrix */}
      {activeTab === 'checklist' && (
        <CaseChecklistTable
          submissions={caseData.submissions}
          onOpenUploadModal={openEvidenceModal}
          onQuickStatusChange={handleQuickStatusChange}
        />
      )}

      {/* Tab 2: Findings & Gap Analysis */}
      {activeTab === 'findings' && (
        <FindingsList
          findings={caseData.findings}
          onToggleResolve={handleToggleResolveFinding}
          onToggleConfirm={handleToggleConfirmFinding}
          onTriggerGapAnalysis={handleTriggerGapAnalysis}
          onTriggerAiAnalysis={handleTriggerAiAnalysis}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* Tab 3: Client Follow-up Composer */}
      {activeTab === 'followup' && (
        <FollowUpEditor
          followUp={caseData.follow_up_message}
          onGenerate={handleGenerateFollowUp}
          onSave={handleSaveFollowUp}
          isGenerating={isGeneratingFollowUp}
          clientEmail={caseData.client.contact_email}
        />
      )}

      {/* Tab 4: Activity Log */}
      {activeTab === 'activity' && (
        <ActivityTimeline logs={caseData.activity_logs} />
      )}

      {/* File Upload / Verification Modal */}
      <FileUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        submission={activeSubmission}
        onSave={handleSaveSubmissionEvidence}
      />

    </div>
  );
};

