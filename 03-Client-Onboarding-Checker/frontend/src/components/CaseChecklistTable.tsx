import React from 'react';
import { 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  ShieldAlert, 
  Lock,
  Layers,
  FileText
} from 'lucide-react';
import { SubmissionItem, ChecklistCategory, SubmissionStatus } from '../types';

interface CaseChecklistTableProps {
  submissions: SubmissionItem[];
  onOpenUploadModal: (submission: SubmissionItem) => void;
  onQuickStatusChange: (submissionId: string, newStatus: SubmissionStatus) => void;
}

const CATEGORY_LABELS: Record<ChecklistCategory, { label: string; description: string }> = {
  architecture: {
    label: 'Architecture & Cloud Hosting',
    description: 'Cloud environment permissions, staging clusters, IAM policies, and VPC architecture.',
  },
  credentials: {
    label: 'Credentials & Environment Secrets',
    description: 'API keys, payment gateways, authentication providers, and third-party service tokens.',
  },
  domain_dns: {
    label: 'Domain & DNS Configuration',
    description: 'Nameserver delegation, Cloudflare zone access, SSL certificates, and record routing.',
  },
  brand_design: {
    label: 'Brand & UX/UI Assets',
    description: 'Figma source files, vector logos, brand design guidelines, typography, and color tokens.',
  },
  legal_compliance: {
    label: 'Legal, Privacy & Compliance',
    description: 'Master Services Agreement (MSA), NDAs, GDPR/HIPAA compliance addendums, and terms.',
  },
  tech_specs: {
    label: 'Technical Specifications & Data Models',
    description: 'API schemas (Swagger/OpenAPI), database ERDs, entity models, and third-party webhooks.',
  },
};

