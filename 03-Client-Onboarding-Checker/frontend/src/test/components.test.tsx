import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { MetricsOverview } from '../components/MetricsOverview';
import { CaseCard } from '../components/CaseCard';
import { CaseChecklistTable } from '../components/CaseChecklistTable';
import { FindingsList } from '../components/FindingsList';
import { FollowUpEditor } from '../components/FollowUpEditor';
import { MOCK_DASHBOARD_STATS, MOCK_CASE_DETAIL } from '../services/mockData';

describe('Project 3: Client Onboarding Document Checker Frontend Suite', () => {
  it('renders Navbar with Scalezix brand identity and action buttons', () => {
    const onOpen = vi.fn();
    render(
      <BrowserRouter>
        <Navbar onOpenNewCase={onOpen} isBackendConnected={true} />
      </BrowserRouter>
    );

    expect(screen.getByText('SCALEZIX')).toBeInTheDocument();
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('API Live')).toBeInTheDocument();

    const newBtn = screen.getByRole('button', { name: /new onboarding case/i });
    expect(newBtn).toBeInTheDocument();
    fireEvent.click(newBtn);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('renders MetricsOverview with accurate counts and status triggers', () => {
    const onFilter = vi.fn();
    render(<MetricsOverview stats={MOCK_DASHBOARD_STATS} onFilterStatus={onFilter} />);

    expect(screen.getByText('Active Onboardings')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Missing Requirements')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Security & Credential Alerts')).toBeInTheDocument();
    expect(screen.getByText('Approved For Kickoff')).toBeInTheDocument();
  });

  it('renders CaseCard with project name, client company, and progress percentage', () => {
    const sampleCase = MOCK_DASHBOARD_STATS.recent_cases[0];
    render(
      <BrowserRouter>
        <CaseCard caseItem={sampleCase} />
      </BrowserRouter>
    );

    expect(screen.getByText('Omnichannel B2B Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Apex Retail Global')).toBeInTheDocument();
    expect(screen.getByText('In Technical Review')).toBeInTheDocument();
    expect(screen.getByText(/Checklist Completion/i)).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 3/i)).toBeInTheDocument();
    expect(screen.getByText('Credential Alert')).toBeInTheDocument();
  });

  it('renders CaseChecklistTable with category grouping and acceptable evidence', () => {
    const openModal = vi.fn();
    const quickStatus = vi.fn();

    render(
      <CaseChecklistTable
        submissions={MOCK_CASE_DETAIL.submissions}
        onOpenUploadModal={openModal}
        onQuickStatusChange={quickStatus}
      />
    );

    expect(screen.getByText('Architecture & Cloud Hosting')).toBeInTheDocument();
    expect(screen.getByText('Cloud Provider IAM Role or Access Delegation')).toBeInTheDocument();
    expect(screen.getByText('Production Domain DNS Delegation')).toBeInTheDocument();
    expect(screen.getByText('Stripe Sandbox API Keys & Webhook Secret')).toBeInTheDocument();

    const updateButtons = screen.getAllByRole('button', { name: /update/i });
    expect(updateButtons.length).toBeGreaterThan(0);
    fireEvent.click(updateButtons[0]);
    expect(openModal).toHaveBeenCalled();
  });

  it('renders FindingsList with severity badges and security notices', () => {
    const resolveFn = vi.fn();
    const confirmFn = vi.fn();
    const gapFn = vi.fn();
    const aiFn = vi.fn();

    render(
      <FindingsList
        findings={MOCK_CASE_DETAIL.findings}
        onToggleResolve={resolveFn}
        onToggleConfirm={confirmFn}
        onTriggerGapAnalysis={gapFn}
        onTriggerAiAnalysis={aiFn}
        isAnalyzing={false}
      />
    );

    expect(screen.getByText('Sensitive Credential Safety Notice')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText(/Security Warning: Potential Credential Exposed/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /confirmed ✓/i });
    expect(confirmBtn).toBeInTheDocument();
  });

  it('renders FollowUpEditor with editable fields and export actions', () => {
    const genFn = vi.fn();
    const saveFn = vi.fn();

    render(
      <FollowUpEditor
        followUp={MOCK_CASE_DETAIL.follow_up_message}
        onGenerate={genFn}
        onSave={saveFn}
        isGenerating={false}
        clientEmail="sarah.connor@apexretail.io"
      />
    );

    expect(screen.getByText('Client Communication Composer')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Action Required: Onboarding Items/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export \.md/i })).toBeInTheDocument();
  });
});

