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
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-ink-subtle text-[12px] font-medium uppercase tracking-wider mb-1">
            <Map className="w-3.5 h-3.5 text-[#0070E0]" />
            End-to-End Contribution Pathway
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-ink-strong tracking-tight">
            AI Contribution Roadmap <span className="text-ink-subtle">· Guided Plan</span>
          </h2>
          <p className="text-[13px] text-ink-subtle mt-1 max-w-2xl leading-relaxed">
            Go from discovering an open-source repository to preparing your first pull request with a tailored 6-stage roadmap and verified repository data.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-ink-subtle font-medium">Quick Presets:</span>
          {SAMPLE_ROADMAPS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setRepoUrl(sample.repo);
                setIssueInput(sample.issue);
                setError(null);
              }}
              className="btn-secondary h-7 px-2.5 rounded-[8px] text-[12px] cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Panel */}
      <div className="rounded-xl bg-surface border border-hairline p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 1. GitHub Repository URL Input */}
          <div>
            <label htmlFor="roadmap-repo" className="block text-[12px] font-medium text-ink-strong mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-[#0070E0]" />
                1. GitHub Repository URL or Identifier:
              </span>
              <span className="text-[11px] font-normal text-ink-subtle">e.g. facebook/react</span>
            </label>
            <input
              id="roadmap-repo"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/facebook/react or owner/repo"
              className="input-71 font-mono text-[13px]"
            />
          </div>

          {/* 2. GitHub Issue URL or Description */}
          <div>
            <label htmlFor="roadmap-issue" className="block text-[12px] font-medium text-ink-strong mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5 text-[#0070E0]" />
                2. GitHub Issue URL or Description:
              </span>
              <span className="text-[11px] font-normal text-ink-subtle">URL or pasted text</span>
            </label>
            <input
              id="roadmap-issue"
              type="text"
              value={issueInput}
              onChange={(e) => setIssueInput(e.target.value)}
              placeholder="https://github.com/facebook/react/issues/12345 or paste issue description"
              className="input-71 font-mono text-[13px]"
            />
          </div>
        </div>

        {/* Action Button: "Create My Roadmap" */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-hairline">
          <span className="text-[12px] text-ink-subtle hidden sm:inline">
            Verifies live repository data on GitHub and generates your 6-stage roadmap
          </span>

          <button
            type="button"
            onClick={handleCreateRoadmap}
            disabled={loading}
            className="btn-primary h-9 px-5 rounded-[10px] text-[13px] font-medium w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Your Roadmap...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create My Roadmap</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-600 dark:text-red-400 text-[13px] flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-medium text-red-700 dark:text-red-300">Could Not Create Roadmap</p>
            <p className="text-ink-subtle">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!roadmap && !loading && (
        <div className="rounded-xl bg-surface border border-dashed border-hairline p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-12 h-12 rounded-[10px] bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle mb-3">
            <Map className="w-6 h-6 text-[#0070E0]" />
          </div>
          <h3 className="text-[15px] font-medium text-ink-strong mb-1">No Roadmap Generated Yet</h3>
          <p className="text-[12px] text-ink-subtle max-w-md leading-relaxed mb-4">
            Enter a target repository URL and issue URL above, then click <strong>"Create My Roadmap"</strong> to receive an end-to-end plan from project setup to PR submission.
          </p>
          <button
            type="button"
            onClick={handleCreateRoadmap}
            className="btn-secondary h-8 px-3 rounded-[10px] text-[12px] cursor-pointer"
          >
            Create Roadmap for {SAMPLE_ROADMAPS[0].label} &rarr;
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="rounded-xl bg-surface border border-hairline p-10 text-center flex flex-col items-center justify-center min-h-[320px] space-y-3">
          <div className="w-10 h-10 border-2 border-[#0070E0] border-t-transparent rounded-full animate-spin" />
          <h3 className="text-[14px] font-medium text-ink-strong">Verifying GitHub Repository & Building Roadmap...</h3>
          <p className="text-[12px] text-ink-subtle max-w-sm leading-relaxed">
            Fetching verified repository details from GitHub, formulating investigation areas, breaking down tasks, and designing your PR template.
          </p>
        </div>
      )}

      {/* Roadmap Output */}
      {roadmap && !loading && (
        <div className="space-y-6">
          {/* Grounding & Verification Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Repo Verification Status */}
            <div className="rounded-xl bg-surface border border-hairline p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {roadmap.verifiedRepo.verified ? (
                    <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider block text-ink-subtle">
                      Repository Verification
                    </span>
                    <h4 className="text-[14px] font-medium text-ink-strong">
                      {roadmap.verifiedRepo.fullName}
                    </h4>
                  </div>
                </div>

                <span className="badge-71 text-[10px]">
                  {roadmap.verifiedRepo.verified ? 'Verified via GitHub API' : 'Unverified URL'}
                </span>
              </div>

              <p className="text-[12px] text-ink-subtle leading-relaxed">
                {roadmap.verifiedRepo.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-subtle pt-2 border-t border-hairline">
                {roadmap.verifiedRepo.language && (
                  <span className="font-medium text-[#0070E0]">
                    {roadmap.verifiedRepo.language}
                  </span>
                )}
                {roadmap.verifiedRepo.verified && (
                  <>
                    <span>·</span>
                    <span>Branch: <strong className="font-mono text-ink font-normal">{roadmap.verifiedRepo.defaultBranch}</strong></span>
                    <span>·</span>
                    <span className="tabular-nums">★ {roadmap.verifiedRepo.stars.toLocaleString()}</span>
                  </>
                )}
                <a
                  href={roadmap.verifiedRepo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-[#0070E0] hover:underline flex items-center gap-1"
                >
                  <span>Open Repo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Issue Verification Status */}
            <div className="rounded-xl bg-surface border border-hairline p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4 text-[#0070E0] shrink-0" />
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider block text-ink-subtle">
                      Issue Ticket Status
                    </span>
                    <h4 className="text-[14px] font-medium text-ink-strong truncate max-w-xs">
                      {roadmap.verifiedIssue.number ? `#${roadmap.verifiedIssue.number} ` : ''}
                      {roadmap.verifiedIssue.title}
                    </h4>
                  </div>
                </div>

                <span className="badge-71 text-[10px]">
                  {roadmap.verifiedIssue.verified ? 'Verified Ticket' : 'Pasted Text'}
                </span>
              </div>

              <p className="text-[12px] text-ink-subtle line-clamp-3 leading-relaxed">
                {roadmap.verifiedIssue.body}
              </p>

              <div className="flex items-center justify-between text-[12px] pt-2 border-t border-hairline">
                <span className="text-ink-subtle">
                  {roadmap.verifiedIssue.verified ? 'Retrieved directly from GitHub' : 'Provided in user prompt'}
                </span>
                {roadmap.verifiedIssue.htmlUrl && (
                  <a
                    href={roadmap.verifiedIssue.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0070E0] hover:underline flex items-center gap-1"
                  >
                    <span>View Issue on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Checklist & Progress Tracker */}
          <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-surface-2 border border-hairline text-[#0070E0] flex items-center justify-center font-medium">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[14px] font-medium text-ink-strong">
                    Personalized Contribution Checklist
                  </h3>
                  <p className="text-[12px] text-ink-subtle">
                    {completedChecklistCount} of {totalChecklistCount} steps completed ({progressPct}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {onSaveItem && (
                  <button
                    type="button"
                    onClick={handleSaveToDashboard}
                    className="btn-secondary h-8 px-3 rounded-[10px] text-[12px] flex items-center gap-1.5 cursor-pointer"
                  >
                    {saved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">Saved to Dashboard</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5 text-[#0070E0]" />
                        <span>Bookmark Roadmap</span>
                      </>
                    )}
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-mono font-medium text-[#0070E0] tabular-nums">{progressPct}%</span>
                  <div className="w-32 h-1.5 bg-surface-2 rounded-full overflow-hidden border border-hairline">
                    <div
                      className="h-full bg-[#0070E0] transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-1.5 pt-2 border-t border-hairline">
              {roadmap.interactiveChecklist.map((item) => {
                const isDone = Boolean(checkedTasks[item.id]);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleTask(item.id)}
                    className={`h-10 px-3 rounded-[8px] border flex items-center gap-2.5 text-[12px] transition-colors cursor-pointer select-none ${
                      isDone
                        ? 'bg-surface-2 border-hairline text-ink-subtle'
                        : 'bg-surface border-hairline text-ink hover:border-hairline-strong'
                    }`}
                  >
                    {isDone ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                    )}
                    <span className="badge-71 font-mono uppercase text-[10px] shrink-0">
                      {item.stage}
                    </span>
                    <span className={`leading-relaxed truncate flex-1 ${isDone ? 'line-through text-ink-subtle' : ''}`}>
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6 Core Personalized Stages */}
          <div className="space-y-4">
            {/* Stage 1: Understand Project & Guidelines */}
            <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-[4px] bg-surface-2 border border-hairline text-[#0070E0] flex items-center justify-center text-[11px] font-mono font-medium">
                    1
                  </span>
                  <h3 className="text-[14px] font-medium text-ink-strong">
                    {roadmap.stages.projectAndGuidelines.title}
                  </h3>
                </div>
                <span className="badge-71 text-[10px]">
                  Orientation & Rules
                </span>
              </div>

              <p className="text-[13px] text-ink leading-relaxed">
                {roadmap.stages.projectAndGuidelines.explanation}
              </p>

              <div className="rounded-lg bg-surface-2 border border-hairline p-3.5 space-y-1.5">
                <span className="text-[11px] font-medium text-ink-strong uppercase tracking-wider block">
                  Golden Contribution Rules for this Project:
                </span>
                <ul className="space-y-1 text-[12px] text-ink-subtle list-disc list-inside">
                  {roadmap.stages.projectAndGuidelines.keyRules.map((rule, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Stage 2: Understand the Selected Issue */}
            <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-[4px] bg-surface-2 border border-hairline text-[#0070E0] flex items-center justify-center text-[11px] font-mono font-medium">
                    2
                  </span>
                  <h3 className="text-[14px] font-medium text-ink-strong">
                    {roadmap.stages.understandIssue.title}
                  </h3>
                </div>
                <span className="badge-71 text-[10px]">
                  Problem Translation
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-lg bg-surface-2 border border-hairline p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-[#0070E0] uppercase tracking-wider block">
                    Plain-English Summary:
                  </span>
                  <p className="text-[13px] text-ink leading-relaxed">
                    {roadmap.stages.understandIssue.plainEnglishSummary}
                  </p>
                </div>

                <div className="rounded-lg bg-surface-2 border border-hairline p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    Expected Behavior vs Current State:
                  </span>
                  <p className="text-[13px] text-ink leading-relaxed">
                    {roadmap.stages.understandIssue.expectedBehavior}
                  </p>
                </div>

                {roadmap.stages.understandIssue.potentialTraps.length > 0 && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 space-y-1">
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Potential Traps / Misunderstandings to Avoid:
                    </span>
                    <ul className="space-y-1 text-[12px] text-amber-700 dark:text-amber-200 list-disc list-inside">
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
            <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-[4px] bg-surface-2 border border-hairline text-[#0070E0] flex items-center justify-center text-[11px] font-mono font-medium">
                    3
                  </span>
                  <h3 className="text-[14px] font-medium text-ink-strong">
                    {roadmap.stages.areasToInvestigate.title}
                  </h3>
                </div>
                <span className="badge-71 text-[10px]">
                  Architectural Hypotheses
                </span>
              </div>

              {/* Grounding Disclaimer */}
              <div className="rounded-lg bg-surface-2 border border-hairline p-3 text-[12px] text-ink-subtle flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-[#0070E0] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-ink font-medium">Notice:</strong> {roadmap.stages.areasToInvestigate.disclaimer || 'These areas are architectural recommendations based on repository conventions. Always verify internal file paths in your local checkout.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roadmap.stages.areasToInvestigate.recommendedAreas.map((rec, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-surface-2 border border-hairline p-3.5 space-y-1"
                  >
                    <span className="text-[12px] font-mono font-medium text-[#0070E0] block">
                      📁 {rec.area}
                    </span>
                    <p className="text-[12px] text-ink-subtle leading-relaxed">
                      {rec.why}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 4: Task Breakdown */}
            <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-[4px] bg-surface-2 border border-hairline text-[#0070E0] flex items-center justify-center text-[11px] font-mono font-medium">
                    4
                  </span>
                  <h3 className="text-[14px] font-medium text-ink-strong">
                    {roadmap.stages.taskBreakdown.title}
                  </h3>
                </div>
                <span className="badge-71 text-[10px]">
                  Micro-Milestones
                </span>
              </div>

              <div className="space-y-2">
                {roadmap.stages.taskBreakdown.tasks.map((task, idx) => (
                  <div
                    key={task.id || idx}
                    className="rounded-lg bg-surface-2 border border-hairline p-3 flex items-start gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-[4px] bg-surface border border-hairline text-ink-subtle flex items-center justify-center text-[11px] font-mono font-medium shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <h4 className="text-[13px] font-medium text-ink-strong">{task.task}</h4>
                      <p className="text-[12px] text-ink-subtle leading-relaxed">{task.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 5: Testing Strategy */}
            <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-[4px] bg-surface-2 border border-hairline text-[#0070E0] flex items-center justify-center text-[11px] font-mono font-medium">
                    5
                  </span>
                  <h3 className="text-[14px] font-medium text-ink-strong">
                    {roadmap.stages.testingStrategy.title}
                  </h3>
                </div>
                <span className="badge-71 text-[10px]">
                  Verification & QA
                </span>
              </div>

              <div className="space-y-2.5">
                {roadmap.stages.testingStrategy.testCommands.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-ink-strong uppercase tracking-wider block">
                      Recommended Test Commands:
                    </span>
                    <div className="space-y-1.5">
                      {roadmap.stages.testingStrategy.testCommands.map((cmd, idx) => (
                        <div
                          key={idx}
                          className="rounded-[8px] bg-surface-2 border border-hairline p-2.5 font-mono text-[12px] text-[#0070E0] flex items-center justify-between"
                        >
                          <code>{cmd}</code>
                          <button
                            type="button"
                            onClick={() => handleCopy(cmd, `test-cmd-${idx}`)}
                            className="p-1 text-ink-subtle hover:text-ink cursor-pointer"
                            title="Copy command"
                          >
                            {copiedKey === `test-cmd-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-surface-2 border border-hairline p-3.5 space-y-1.5">
                  <span className="text-[11px] font-medium text-ink-strong uppercase tracking-wider block">
                    Manual Verification Steps:
                  </span>
                  <ul className="space-y-1 text-[12px] text-ink-subtle list-disc list-inside">
                    {roadmap.stages.testingStrategy.manualSteps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-[12px] text-ink-subtle italic">
                  <strong className="text-ink font-medium">How to avoid regressions:</strong> {roadmap.stages.testingStrategy.howToAvoidRegression}
                </p>
              </div>
            </div>

            {/* Stage 6: Git & Pull Request Workflow */}
            <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-[4px] bg-surface-2 border border-hairline text-[#0070E0] flex items-center justify-center text-[11px] font-mono font-medium">
                    6
                  </span>
                  <h3 className="text-[14px] font-medium text-ink-strong">
                    {roadmap.stages.gitAndPrWorkflow.title}
                  </h3>
                </div>
                <span className="badge-71 text-[10px]">
                  Branch, Commit & PR
                </span>
              </div>

              {/* Exact Git Commands */}
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-ink-strong uppercase tracking-wider block">
                  Terminal Commands for this PR:
                </span>
                {roadmap.stages.gitAndPrWorkflow.commands.map((cmdItem, idx) => (
                  <div
                    key={idx}
                    className="rounded-[8px] bg-surface-2 border border-hairline p-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-[12px] font-mono text-[#0070E0] font-medium">{cmdItem.cmd}</code>
                      <button
                        type="button"
                        onClick={() => handleCopy(cmdItem.cmd, `workflow-cmd-${idx}`)}
                        className="px-2 py-0.5 rounded-[4px] bg-surface text-[11px] font-mono text-ink-subtle hover:text-ink border border-hairline cursor-pointer"
                      >
                        {copiedKey === `workflow-cmd-${idx}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[11px] text-ink-subtle">
                      💡 {cmdItem.purpose}
                    </p>
                  </div>
                ))}
              </div>

              {/* Suggested PR Template */}
              <div className="rounded-lg bg-surface-2 border border-hairline p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-ink-strong uppercase tracking-wider">
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
                    className="btn-secondary h-7 px-2.5 rounded-[8px] text-[12px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'roadmap-pr' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy PR Markdown</span>
                  </button>
                </div>

                <div className="font-mono text-[12px] text-ink bg-surface p-2.5 rounded-[6px] border border-hairline">
                  <span className="text-ink-subtle">Title: </span>
                  {roadmap.stages.gitAndPrWorkflow.suggestedPrTitle}
                </div>

                <pre className="text-[12px] font-mono text-ink bg-surface p-3 rounded-[6px] border border-hairline overflow-x-auto whitespace-pre-wrap leading-relaxed">
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
