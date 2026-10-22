import React, { useState, useEffect } from 'react';
import {
  Map,
  Compass,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ListOrdered,
  FileCode,
  GitBranch,
  Terminal,
  BookmarkPlus,
  BookmarkCheck,
  Copy,
  Check,
  Info,
  CheckSquare,
  Square,
  RefreshCw,
  FolderGit2,
  Layers,
  ArrowRight,
  Code2,
  Bug,
  HelpCircle,
  Link,
  BadgeCheck,
  AlertCircle
} from 'lucide-react';
import { ContributionRoadmap, ActiveTab } from '../types.ts';

interface RoadmapViewProps {
  initialRepoUrl?: string;
  initialIssueInput?: string;
  onOpenKeyInfo: () => void;
  onSaveItem?: (title: string, summary: string, details: any) => void;
}

const SAMPLE_ROADMAPS = [
  {
    label: 'React (ESC Modal Bug)',
    repo: 'https://github.com/facebook/react',
    issue: 'https://github.com/facebook/react/issues/28904',
  },
  {
    label: 'FreeCodeCamp (Docs hyperlinking)',
    repo: 'https://github.com/freeCodeCamp/freeCodeCamp',
    issue: 'Broken links in CONTRIBUTING.md pointing to local database setup guide after directory refactoring.',
  },
  {
    label: 'Express.js (Webhook Retry)',
    repo: 'https://github.com/expressjs/express',
    issue: 'Add exponential backoff retry mechanism (1s, 5s, 30s) to webhook delivery worker on HTTP 500 status.',
  }
];

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  initialRepoUrl = '',
  initialIssueInput = '',
  onOpenKeyInfo,
  onSaveItem,
}) => {
  const [repoUrl, setRepoUrl] = useState(initialRepoUrl || SAMPLE_ROADMAPS[0].repo);
  const [issueInput, setIssueInput] = useState(initialIssueInput || SAMPLE_ROADMAPS[0].issue);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<ContributionRoadmap | null>(() => {
    const cached = localStorage.getItem('codebridge_cached_roadmap');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Local storage for checklist progress
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('codebridge_roadmap_checked_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (roadmap) {
      localStorage.setItem('codebridge_cached_roadmap', JSON.stringify(roadmap));
    }
  }, [roadmap]);

  useEffect(() => {
    localStorage.setItem('codebridge_roadmap_checked_tasks', JSON.stringify(checkedTasks));
  }, [checkedTasks]);

  const handleCreateRoadmap = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL (e.g. https://github.com/facebook/react or owner/repo).');
      return;
    }

    if (!issueInput.trim()) {
      setError('Please provide a GitHub issue URL or describe the issue/task you want to tackle.');
      return;
    }

    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch('/api/create-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          issueInput: issueInput.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.keyMissing) {
          onOpenKeyInfo();
        }
        throw new Error(data.error || 'Failed to create contribution roadmap.');
      }

      setRoadmap(data);
      setCheckedTasks({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating roadmap.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveToDashboard = () => {
    if (roadmap && onSaveItem) {
      onSaveItem(
        `Roadmap: ${roadmap.verifiedRepo.fullName}`,
        `Step-by-step contribution plan for "${roadmap.verifiedIssue.title}"`,
        roadmap
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const totalChecklistCount = roadmap?.interactiveChecklist?.length || 0;
  const completedChecklistCount = roadmap?.interactiveChecklist?.filter((t) => checkedTasks[t.id]).length || 0;
  const progressPct = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Map className="w-3.5 h-3.5" />
            End-to-End Contribution Pathway
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">AI Contribution Roadmap</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Go from discovering an open-source repository to preparing your first pull request with a tailored 6-stage roadmap and verified repository data.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
          {SAMPLE_ROADMAPS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setRepoUrl(sample.repo);
                setIssueInput(sample.issue);
                setError(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Panel (Requirements 1, 2, 3) */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 sm:p-7 shadow-xl space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. GitHub Repository URL Input */}
          <div>
            <label htmlFor="roadmap-repo" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
                1. GitHub Repository URL or Identifier:
              </span>
              <span className="text-[11px] font-normal text-slate-500">e.g. facebook/react</span>
            </label>
            <input
              id="roadmap-repo"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/facebook/react or owner/repo"
              className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* 2. GitHub Issue URL or Description */}
          <div>
            <label htmlFor="roadmap-issue" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5 text-purple-400" />
                2. GitHub Issue URL or Description:
              </span>
              <span className="text-[11px] font-normal text-slate-500">URL or pasted text</span>
            </label>
            <input
              id="roadmap-issue"
              type="text"
              value={issueInput}
              onChange={(e) => setIssueInput(e.target.value)}
              placeholder="https://github.com/facebook/react/issues/12345 or paste issue description"
              className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-400 font-mono"
            />
          </div>
        </div>

        {/* Action Button: "Create My Roadmap" */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/10">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Verifies live repository data on GitHub and generates your 6-stage roadmap
          </span>

          <button
            type="button"
            onClick={handleCreateRoadmap}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:shadow-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Your Roadmap...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Create My Roadmap</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl bg-red-950/40 border border-red-500/40 p-4 text-red-200 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-300">Could Not Create Roadmap</p>
            <p className="text-slate-300">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!roadmap && !loading && (
        <div className="rounded-2xl bg-slate-900/60 border border-dashed border-white/15 p-12 text-center flex flex-col items-center justify-center min-h-[360px]">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
            <Map className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Roadmap Generated Yet</h3>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
            Enter a target repository URL and issue URL above, then click <strong>"Create My Roadmap"</strong> to receive an end-to-end plan from project setup to PR submission.
          </p>
          <button
            type="button"
            onClick={handleCreateRoadmap}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            Create Roadmap for {SAMPLE_ROADMAPS[0].label} &rarr;
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-12 text-center flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-500 animate-spin flex items-center justify-center p-[2px]">
            <div className="w-full h-full bg-[#070a13] rounded-[14px]" />
          </div>
          <h3 className="text-base font-bold text-white">Verifying GitHub Repository & Building Roadmap...</h3>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Fetching verified repository details from GitHub, formulating investigation areas, breaking down tasks, and designing your PR template.
          </p>
        </div>
      )}

      {/* Roadmap Output */}
      {roadmap && !loading && (
        <div className="space-y-8 animate-fadeIn">
          {/* Grounding & Verification Header (Requirements 6 & 11) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Repo Verification Status */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between space-y-3 ${
                roadmap.verifiedRepo.verified
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-amber-950/20 border-amber-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {roadmap.verifiedRepo.verified ? (
                    <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">
                      Repository Verification
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      {roadmap.verifiedRepo.fullName}
                    </h4>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    roadmap.verifiedRepo.verified
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {roadmap.verifiedRepo.verified ? 'Verified via GitHub API' : 'Unverified URL'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {roadmap.verifiedRepo.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1 border-t border-white/5">
                {roadmap.verifiedRepo.language && (
                  <span className="font-semibold text-cyan-300">
                    {roadmap.verifiedRepo.language}
                  </span>
                )}
                {roadmap.verifiedRepo.verified && (
                  <>
                    <span>•</span>
                    <span>Default branch: <strong className="font-mono text-slate-200">{roadmap.verifiedRepo.defaultBranch}</strong></span>
                    <span>•</span>
                    <span>⭐ {roadmap.verifiedRepo.stars.toLocaleString()}</span>
                  </>
                )}
                <a
                  href={roadmap.verifiedRepo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>Open Repo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Issue Verification Status */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between space-y-3 ${
                roadmap.verifiedIssue.verified
                  ? 'bg-purple-950/20 border-purple-500/40'
                  : 'bg-slate-900/90 border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">
                      Issue Ticket Status
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white truncate max-w-xs">
                      {roadmap.verifiedIssue.number ? `#${roadmap.verifiedIssue.number} ` : ''}
                      {roadmap.verifiedIssue.title}
                    </h4>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    roadmap.verifiedIssue.verified
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      : 'bg-slate-800 text-slate-300 border-white/10'
                  }`}
                >
                  {roadmap.verifiedIssue.verified ? 'Verified Ticket' : 'Pasted Text'}
                </span>
              </div>

              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {roadmap.verifiedIssue.body}
              </p>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                <span className="text-slate-400">
                  {roadmap.verifiedIssue.verified ? 'Retrieved directly from GitHub' : 'Provided in user prompt'}
                </span>
                {roadmap.verifiedIssue.htmlUrl && (
                  <a
                    href={roadmap.verifiedIssue.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-300 hover:text-purple-200 flex items-center gap-1"
                  >
                    <span>View Issue on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Checklist & Progress Tracker (Requirement 5) */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900/90 via-purple-950/20 to-slate-900/90 border border-purple-500/30 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold">
                  <CheckSquare className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Personalized Contribution Checklist
                  </h3>
                  <p className="text-xs text-slate-400">
                    {completedChecklistCount} of {totalChecklistCount} steps completed ({progressPct}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {onSaveItem && (
                  <button
                    type="button"
                    onClick={handleSaveToDashboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-white/10 transition-colors cursor-pointer"
                  >
                    {saved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Saved to Dashboard</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Bookmark Roadmap</span>
                      </>
                    )}
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-300">{progressPct}%</span>
                  <div className="w-32 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              {roadmap.interactiveChecklist.map((item) => {
                const isDone = Boolean(checkedTasks[item.id]);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleTask(item.id)}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer select-none ${
                      isDone
                        ? 'bg-emerald-950/25 border-emerald-500/40 text-slate-200'
                        : 'bg-[#080d1a] border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    {isDone ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-white/5 shrink-0">
                      {item.stage}
                    </span>
                    <span className={`text-xs leading-relaxed flex-1 ${isDone ? 'line-through text-slate-400' : ''}`}>
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6 Core Personalized Stages (Requirement 4) */}
          <div className="space-y-6">
            {/* Stage 1: Understand Project & Guidelines */}
            <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {roadmap.stages.projectAndGuidelines.title}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                  Orientation & Rules
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {roadmap.stages.projectAndGuidelines.explanation}
              </p>

              <div className="rounded-xl bg-[#080d1a] border border-white/5 p-4 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Golden Contribution Rules for this Project:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  {roadmap.stages.projectAndGuidelines.keyRules.map((rule, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Stage 2: Understand the Selected Issue */}
            <div className="rounded-2xl bg-slate-900/90 border border-purple-500/30 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {roadmap.stages.understandIssue.title}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">
                  Problem Translation
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-[#080d1a] border border-white/5 p-4 space-y-1">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                    Plain-English Summary:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {roadmap.stages.understandIssue.plainEnglishSummary}
                  </p>
                </div>

                <div className="rounded-xl bg-[#080d1a] border border-white/5 p-4 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Expected Behavior vs Current State:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {roadmap.stages.understandIssue.expectedBehavior}
                  </p>
                </div>

                {roadmap.stages.understandIssue.potentialTraps.length > 0 && (
                  <div className="rounded-xl bg-amber-950/20 border border-amber-500/25 p-3.5 space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Potential Traps / Misunderstandings to Avoid:
                    </span>
                    <ul className="space-y-1 text-xs text-amber-100 list-disc list-inside">
                      {roadmap.stages.understandIssue.potentialTraps.map((trap, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {trap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Stage 3: Likely Files or Areas to Investigate */}
            <div className="rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {roadmap.stages.areasToInvestigate.title}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                  Architectural Hypotheses
                </span>
              </div>

              {/* Mandatory Grounding Disclaimer (Requirement 6) */}
              <div className="rounded-xl bg-indigo-950/40 border border-indigo-500/30 p-3.5 text-xs text-indigo-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Notice:</strong> {roadmap.stages.areasToInvestigate.disclaimer || 'These areas are architectural recommendations based on repository conventions. Always verify internal file paths in your local checkout.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {roadmap.stages.areasToInvestigate.recommendedAreas.map((rec, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-[#080d1a] border border-white/5 p-4 space-y-1.5"
                  >
                    <span className="text-xs font-mono font-bold text-cyan-300 block">
                      📁 {rec.area}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rec.why}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 4: Task Breakdown */}
            <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {roadmap.stages.taskBreakdown.title}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">
                  Micro-Milestones
                </span>
              </div>

              <div className="space-y-2.5">
                {roadmap.stages.taskBreakdown.tasks.map((task, idx) => (
                  <div
                    key={task.id || idx}
                    className="rounded-xl bg-[#080d1a] border border-white/5 p-3.5 flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 border border-white/10 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-white">{task.task}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{task.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 5: Testing Strategy */}
            <div className="rounded-2xl bg-slate-900/90 border border-emerald-500/30 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center text-xs font-bold">
                    5
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {roadmap.stages.testingStrategy.title}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  Verification & QA
                </span>
              </div>

              <div className="space-y-3">
                {roadmap.stages.testingStrategy.testCommands.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Recommended Test Commands:
                    </span>
                    <div className="space-y-1.5">
                      {roadmap.stages.testingStrategy.testCommands.map((cmd, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl bg-[#060a14] border border-white/10 p-3 font-mono text-xs text-cyan-300 flex items-center justify-between"
                        >
                          <code>{cmd}</code>
                          <button
                            type="button"
                            onClick={() => handleCopy(cmd, `test-cmd-${idx}`)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Copy command"
                          >
                            {copiedKey === `test-cmd-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-[#080d1a] border border-white/5 p-4 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Manual Verification Steps:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {roadmap.stages.testingStrategy.manualSteps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-slate-400 italic">
                  <strong>How to avoid regressions:</strong> {roadmap.stages.testingStrategy.howToAvoidRegression}
                </p>
              </div>
            </div>

            {/* Stage 6: Git & Pull Request Workflow */}
            <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center text-xs font-bold">
                    6
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {roadmap.stages.gitAndPrWorkflow.title}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                  Branch, Commit & PR
                </span>
              </div>

              {/* Exact Git Commands */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Terminal Commands for this PR:
                </span>
                {roadmap.stages.gitAndPrWorkflow.commands.map((cmdItem, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-[#060a14] border border-white/10 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs font-mono text-cyan-300">{cmdItem.cmd}</code>
                      <button
                        type="button"
                        onClick={() => handleCopy(cmdItem.cmd, `workflow-cmd-${idx}`)}
                        className="px-2 py-0.5 rounded bg-slate-800 text-xs text-slate-300 hover:text-white border border-white/10"
                      >
                        {copiedKey === `workflow-cmd-${idx}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      💡 {cmdItem.purpose}
                    </p>
                  </div>
                ))}
              </div>

              {/* Suggested PR Template */}
              <div className="rounded-xl bg-[#080d1a] border border-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Recommended PR Title & Description
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `${roadmap.stages.gitAndPrWorkflow.suggestedPrTitle}\n\n${roadmap.stages.gitAndPrWorkflow.suggestedPrBody}`,
                        'roadmap-pr'
                      )
                    }
                    className="flex items-center gap-1 text-xs text-cyan-300 hover:text-white px-2 py-1 rounded bg-slate-800 border border-white/10"
                  >
                    {copiedKey === 'roadmap-pr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy PR Markdown</span>
                  </button>
                </div>

                <div className="font-mono text-xs text-cyan-300 bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <span className="text-slate-500">Title: </span>
                  {roadmap.stages.gitAndPrWorkflow.suggestedPrTitle}
                </div>

                <pre className="text-xs font-mono text-slate-300 bg-black/40 p-3 rounded-lg border border-white/5 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  <code>{roadmap.stages.gitAndPrWorkflow.suggestedPrBody}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
