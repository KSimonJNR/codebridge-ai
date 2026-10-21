import React from 'react';
import {
  Code2,
  FileCode2,
  GitPullRequest,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Lightbulb,
  MessageSquare,
  Trophy,
  CheckCircle2
} from 'lucide-react';
import { ActiveTab } from '../types.ts';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onLoadQuickCode: () => void;
  onLoadQuickIssue: () => void;
  prCount: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onLoadQuickCode,
  onLoadQuickIssue,
  prCount,
}) => {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <div className="relative text-center max-w-3xl mx-auto pt-6 sm:pt-10">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-cyan-500/15 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-medium mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>Hacktoberfest & Open Source Beginner Accelerator</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-5 leading-tight">
          CodeBridge AI
          <span className="block text-2xl sm:text-4xl lg:text-5xl mt-2 font-bold bg-gradient-to-r from-cyan-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
            Your AI Mentor for Open Source.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
          Understand code, solve GitHub issues, and make your first pull request with confidence.
        </p>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('explainer')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Code2 className="w-4 h-4 text-cyan-300" />
            Explain Code Snippet
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={() => onNavigate('issue-helper')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 hover:border-purple-500/40 font-semibold text-sm sm:text-base transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <FileCode2 className="w-4 h-4 text-purple-400" />
            Deconstruct an Issue
          </button>

          <button
            onClick={() => onNavigate('pr-guide')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 hover:border-cyan-500/40 font-semibold text-sm sm:text-base transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <GitPullRequest className="w-4 h-4 text-cyan-400" />
            First PR Guide
          </button>
        </div>
      </div>

      {/* 3 Main Dashboard Feature Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Core Mentorship Tools
            </h2>
            <p className="text-sm text-slate-400">Everything you need from spotting an issue to merging your contribution.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: AI Code Explainer */}
          <div
            onClick={() => onNavigate('explainer')}
            className="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 p-6 sm:p-7 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10 group-hover:opacity-25 transition-opacity">
              <Code2 className="w-24 h-24 text-cyan-400" />
            </div>

            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform shadow-sm shadow-cyan-500/20">
                <Code2 className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold mb-2">
                1. AI Code Explainer
              </div>
              <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-cyan-300 transition-colors">
                AI Code Explainer
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Paste any unfamiliar open-source function or script. Gemini breaks down its architecture, highlights important lines, detects subtle bugs, and provides runnable examples.
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-sm">
              <span className="text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                Launch Explainer <ArrowRight className="w-4 h-4" />
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadQuickCode();
                }}
                className="text-xs text-slate-400 hover:text-cyan-300 underline underline-offset-4 cursor-pointer"
              >
                Try sample code
              </button>
            </div>
          </div>

          {/* Feature 2: GitHub Issue Helper */}
          <div
            onClick={() => onNavigate('issue-helper')}
            className="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 p-6 sm:p-7 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10 group-hover:opacity-25 transition-opacity">
              <FileCode2 className="w-24 h-24 text-purple-400" />
            </div>

            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform shadow-sm shadow-purple-500/20">
                <FileCode2 className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-xs font-semibold mb-2">
                2. GitHub Issue Helper
              </div>
              <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-purple-300 transition-colors">
                GitHub Issue Helper
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Paste confusing GitHub issue threads or bug reports. Get a plain-English translation, difficulty rating, a step-by-step game plan, and a ready-to-use PR template.
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-sm">
              <span className="text-purple-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                Solve an Issue <ArrowRight className="w-4 h-4" />
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadQuickIssue();
                }}
                className="text-xs text-slate-400 hover:text-purple-300 underline underline-offset-4 cursor-pointer"
              >
                Try sample issue
              </button>
            </div>
          </div>

          {/* Feature 3: First Pull Request Guide */}
          <div
            onClick={() => onNavigate('pr-guide')}
            className="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 p-6 sm:p-7 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10 group-hover:opacity-25 transition-opacity">
              <GitPullRequest className="w-24 h-24 text-indigo-400" />
            </div>

            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-cyan-300 mb-5 group-hover:scale-110 transition-transform shadow-sm shadow-indigo-500/20">
                <GitPullRequest className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-cyan-300 text-xs font-semibold mb-2">
                3. First Pull Request Guide
              </div>
              <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-cyan-300 transition-colors">
                First Pull Request Guide
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Beginner-friendly roadmap for forking, cloning, branching, committing, pushing, and opening your PR. Includes interactive command generator and readiness checklist.
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-sm">
              <span className="text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                View Git Guide <ArrowRight className="w-4 h-4" />
              </span>
              <span className="text-xs text-slate-400">Interactive CLI generator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional 3 Core Features (Idea Generator, Mentor Chat, Tracker) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate('idea-generator')}
          className="rounded-xl bg-slate-900/60 border border-white/10 p-5 hover:border-purple-500/40 transition-all cursor-pointer flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white">4. Project Idea Generator</h4>
            <p className="text-xs text-slate-400">Find or seed your own open source repo.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </div>

        <div
          onClick={() => onNavigate('chat-mentor')}
          className="rounded-xl bg-slate-900/60 border border-white/10 p-5 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white">5. Ask Mentor AI</h4>
            <p className="text-xs text-slate-400">Get 24/7 help on Git rebase & PR etiquette.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </div>

        <div
          onClick={() => onNavigate('tracker')}
          className="rounded-xl bg-slate-900/60 border border-white/10 p-5 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white">6. Personal Dashboard</h4>
            <p className="text-xs text-slate-400">Track tasks & Hacktoberfest goals ({prCount}/4 PRs).</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </div>
      </div>

      {/* Open Source Mentorship Tips & Etiquette */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-cyan-950/40 border border-purple-500/20 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Hacktoberfest Golden Rules
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Make Meaningful Contributions, Not Spam
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Open source maintainers are volunteers. Look for repositories with the <code className="text-cyan-300 bg-black/40 px-1.5 py-0.5 rounded text-xs">hacktoberfest</code> or <code className="text-purple-300 bg-black/40 px-1.5 py-0.5 rounded text-xs">good-first-issue</code> label. Always comment to ask if an issue is available before writing code!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-xl sm:text-2xl font-black text-cyan-400">4</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">PRs to complete</div>
            </div>
            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-xl sm:text-2xl font-black text-purple-400">100%</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Free & open</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
