import React, { useState } from 'react';
import {
  Code2,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  Sparkles,
  Layers,
  FileCode2,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Trophy,
  Compass,
  Map
} from 'lucide-react';
import { ActiveTab, ServerStatus } from '../types.ts';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  status: ServerStatus | null;
  onOpenKeyInfo: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  status,
  onOpenKeyInfo,
  savedCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'My Dashboard', icon: <Layers className="w-4 h-4" /> },
    { id: 'explainer', label: 'Code Explainer', icon: <Code2 className="w-4 h-4" /> },
    { id: 'issue-helper', label: 'Issue Helper', icon: <FileCode2 className="w-4 h-4" /> },
    { id: 'pr-guide', label: 'PR Guide', icon: <GitPullRequest className="w-4 h-4" /> },
    { id: 'idea-generator', label: 'Idea Generator', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'repo-finder', label: 'Repo Finder', icon: <Compass className="w-4 h-4" /> },
    { id: 'roadmap', label: 'Roadmap', icon: <Map className="w-4 h-4" /> },
    { id: 'chat-mentor', label: 'Ask Mentor', icon: <MessageSquare className="w-4 h-4" /> },
    {
      id: 'tracker',
      label: 'My Tracker',
      icon: <Trophy className="w-4 h-4" />,
      badge: savedCount > 0 ? String(savedCount) : undefined,
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#070a13]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/35 transition-all">
              <div className="w-full h-full bg-[#070a13] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-sans">
                  CodeBridge<span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Hacktoberfest
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400 -mt-0.5">
                Your AI Mentor for Open Source
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-white/5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-purple-600/30 text-cyan-300 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {status ? (
              status.configured ? (
                <div
                  title={`Gemini AI Active (${status.model}${status.fallbackModels?.length ? ` with ${status.fallbackModels.join(', ')} fallback` : ''})`}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium cursor-help"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="hidden sm:inline">Gemini AI Active</span>
                  <span className="sm:hidden">Active</span>
                </div>
              ) : (
                <button
                  onClick={onOpenKeyInfo}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/25 transition-colors cursor-pointer"
                  title="GEMINI_API_KEY is not configured"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Key Setup</span>
                  <span className="sm:hidden">Key</span>
                </button>
              )
            ) : (
              <div className="h-6 w-16 bg-slate-800 animate-pulse rounded-full" />
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown navigation */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-3 px-2 border-t border-white/5 space-y-1 bg-[#070a13]">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600/25 text-cyan-300 border border-purple-500/40 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
