import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { NewCaseModal } from './components/NewCaseModal';
import { DashboardPage } from './pages/DashboardPage';
import { CasesListPage } from './pages/CasesListPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { SecurityGuidelinesPage } from './pages/SecurityGuidelinesPage';
import { checkBackendHealth } from './services/api';

export const App: React.FC = () => {
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    // Check backend health periodically
    const verifyHealth = async () => {
      const res = await checkBackendHealth();
      setIsBackendConnected(res.status === 'healthy' || res.status === 'ok');
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        
        {/* Navigation Bar */}
        <Navbar
          onOpenNewCase={() => setIsNewCaseModalOpen(true)}
          isBackendConnected={isBackendConnected}
        />

        {/* Main Content Area */}
        <main className="flex-1 pb-16">
          <Routes>
            <Route
              path="/"
              element={<DashboardPage onOpenNewCase={() => setIsNewCaseModalOpen(true)} />}
            />
            <Route
              path="/cases"
              element={<CasesListPage onOpenNewCase={() => setIsNewCaseModalOpen(true)} />}
            />
            <Route path="/cases/:id" element={<CaseDetailPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/security-guidelines" element={<SecurityGuidelinesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global New Case Modal */}
        <NewCaseModal
          isOpen={isNewCaseModalOpen}
          onClose={() => setIsNewCaseModalOpen(false)}
        />

        {/* Scalezix Enterprise Footer */}
        <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">SCALEZIX</span>
              <span className="text-slate-600">|</span>
              <span>Technical Onboarding Document Checker</span>
            </div>
            <div className="flex items-center gap-6 text-[11px]">
              <span className="text-emerald-400 font-mono">
                {isBackendConnected ? 'Backend Connected' : 'Demo Offline Mode'}
              </span>
              <span>Zero Credential Exposure Guarantee</span>
              <span>© {new Date().getFullYear()} Scalezix Technologies</span>
            </div>
          </div>
        </footer>

      </div>
    </BrowserRouter>
  );
};

export default App;

