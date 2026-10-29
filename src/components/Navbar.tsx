import React, { useState, useEffect } from 'react';
import {
  Code2,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  Layers,
  FileCode2,
  Lightbulb,
  MessageSquare,
  Trophy,
  Compass,
  Map,
  GraduationCap,
  User,
  Cloud,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { ActiveTab, ServerStatus } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  status: ServerStatus | null;
  onOpenKeyInfo: () => void;
  savedCount: number;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  status,
  onOpenKeyInfo,
  savedCount,
  onOpenAuthModal,
}) => {
  const { user, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check initial theme from documentElement
    const isDarkTheme = document.documentElement.classList.contains('dark');
    setIsDark(isDarkTheme);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('codebridge_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('codebridge_theme', 'light');
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'learning-center', label: 'Learning Center', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'explainer', label: 'Code Explainer', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'issue-helper', label: 'Issue Helper', icon: <FileCode2 className="w-3.5 h-3.5" /> },
    { id: 'pr-guide', label: 'PR Guide', icon: <GitPullRequest className="w-3.5 h-3.5" /> },
    { id: 'idea-generator', label: 'Ideas', icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { id: 'repo-finder', label: 'Repositories', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'roadmap', label: 'Roadmap', icon: <Map className="w-3.5 h-3.5" /> },
    { id: 'chat-mentor', label: 'Mentor AI', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    {
      id: 'tracker',
      label: 'Tracker',
      icon: <Trophy className="w-3.5 h-3.5" />,
      badge: savedCount > 0 ? String(savedCount) : undefined,
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-surface/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Zone 1: 71UI Brand Wordmark */}
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 group select-none"
          >
            <div className="w-7 h-7 rounded-[8px] bg-[#0070E0] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[16px] sm:text-[17px] text-ink-strong tracking-[-0.02em]">
                CodeBridge <span className="text-[#0070E0]">AI</span>
              </span>
              <span className="hidden lg:inline-flex items-center h-5 px-1.5 rounded-[4px] text-[11px] font-mono text-ink-subtle bg-surface-2 border border-hairline">
                Open Source
              </span>
            </div>
          </div>

          {/* Zone 2: 71UI 32px Nav Items with 10px Radius */}
          <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`h-8 px-2.5 rounded-[10px] text-[13px] font-medium inline-flex items-center gap-1.5 transition-all duration-150 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-surface-2 text-ink-strong border border-hairline shadow-sm'
                      : 'text-ink-subtle hover:text-ink hover:bg-surface-2/60 border border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-[#0070E0]' : 'text-ink-subtle'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="inline-flex items-center justify-center h-4 px-1 rounded-[4px] text-[11px] font-mono bg-surface-2 text-ink-subtle border border-hairline tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 71UI Actions (Theme toggle, Status, Account) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status indicator */}
            {status ? (
              status.configured ? (
                <div
                  title={`Gemini AI Active (${status.model})`}
                  className="hidden md:inline-flex items-center gap-1.5 h-6 px-2 rounded-[6px] text-[12px] font-medium bg-[var(--color-success-fill)] text-[var(--color-on-success)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                  <span>Gemini 3.8</span>
                </div>
              ) : (
                <button
                  onClick={onOpenKeyInfo}
                  className="inline-flex items-center gap-1.5 h-6 px-2 rounded-[6px] text-[12px] font-medium bg-[var(--color-warning-fill)] text-[var(--color-on-warning)] cursor-pointer"
                  title="Configure Gemini API Key"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Key Setup</span>
                </button>
              )
            ) : null}

            {/* Theme Switcher Toggle (71UI Light / Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="h-8 w-8 rounded-[10px] border border-hairline bg-surface hover:bg-surface-2 text-ink-subtle hover:text-ink-strong inline-flex items-center justify-center transition-colors cursor-pointer"
              title={isDark ? 'Switch to 71UI Light Mode' : 'Switch to 71UI Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Auth Profile / Sign In Button */}
            {user ? (
              <button
                type="button"
                onClick={() => handleNavClick('account')}
                className={`h-8 px-2.5 rounded-[10px] border text-[13px] font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'account'
                    ? 'bg-surface-2 border-[#0070E0] text-ink-strong'
                    : 'bg-surface border-hairline text-ink hover:bg-surface-2'
                }`}
                title={`Signed in as ${user.email}`}
              >
                <div className="w-4.5 h-4.5 rounded-full bg-[#0070E0] flex items-center justify-center text-[10px] text-white font-medium shrink-0">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.email?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <span className="hidden md:inline truncate max-w-[90px]">
                  {profile?.fullName || user.email?.split('@')[0]}
                </span>
                <Cloud className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="btn-primary"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden h-8 w-8 rounded-[10px] border border-hairline bg-surface hover:bg-surface-2 text-ink flex items-center justify-center cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown navigation */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-hairline space-y-1">
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`h-9 px-3 rounded-[10px] text-[13px] font-medium flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-surface-2 text-ink-strong border border-hairline'
                        : 'text-ink-subtle hover:text-ink hover:bg-surface-2/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={isActive ? 'text-[#0070E0]' : ''}>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[11px] font-mono text-ink-subtle tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Account link */}
            <div className="pt-2 border-t border-hairline flex items-center justify-between gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => handleNavClick('account')}
                  className="btn-secondary w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#0070E0]" />
                    <span>Account ({user.email?.split('@')[0]})</span>
                  </div>
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="btn-primary w-full"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In / Sync</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
