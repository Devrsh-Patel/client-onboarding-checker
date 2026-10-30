import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileCheck2, 
  Layers, 
  ShieldAlert, 
  Plus, 
  Radio,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  onOpenNewCase: () => void;
  isBackendConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewCase, isBackendConnected }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/cases', label: 'Cases & Reviews', icon: FileCheck2 },
    { path: '/templates', label: 'Templates', icon: Layers },
    { path: '/security-guidelines', label: 'Security Vault', icon: ShieldAlert },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 sm:gap-8 min-w-0">
            <Link 
              to="/" 
              className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg p-1"
              aria-label="Scalezix Home"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-sans">
                    SCALEZIX
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-500/30">
                    Onboarding
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 -mt-0.5 hidden sm:block truncate">
                  Document Checker & Intake Auditor
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links (>= md / 768px) */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-slate-800 text-emerald-400 font-semibold shadow-inner'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Backend API Connection Indicator */}
            <div 
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isBackendConnected
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                  : 'bg-amber-950/40 text-amber-400 border-amber-800/50'
              }`}
              title={isBackendConnected ? 'Backend API connected (Django 6.0 REST)' : 'Offline / Standalone preview mode'}
            >
              <Radio className={`w-3 h-3 ${isBackendConnected ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
              <span className="font-mono text-[11px]">{isBackendConnected ? 'API Live' : 'Demo Mode'}</span>
            </div>

            {/* New Onboarding Case Button (Maintained exact accessible name for tests) */}
            <button
              onClick={onOpenNewCase}
              className="btn-primary min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
              id="header-new-case-btn"
              aria-label="New Onboarding Case"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">New Onboarding Case</span>
              <span className="xs:hidden sm:hidden">New Case</span>
            </button>

            {/* Mobile Hamburger Menu Toggle (< md / 768px) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-emerald-400" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer / Dropdown Menu (< md) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-md px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-2xl">
          {/* Status Badge in Mobile Drawer */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/80 border border-slate-700/60 mb-2">
            <span className="text-xs text-slate-300 font-medium">Backend Status</span>
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold">
              <Radio className={`w-3 h-3 ${isBackendConnected ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
              <span className={isBackendConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {isBackendConnected ? 'API Live (Connected)' : 'Demo Mode (Offline)'}
              </span>
            </div>
          </div>

          {/* Navigation Links with generous touch targets (min 44px) */}
          <nav className="space-y-1" aria-label="Mobile Navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    active
                      ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-400 pl-3'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Action Button in Mobile Drawer */}
          <div className="pt-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenNewCase();
              }}
              className="btn-primary w-full py-2.5 text-xs font-bold justify-center min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Onboarding Case</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};