export const CaseChecklistTable: React.FC<CaseChecklistTableProps> = ({
  submissions,
  onOpenUploadModal,
  onQuickStatusChange,
}) => {
  // Group submissions by item category
  const groupedSubmissions = submissions.reduce((acc, sub) => {
    const cat = sub.checklist_item_detail?.category || 'tech_specs';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(sub);
    return acc;
  }, {} as Record<ChecklistCategory, SubmissionItem[]>);

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'received':
        return (
          <span className="status-badge status-badge-received">
            <CheckCircle2 className="w-3 h-3" /> Received
          </span>
        );
      case 'missing':
        return (
          <span className="status-badge status-badge-missing">
            <AlertCircle className="w-3 h-3" /> Missing
          </span>
        );
      case 'incomplete':
        return (
          <span className="status-badge status-badge-incomplete">
            <Clock className="w-3 h-3" /> Incomplete
          </span>
        );
      case 'needs_review':
        return (
          <span className="status-badge status-badge-needs_review">
            Needs Review
          </span>
        );
      case 'awaiting_clarification':
        return (
          <span className="status-badge status-badge-awaiting_clarification">
            Awaiting Client
          </span>
        );
      case 'not_applicable':
        return (
          <span className="status-badge status-badge-not_applicable">
            Not Applicable
          </span>
        );
      default:
        return null;
    }
  };

  const categories = Object.keys(groupedSubmissions) as ChecklistCategory[];

  if (submissions.length === 0) {
    return (
      <div className="scalezix-card p-12 text-center">
        <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-800">No Checklist Items Configured</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          This case does not have an attached checklist template. Assign a template to populate the onboarding matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const items = groupedSubmissions[category];
        const catMeta = CATEGORY_LABELS[category] || {
          label: category,
          description: 'Onboarding requirements category',
        };

        const receivedCount = items.filter((i) => i.received_status === 'received').length;

        return (
          <div key={category} className="scalezix-card overflow-hidden">
            
            {/* Category Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight text-white">
                    {catMeta.label}
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 whitespace-nowrap">
                    {receivedCount} of {items.length} verified
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {catMeta.description}
                </p>
              </div>
            </div>

            {/* Mobile Scroll Affordance Banner */}
            <div className="md:hidden px-4 py-1.5 bg-slate-100/90 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
              <span className="font-medium flex items-center gap-1">
                <span>←</span> Scroll horizontally for evidence & actions <span>→</span>
              </span>
              <span className="font-mono text-[10px] text-slate-500 uppercase">{items.length} items</span>
            </div>

            {/* Submissions Table with Responsive Scroll */}
            <div className="overflow-x-auto touch-pan-x">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4 sm:px-5 w-2/5 min-w-[240px]">Requirement & Evidence Criteria</th>
                    <th className="py-3 px-3 sm:px-4 w-36 min-w-[140px]">Status</th>
                    <th className="py-3 px-3 sm:px-4 w-1/4 min-w-[160px]">Submitted Evidence / Notes</th>
                    <th className="py-3 px-4 text-right w-28 min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((sub) => {
                    const item = sub.checklist_item_detail;
                    if (!item) return null;

                    return (
                      <tr 
                        key={sub.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          sub.has_sensitive_data ? 'bg-red-50/30' : ''
                        }`}
                      >
                        {/* Title and Acceptable Evidence */}
                        <td className="py-3.5 sm:py-4 px-4 sm:px-5 align-top">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-bold text-slate-900 text-sm break-words">
                              {item.title}
                            </span>
                            {item.is_required ? (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded uppercase whitespace-nowrap">
                                Required
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded uppercase whitespace-nowrap">
                                Optional
                              </span>
                            )}
                          </div>
                          
                          <p className="text-slate-600 text-xs mt-1 leading-relaxed break-words">
                            {item.description}
                          </p>
                          
                          <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200/60 flex items-start gap-1.5">
                            <span className="font-semibold text-slate-700 whitespace-nowrap">
                              Evidence:
                            </span>
                            <span className="text-slate-600 break-words">
                              {item.acceptable_evidence}
                            </span>
                          </div>
                        </td>

                        {/* Status with Quick Dropdown */}
                        <td className="py-3.5 sm:py-4 px-3 sm:px-4 align-top">
                          <div className="space-y-1.5">
                            <div>{getStatusBadge(sub.received_status)}</div>
                            <select
                              value={sub.received_status}
                              onChange={(e) => onQuickStatusChange(sub.id, e.target.value as SubmissionStatus)}
                              className="text-[11px] py-1.5 px-2 border border-slate-200 rounded bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer w-full min-h-[36px]"
                            >
                              <option value="received">Received</option>
                              <option value="missing">Missing</option>
                              <option value="incomplete">Incomplete</option>
                              <option value="needs_review">Needs Review</option>
                              <option value="awaiting_clarification">Awaiting Client</option>
                              <option value="not_applicable">Not Applicable</option>
                            </select>
                          </div>
                        </td>

                        {/* File Name & Reviewer Notes */}
                        <td className="py-3.5 sm:py-4 px-3 sm:px-4 align-top">
                          {sub.file_name ? (
                            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 w-fit max-w-full truncate mb-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              <span className="truncate max-w-[180px] sm:max-w-[220px]">{sub.file_name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic block mb-1.5">
                              No file or link registered
                            </span>
                          )}

                          {sub.reviewer_notes && (
                            <div className={`text-xs p-2 rounded border break-words ${
                              sub.has_sensitive_data 
                                ? 'bg-red-50 text-red-900 border-red-200' 
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {sub.has_sensitive_data && (
                                <div className="flex items-center gap-1 text-[11px] font-bold text-red-700 mb-1">
                                  <ShieldAlert className="w-3 h-3 text-red-600 flex-shrink-0" />
                                  <span>Credential Warning Detected</span>
                                </div>
                              )}
                              <p className="line-clamp-2 leading-relaxed">
                                {sub.reviewer_notes}
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 sm:py-4 px-4 align-top text-right">
                          <button
                            onClick={() => onOpenUploadModal(sub)}
                            className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1 min-h-[36px]"
                            title="Update submission evidence and review notes"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Update</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        );
      })}
    </div>
  );
};

