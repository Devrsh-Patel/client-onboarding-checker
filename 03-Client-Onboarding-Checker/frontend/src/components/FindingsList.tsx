import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  Lightbulb, 
  Check, 
  Shield, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Finding, FindingSeverity, FindingType } from '../types';

interface FindingsListProps {
  findings: Finding[];
  onToggleResolve: (findingId: string, currentStatus: string) => Promise<void>;
  onToggleConfirm: (findingId: string, currentConfirmed: boolean) => Promise<void>;
  onTriggerGapAnalysis: () => Promise<void>;
  onTriggerAiAnalysis: () => Promise<void>;
  isAnalyzing: boolean;
}

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  onToggleResolve,
  onToggleConfirm,
  onTriggerGapAnalysis,
  onTriggerAiAnalysis,
  isAnalyzing,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('open');

  const getSeverityBadge = (sev: FindingSeverity) => {
    switch (sev) {
      case 'critical':
        return <span className="severity-pill severity-critical">Critical</span>;
      case 'high':
        return <span className="severity-pill severity-high">High</span>;
      case 'medium':
        return <span className="severity-pill severity-medium">Medium</span>;
      case 'low':
        return <span className="severity-pill severity-low">Low</span>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: FindingType) => {
    switch (type) {
      case 'security_concern':
        return <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />;
      case 'missing_item':
        return <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
      case 'incomplete_submission':
        return <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
      case 'unclear_spec':
        return <HelpCircle className="w-5 h-5 text-sky-600 flex-shrink-0" />;
      case 'recommendation':
        return <Lightbulb className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
    }
  };

  const filteredFindings = findings.filter((f) => {
    if (filterStatus === 'open' && f.status !== 'open') return false;
    if (filterStatus === 'resolved' && f.status !== 'resolved') return false;
    if (filterType !== 'all' && f.finding_type !== filterType) return false;
    return true;
  });

  const securityFindings = findings.filter((f) => f.finding_type === 'security_concern' && f.status === 'open');

  return (
    <div className="space-y-6">
      
      {/* Security Guidance Callout Banner (If any security finding exists) */}
      {securityFindings.length > 0 && (
        <div className="security-alert-box animate-in fade-in duration-300">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-700 flex-shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <h4 className="text-sm font-extrabold text-red-950 uppercase tracking-wide">
                  Sensitive Credential Safety Notice
                </h4>
                <span className="text-[10px] sm:text-[11px] font-bold bg-red-200 text-red-900 px-2 py-0.5 rounded-full w-fit">
                  {securityFindings.length} Active Security {securityFindings.length === 1 ? 'Alert' : 'Alerts'}
                </span>
              </div>
              <p className="text-xs text-red-900 leading-relaxed break-words">
                Raw secrets, cloud IAM keys, payment API secrets, and passwords must <strong>never</strong> be stored in unencrypted notes or shared over unsecured channels. 
                Values have been automatically masked with redaction tokens (e.g., <code className="secret-badge">[REDACTED_AWS_KEY]</code>).
              </p>
              <div className="pt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs text-red-800">
                <span className="font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                  Recommended Protocol:
                </span>
                <span className="break-words">Instruct the client to revoke and roll the exposed token immediately and resubmit via <strong>1Password / Bitwarden</strong> encrypted vault share.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Controls and Filters Bar */}
      <div className="scalezix-card p-3.5 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Type and Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterStatus('open')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition-colors whitespace-nowrap min-h-[36px] flex items-center justify-center ${
                filterStatus === 'open' 
                  ? 'bg-white text-slate-900 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Open Gaps ({findings.filter((f) => f.status === 'open').length})
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition-colors whitespace-nowrap min-h-[36px] flex items-center justify-center ${
                filterStatus === 'resolved' 
                  ? 'bg-white text-slate-900 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resolved ({findings.filter((f) => f.status === 'resolved').length})
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition-colors whitespace-nowrap min-h-[36px] flex items-center justify-center ${
                filterStatus === 'all' 
                  ? 'bg-white text-slate-900 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({findings.length})
            </button>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select-field text-xs py-1.5 w-full sm:w-auto min-h-[36px]"
          >
            <option value="all">All Finding Types</option>
            <option value="security_concern">Security & Credentials</option>
            <option value="missing_item">Missing Requirements</option>
            <option value="incomplete_submission">Incomplete Submissions</option>
            <option value="unclear_spec">Unclear Technical Specs</option>
          </select>
        </div>

        {/* Trigger Analysis Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={onTriggerGapAnalysis}
            disabled={isAnalyzing}
            className="btn-secondary text-xs flex-1 sm:flex-initial min-h-[38px] sm:min-h-[36px] justify-center"
            title="Run instant deterministic rule-based gap check"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>{isAnalyzing ? 'Checking...' : 'Run Gap Check'}</span>
          </button>

          <button
            onClick={onTriggerAiAnalysis}
            disabled={isAnalyzing}
            className="btn-ai text-xs flex-1 sm:flex-initial min-h-[38px] sm:min-h-[36px] justify-center"
            title="Run AI-assisted deep gap and technical analysis"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200 flex-shrink-0" />
            <span>{isAnalyzing ? 'Auditing...' : 'AI Intelligent Audit'}</span>
          </button>
        </div>

      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="scalezix-card p-8 sm:p-12 text-center">
          <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">
            {filterStatus === 'open' ? 'Zero Open Gaps' : 'No Findings Match Filter'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {filterStatus === 'open' 
              ? 'All required submissions are verified and in order. The case is ready for technical kickoff!'
              : 'Try changing your filter settings to view other findings.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => {
            const isResolved = finding.status === 'resolved';

            return (
              <div 
                key={finding.id}
                className={`scalezix-card p-4 sm:p-5 transition-all ${
                  isResolved 
                    ? 'bg-slate-50/70 border-slate-200 opacity-75' 
                    : finding.has_sensitive_data_alert 
                      ? 'border-red-300 bg-red-50/10' 
                      : 'hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  {/* Left: Icon & Title */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="mt-0.5 flex-shrink-0">
                      {getTypeIcon(finding.finding_type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        {getSeverityBadge(finding.severity)}
                        <span className="text-xs font-semibold text-slate-500">
                          {finding.finding_type_display}
                        </span>
                        {finding.checklist_item_title && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded truncate max-w-full">
                              {finding.checklist_item_title}
                            </span>
                          </>
                        )}
                        {finding.is_human_confirmed && (
                          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded whitespace-nowrap">
                            Human Confirmed
                          </span>
                        )}
                      </div>

                      <h4 className={`text-sm font-bold break-words ${
                        isResolved ? 'text-slate-500 line-through' : 'text-slate-900'
                      }`}>
                        {finding.title}
                      </h4>

                      <p className="text-xs text-slate-600 mt-2 leading-relaxed break-words">
                        {finding.explanation}
                      </p>

                      {/* Suggested Next Step Box */}
                      {finding.suggested_next_step && (
                        <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                          <span className="font-bold text-slate-700 block mb-0.5">
                            Recommended Action:
                          </span>
                          <p className="text-slate-600 break-words leading-relaxed">
                            {finding.suggested_next_step}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions (Mark Resolved / Human Confirm) */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-end flex-shrink-0">
                    <button
                      onClick={() => onToggleConfirm(finding.id, finding.is_human_confirmed)}
                      className={`text-xs px-2.5 py-1.5 rounded-md border font-medium transition-colors min-h-[36px] flex items-center justify-center flex-1 sm:flex-initial ${
                        finding.is_human_confirmed
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="Confirm this gap finding was reviewed by a human engineer"
                    >
                      {finding.is_human_confirmed ? 'Confirmed ✓' : 'Confirm Finding'}
                    </button>

                    <button
                      onClick={() => onToggleResolve(finding.id, finding.status)}
                      className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[36px] flex-1 sm:flex-initial ${
                        isResolved
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{isResolved ? 'Re-open' : 'Mark Resolved'}</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

