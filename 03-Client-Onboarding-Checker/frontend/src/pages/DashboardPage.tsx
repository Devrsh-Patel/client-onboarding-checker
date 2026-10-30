import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Sparkles, 
  FolderGit2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { DashboardStats, OnboardingCaseListItem, ServiceType } from '../types';
import { getDashboardStats, getCases } from '../services/api';
import { MOCK_DASHBOARD_STATS } from '../services/mockData';
import { MetricsOverview } from '../components/MetricsOverview';
import { CaseCard } from '../components/CaseCard';

interface DashboardPageProps {
  onOpenNewCase: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenNewCase }) => {
  const [stats, setStats] = useState<DashboardStats>(MOCK_DASHBOARD_STATS);
  const [cases, setCases] = useState<OnboardingCaseListItem[]>(MOCK_DASHBOARD_STATS.recent_cases);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [fetchedStats, fetchedCases] = await Promise.all([
        getDashboardStats().catch(() => MOCK_DASHBOARD_STATS),
        getCases().catch(() => MOCK_DASHBOARD_STATS.recent_cases),
      ]);
      setStats(fetchedStats);
      setCases(fetchedCases);
    } catch (err) {
      console.warn('Backend API unavailable, using local mock data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'missing') {
        if (c.open_findings_count === 0) return false;
      } else if (statusFilter === 'security') {
        if (!c.has_security_warnings) return false;
      } else if (c.status !== statusFilter) {
        return false;
      }
    }
    if (serviceFilter !== 'all' && c.service_type !== serviceFilter) {
      return false;
    }
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
      
      {/* Executive Welcome & Banner */}
      <div className="scalezix-card p-5 sm:p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white mb-6 sm:mb-8 border-slate-800 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
              Scalezix Client Success Platform
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono">v1.0.0</span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Client Onboarding Document Checker
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Eliminate project kickoff delays and security blindspots. Audit client credentials, verify technical requirements against standardized blueprints, and generate polite, structured follow-up letters in seconds.
          </p>

          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              onClick={onOpenNewCase}
              className="btn-primary text-xs sm:text-sm min-h-[40px] sm:min-h-[38px] justify-center"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Initialize New Intake Case</span>
            </button>
            <a
              href="#cases-grid"
              className="btn-secondary bg-slate-800/80 text-white border-slate-700 hover:bg-slate-700 text-xs sm:text-sm min-h-[40px] sm:min-h-[38px] justify-center"
            >
              <span>Explore Active Cases ({cases.length})</span>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
            </a>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-24 w-60 h-60 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* High-level KPI Metrics */}
      <MetricsOverview 
        stats={stats} 
        onFilterStatus={(st) => setStatusFilter(st)}
      />

      {/* Search & Filters Toolbar */}
      <div id="cases-grid" className="scalezix-card p-3.5 sm:p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Search Input */}
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

        {/* Status and Service Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-medium">Filter:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 md:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-field text-xs py-1.5 w-full min-h-[38px]"
            >
              <option value="all">All Case Statuses</option>
              <option value="in_review">In Review</option>
              <option value="awaiting_client">Awaiting Client</option>
              <option value="approved">Approved for Kickoff</option>
              <option value="blocked">Blocked</option>
              <option value="missing">With Missing Items</option>
              <option value="security">With Security Alerts</option>
            </select>

            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="select-field text-xs py-1.5 w-full min-h-[38px]"
            >
              <option value="all">All Service Types</option>
              <option value="web_app">Web Application / MVP</option>
              <option value="ai_agent">AI Agent / LLM Integration</option>
              <option value="cloud_infrastructure">Cloud Infrastructure & DevOps</option>
              <option value="branding_design">Brand & UI/UX</option>
            </select>
          </div>
        </div>

      </div>

      {/* Cases Cards Grid */}
      {isLoading ? (
        <div className="scalezix-card p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-500">Loading onboarding cases...</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="scalezix-card p-8 sm:p-12 text-center">
          <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Matching Onboarding Cases</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            No active cases match your search query or filter criteria. Create a new case or clear filters.
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

      {/* Scalezix Intake Best Practices Card */}
      <div className="mt-8 sm:mt-12 scalezix-card p-5 sm:p-6 bg-slate-50 border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Scalezix Technical Intake Standard Operating Procedures (SOP)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 text-xs text-slate-600">
          <div className="p-3.5 bg-white rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">
              1. Conservative Credential Security
            </span>
            <p className="leading-relaxed">
              Never accept or store raw passwords, IAM secret keys, or payment tokens in plain text notes. Always verify that client credentials pass through an encrypted vault link.
            </p>
          </div>
          <div className="p-3.5 bg-white rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">
              2. Human Confirmed Findings
            </span>
            <p className="leading-relaxed">
              Automated gap checks provide high-speed verification, but all critical blocking items and security warnings must be reviewed and confirmed by an assigned lead engineer.
            </p>
          </div>
          <div className="p-3.5 bg-white rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">
              3. Deterministic Fallback Integrity
            </span>
            <p className="leading-relaxed">
              Our rule-based engine operates deterministically with zero hallucination risk, guaranteeing consistent audit reports even when offline or during LLM rate limits.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

