import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, FileCheck2, FolderGit2 } from 'lucide-react';
import { OnboardingCaseListItem } from '../types';
import { getCases } from '../services/api';
import { MOCK_DASHBOARD_STATS } from '../services/mockData';
import { CaseCard } from '../components/CaseCard';

interface CasesListPageProps {
  onOpenNewCase: () => void;
}

export const CasesListPage: React.FC<CasesListPageProps> = ({ onOpenNewCase }) => {
  const [cases, setCases] = useState<OnboardingCaseListItem[]>(MOCK_DASHBOARD_STATS.recent_cases);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const fetched = await getCases();
      setCases(fetched);
    } catch (err) {
      console.warn('API unavailable, using mock cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (serviceFilter !== 'all' && c.service_type !== serviceFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        c.project_name.toLowerCase().includes(q) ||
        c.client_name.toLowerCase().includes(q) ||
        c.client_company.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" />
            <span>Client Onboarding Cases</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track, audit, and verify client technical submissions across all active projects.
          </p>
        </div>

        <button
          onClick={onOpenNewCase}
          className="btn-primary text-xs sm:text-sm w-full sm:w-auto min-h-[40px] sm:min-h-[38px] justify-center"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span>New Onboarding Case</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="scalezix-card p-3.5 sm:p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client, project, or company..."
            className="input-field pl-9 text-xs min-h-[38px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field text-xs py-1.5 w-full min-h-[38px]"
          >
            <option value="all">All Statuses</option>
            <option value="in_review">In Review</option>
            <option value="awaiting_client">Awaiting Client</option>
            <option value="approved">Approved for Kickoff</option>
            <option value="blocked">Blocked</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="select-field text-xs py-1.5 w-full min-h-[38px]"
          >
            <option value="all">All Service Types</option>
            <option value="web_app">Web Application / MVP</option>
            <option value="ai_agent">AI Agent / LLM Integration</option>
            <option value="cloud_infrastructure">Cloud Infrastructure</option>
            <option value="branding_design">Brand & Design</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="scalezix-card p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-500">Loading cases...</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="scalezix-card p-8 sm:p-12 text-center">
          <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Cases Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            No onboarding cases match your selected filter. Create a new case to get started.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setServiceFilter('all');
            }}
            className="btn-secondary text-xs min-h-[38px]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCases.map((c) => (
            <CaseCard key={c.id} caseItem={c} />
          ))}
        </div>
      )}

    </div>
  );
};

