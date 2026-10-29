import React from 'react';
import { 
  FolderGit2, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { DashboardStats } from '../types';

interface MetricsOverviewProps {
  stats: DashboardStats;
  onFilterStatus?: (status: string) => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ stats, onFilterStatus }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* Metric 1: Total Active Cases */}
      <div 
        onClick={() => onFilterStatus?.('all')}
        className="scalezix-card p-5 cursor-pointer relative overflow-hidden group hover:border-slate-400"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Onboardings
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-emerald-400 transition-colors">
            <FolderGit2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 font-mono">
            {stats.total_cases}
          </span>
          <span className="text-xs font-medium text-slate-500">
            in pipeline
          </span>
        </div>
        <div className="mt-3 flex items-center text-xs text-slate-500">
          <span className="text-emerald-600 font-semibold flex items-center">
            {stats.cases_by_status?.in_review ?? 0} in active review
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-200 group-hover:bg-emerald-500 transition-colors" />
      </div>

      {/* Metric 2: Missing Items */}
      <div 
        onClick={() => onFilterStatus?.('missing')}
        className="scalezix-card p-5 cursor-pointer relative overflow-hidden group hover:border-rose-300"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Missing Requirements
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-rose-600 font-mono">
            {stats.total_missing_items}
          </span>
          <span className="text-xs font-medium text-slate-500">
            blocking launch
          </span>
        </div>
        <div className="mt-3 flex items-center text-xs text-rose-600 font-medium">
          <span>Requires client follow-up</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-200 group-hover:bg-rose-500 transition-colors" />
      </div>

      {/* Metric 3: Security & Credential Concerns */}
      <div 
        onClick={() => onFilterStatus?.('security')}
        className={`scalezix-card p-5 cursor-pointer relative overflow-hidden group ${
          stats.total_security_concerns > 0 ? 'border-red-200 bg-red-50/20' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Security & Credential Alerts
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            stats.total_security_concerns > 0 
              ? 'bg-red-100 text-red-600' 
              : 'bg-emerald-50 text-emerald-600'
          }`}>
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold font-mono ${
            stats.total_security_concerns > 0 ? 'text-red-600' : 'text-slate-900'
          }`}>
            {stats.total_security_concerns}
          </span>
          <span className="text-xs font-medium text-slate-500">
            unencrypted secrets
          </span>
        </div>
        <div className="mt-3 flex items-center text-xs">
          {stats.total_security_concerns > 0 ? (
            <span className="text-red-700 font-semibold">
              Immediate action: Redact & rotate
            </span>
          ) : (
            <span className="text-emerald-600 font-medium">
              Zero unencrypted credentials
            </span>
          )}
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
          stats.total_security_concerns > 0 ? 'bg-red-500' : 'bg-emerald-500'
        }`} />
      </div>

      {/* Metric 4: Ready for Development */}
      <div 
        onClick={() => onFilterStatus?.('approved')}
        className="scalezix-card p-5 cursor-pointer relative overflow-hidden group hover:border-emerald-300"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Approved For Kickoff
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-700 font-mono">
            {stats.ready_cases_count}
          </span>
          <span className="text-xs font-medium text-slate-500">
            100% verified
          </span>
        </div>
        <div className="mt-3 flex items-center text-xs text-slate-500 justify-between">
          <span className="text-emerald-700 font-medium">Ready for sprint start</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-200 group-hover:bg-emerald-500 transition-colors" />
      </div>

    </div>
  );
};

