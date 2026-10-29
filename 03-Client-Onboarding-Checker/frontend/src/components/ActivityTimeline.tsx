import React from 'react';
import { Clock, ShieldAlert, FileText, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityTimelineProps {
  logs: ActivityLog[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="scalezix-card p-12 text-center">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-800">No Activity Recorded Yet</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Activity such as document updates, automated checks, and reviews will appear here in chronological order.
        </p>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('security') || act.includes('credential')) {
      return <ShieldAlert className="w-4 h-4 text-red-600" />;
    }
    if (act.includes('created')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (act.includes('gap') || act.includes('analysis')) {
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
    if (act.includes('reviewed') || act.includes('confirmed')) {
      return <UserCheck className="w-4 h-4 text-sky-600" />;
    }
    return <FileText className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="scalezix-card p-6">
      <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-500" />
        Case Audit Trail & Activity Log
      </h3>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {logs.map((log) => {
          const dateStr = new Date(log.timestamp).toLocaleString();

          return (
            <div key={log.id} className="relative flex items-start gap-3 group">
              {/* Dot marker */}
              <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-white border-2 border-slate-400 group-hover:border-emerald-500 flex items-center justify-center transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-emerald-500 transition-colors" />
              </div>

              {/* Log Entry Content */}
              <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    {getActionIcon(log.action)}
                    <span>{log.action}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {dateStr}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {log.details}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

