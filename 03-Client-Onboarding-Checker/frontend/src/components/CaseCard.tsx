import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Calendar, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  FileCode2,
  Bot,
  Cloud,
  Palette,
  Layers
} from 'lucide-react';
import { OnboardingCaseListItem, ServiceType, CaseStatus } from '../types';

interface CaseCardProps {
  caseItem: OnboardingCaseListItem;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseItem }) => {
  const completionPercentage = caseItem.total_submissions > 0
    ? Math.round((caseItem.received_count / caseItem.total_submissions) * 100)
    : 0;

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case 'web_app':
        return <FileCode2 className="w-4 h-4 text-emerald-600" />;
      case 'ai_agent':
        return <Bot className="w-4 h-4 text-sky-600" />;
      case 'cloud_infrastructure':
        return <Cloud className="w-4 h-4 text-indigo-600" />;
      case 'branding_design':
        return <Palette className="w-4 h-4 text-purple-600" />;
      default:
        return <Layers className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="status-badge status-badge-received">
            <CheckCircle2 className="w-3 h-3" /> Approved for Kickoff
          </span>
        );
      case 'in_review':
        return (
          <span className="status-badge status-badge-needs_review">
            In Technical Review
          </span>
        );
      case 'awaiting_client':
        return (
          <span className="status-badge status-badge-incomplete">
            Awaiting Client Input
          </span>
        );
      case 'blocked':
        return (
          <span className="status-badge status-badge-missing">
            <AlertCircle className="w-3 h-3" /> Blocked on Critical Item
          </span>
        );
      default:
        return (
          <span className="status-badge status-badge-not_applicable">
            Draft Intake
          </span>
        );
    }
  };

  return (
    <div className="scalezix-card p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-200">
      
      {/* Top Header: Company, Service, and Status */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-slate-100 border border-slate-200">
              {getServiceIcon(caseItem.service_type)}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {caseItem.service_type_display}
            </span>
          </div>
          {getStatusBadge(caseItem.status)}
        </div>

        {/* Project Name and Client Name */}
        <Link 
          to={`/cases/${caseItem.id}`}
          className="group block mt-2 focus:outline-none"
        >
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {caseItem.project_name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{caseItem.client_company}</span>
            <span className="text-slate-300">•</span>
            <span>{caseItem.client_name}</span>
          </div>
        </Link>

        {/* Template info */}
        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
          <span className="text-slate-400">Template:</span>
          <span className="font-medium text-slate-700">{caseItem.template_name}</span>
        </div>
      </div>

      {/* Middle: Progress and Readiness */}
      <div className="my-5 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-700">Checklist Completion</span>
          <span className="font-mono font-bold text-slate-900">
            {caseItem.received_count} / {caseItem.total_submissions} ({completionPercentage}%)
          </span>
        </div>

        <div className="progress-track">
          <div 
            className="progress-fill" 
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Warning Badges if present */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {caseItem.has_security_warnings && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              <ShieldAlert className="w-3 h-3 text-red-600" />
              Credential Alert
            </span>
          )}

          {caseItem.open_findings_count > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              {caseItem.open_findings_count} open {caseItem.open_findings_count === 1 ? 'gap' : 'gaps'}
            </span>
          )}

          {caseItem.target_launch_date && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 ml-auto">
              <Calendar className="w-3 h-3 text-slate-400" />
              Target: {caseItem.target_launch_date}
            </span>
          )}
        </div>
      </div>

      {/* Footer: Open Case Action */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
        <Link
          to={`/cases/${caseItem.id}`}
          className="btn-secondary text-xs w-full justify-between group"
        >
          <span>Open Review Console</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

    </div>
  );
};

