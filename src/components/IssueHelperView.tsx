import React, { useState } from 'react';
import {
  FileCode2,
  Sparkles,
  AlertTriangle,
  Check,
  Copy,
  ListOrdered,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  BookmarkPlus,
  BookmarkCheck,
  Link,
  Code2,
  HelpCircle,
  CheckSquare,
  Square,
  Search,
  AlertCircle,
  Lightbulb,
  Info
} from 'lucide-react';
import { IssueAnalysisResult } from '../types.ts';

interface IssueHelperViewProps {
  initialTitle?: string;
  initialBody?: string;
  initialUrl?: string;
  onOpenKeyInfo: () => void;
  onSaveItem?: (title: string, summary: string, details: any) => void;
}

const DEMO_ISSUES = [
  {
    title: 'Bug: Search modal does not close when pressing ESC key',
    url: 'https://github.com/facebook/react/issues/28904',
    repoContext: 'Frontend React UI component library (TypeScript / CSS)',
    body: `### Describe the Bug
When opening the global search modal using keyboard shortcut CMD+K or the search icon, pressing the Escape (ESC) key does not close it. Users must manually click outside the backdrop or click the small close button.

### Steps to Reproduce
1. Press CMD+K to trigger search modal.
2. Press the Escape key.
3. Modal remains open and retains focus.

### Expected Behavior
Pressing Escape should immediately dispatch the onClose callback or trigger closeModal() and restore focus to the previous active element.

### Context / Relevant Files
- \`src/components/SearchModal.tsx\`
- Keyboard event listener seems to be attached only on initial render or is missing the 'Escape' key handler.
- Good first issue label applied!`
  },
  {
    title: 'Feat: Add exponential backoff retry to webhook delivery worker',
    url: 'https://github.com/expressjs/express/issues/5421',
    repoContext: 'Node.js backend service using Redis queue & TypeScript',
    body: `### Feature Request
Currently, when a 3rd-party webhook endpoint returns HTTP 500 or times out, our worker drops the event or fails immediately without retrying.

### Proposed Solution
1. Add an exponential backoff retry mechanism (1s, 5s, 30s) up to 3 retries max.
2. Check for HTTP status codes >= 500 before triggering a retry (do not retry on 4xx client errors like 400 or 401).
3. Log each retry attempt with correlation ID.

### Good First Issue Context
Great for beginners wanting to understand async/await in Node and HTTP status code semantics.`
  },
  {
    title: 'Docs: Broken links in Hacktoberfest contributing guide and missing Docker step',
    url: 'https://github.com/freeCodeCamp/freeCodeCamp/issues/52109',
    repoContext: 'Open-source fullstack developer tooling repo (Markdown / Docker)',
    body: `### Problem
Several contributors reported in Discord that the links in \`CONTRIBUTING.md\` pointing to the local database setup guide are 404ing after the recent directory refactor. Also, the Docker Compose command needs to specify \`docker compose up -d postgres\` instead of the legacy \`docker-compose\`.

### Tasks
- Fix broken markdown hyperlinks in \`CONTRIBUTING.md\`
- Update Docker commands to modern compose V2 syntax
- Verify all links with markdown-link-check`
  }
];

export const IssueHelperView: React.FC<IssueHelperViewProps> = ({
  initialTitle = '',
  initialBody = '',
  initialUrl = '',
  onOpenKeyInfo,
  onSaveItem,
}) => {
  const [issueTitle, setIssueTitle] = useState(initialTitle || DEMO_ISSUES[0].title);
  const [issueBody, setIssueBody] = useState(initialBody || DEMO_ISSUES[0].body);
  const [issueUrl, setIssueUrl] = useState(initialUrl || DEMO_ISSUES[0].url);
  const [repoContext, setRepoContext] = useState(DEMO_ISSUES[0].repoContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IssueAnalysisResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // User interactive checklist tracking
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLoadDemo = (demo: typeof DEMO_ISSUES[0]) => {
    setIssueTitle(demo.title);
    setIssueBody(demo.body);
    setIssueUrl(demo.url);
    setRepoContext(demo.repoContext);
    setError(null);
    setSaved(false);
    setCheckedTasks({});
  };

  const toggleTask = (index: number) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleAnalyzeIssue = async () => {
    if (!issueBody.trim()) {
      setError('Please paste the GitHub issue description to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setSaved(false);
    setCheckedTasks({});

    try {
      const response = await fetch('/api/solve-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueTitle: issueTitle.trim() || undefined,
          issueBody: issueBody.trim(),
          issueUrl: issueUrl.trim() || undefined,
          repoContext: repoContext.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.keyMissing) {
          onOpenKeyInfo();
        }
        throw new Error(data.error || 'Failed to analyze GitHub issue.');
      }

      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error analyzing issue.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDashboard = () => {
    if (result && onSaveItem) {
      onSaveItem(
        issueTitle || 'GitHub Issue Blueprint',
        result.plainEnglishProblem,
        result
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const totalChecklistItems = result?.checklist?.length || 0;
  const completedChecklistItems = Object.values(checkedTasks).filter(Boolean).length;
  const checklistProgressPct = totalChecklistItems > 0
    ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Issue Deconstruction & Mentorship
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">GitHub Issue Helper</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Paste any GitHub issue title and description to receive an understandable summary, required skills, investigation checklist, and a ready-to-use PR template.
          </p>
        </div>

        {/* Demo Issue Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Sample Issues:</span>
          {DEMO_ISSUES.map((demo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadDemo(demo)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 hover:border-purple-500/40 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Issue #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-xl space-y-4">
            {/* Issue Title Input */}
            <div>
              <label htmlFor="issue-title" className="block text-xs font-semibold text-slate-300 mb-1.5">
                GitHub Issue Title:
              </label>
              <input
                id="issue-title"
                type="text"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="e.g. Bug: Search modal does not close when pressing ESC"
                className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-medium"
              />
            </div>

            {/* Optional GitHub Issue URL Field */}
            <div>
              <label htmlFor="issue-url" className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-cyan-400" />
                  GitHub Issue URL (optional):
                </span>
                <span className="text-[11px] font-normal text-slate-500">Links to GitHub</span>
              </label>
              <div className="relative">
                <input
                  id="issue-url"
                  type="url"
                  value={issueUrl}
                  onChange={(e) => setIssueUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/issues/123"
                  className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
                {issueUrl && issueUrl.startsWith('http') && (
                  <a
                    href={issueUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 p-1"
                    title="Open issue on GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Optional Repo Context */}
            <div>
              <label htmlFor="repo-stack" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Repository Tech Stack / Context (optional):
              </label>
              <input
                id="repo-stack"
                type="text"
                value={repoContext}
                onChange={(e) => setRepoContext(e.target.value)}
                placeholder="e.g. Next.js 14, Tailwind CSS, TypeScript"
                className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Issue Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="issue-desc" className="text-xs font-semibold text-slate-300">
                  Issue Description (Markdown / Text):
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {issueBody.length} characters
                </span>
              </div>
              <textarea
                id="issue-desc"
                value={issueBody}
                onChange={(e) => setIssueBody(e.target.value)}
                placeholder="Paste the GitHub issue markdown or text here..."
                rows={12}
                className="w-full bg-[#080d1a] border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-y leading-relaxed"
              />
            </div>

            {/* Action Button: "Analyze Issue" */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Analyzed via server-side Gemini
              </span>

              <button
                type="button"
                onClick={handleAnalyzeIssue}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 hover:shadow-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Issue...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>Analyze Issue</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl bg-red-950/40 border border-red-500/40 p-4 text-red-200 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-300">Analysis Failed</p>
                <p className="text-slate-300">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results Display */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !loading && (
            <div className="rounded-2xl bg-slate-900/60 border border-dashed border-white/15 p-10 text-center flex flex-col items-center justify-center min-h-[480px]">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <FileCode2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Issue Analyzed Yet</h3>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
                Paste any GitHub issue title and description on the left, then click <strong>"Analyze Issue"</strong> to receive an actionable contributor blueprint.
              </p>
              <button
                type="button"
                onClick={handleAnalyzeIssue}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                Analyze Current Sample Issue &rarr;
              </button>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-10 text-center flex flex-col items-center justify-center min-h-[480px] space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-500 animate-spin flex items-center justify-center p-[2px]">
                <div className="w-full h-full bg-[#070a13] rounded-[14px]" />
              </div>
              <h3 className="text-base font-bold text-white">Deconstructing GitHub Issue...</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Analyzing the problem, identifying required skills, formulating pre-investigation questions, and building your step-by-step checklist.
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4 animate-fadeIn">
              {/* Mandatory AI Verification Disclaimer Callout (Requirement 10) */}
              <div className="rounded-xl bg-indigo-950/40 border border-indigo-500/30 p-3.5 flex items-start gap-3 text-xs text-indigo-200">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Notice:</strong> Suggested solutions are AI-generated based on the issue description provided and have not been verified against the actual repository code unless its contents have been directly retrieved. Always verify against the target codebase before submitting a PR.
                </p>
              </div>

              {/* 1. Problem in Plain English & Overview Card */}
              <div className="rounded-2xl bg-slate-900/90 border border-purple-500/30 p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                      Problem in Plain English
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        result.difficultyLevel.toLowerCase().includes('beginner')
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : result.difficultyLevel.toLowerCase().includes('intermediate')
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {result.difficultyLevel}
                    </span>

                    {onSaveItem && (
                      <button
                        type="button"
                        onClick={handleSaveToDashboard}
                        className="flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors cursor-pointer"
                      >
                        {saved ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Saved</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Save to Dashboard</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {result.plainEnglishProblem}
                </p>

                <p className="text-xs text-slate-400 italic">
                  <strong>Difficulty rationale:</strong> {result.difficultyReason}
                </p>

                {/* Likely Language, Skills & Concepts (Requirement 6) */}
                <div className="pt-3 border-t border-white/5 space-y-3">
                  {result.likelyLanguage && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-400 flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                        Likely Language / Stack:
                      </span>
                      <span className="font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                        {result.likelyLanguage}
                      </span>
                    </div>
                  )}

                  {result.relevantSkills && result.relevantSkills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-400 font-semibold mr-1">Relevant Skills:</span>
                      {result.relevantSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {result.importantConcepts && result.importantConcepts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-400 font-semibold mr-1">Important Concepts:</span>
                      {result.importantConcepts.map((concept, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[11px] font-medium"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Questions to Investigate Before Changing Code (Requirement 9) */}
              {result.preInvestigationQuestions && result.preInvestigationQuestions.length > 0 && (
                <div className="rounded-2xl bg-slate-900/90 border border-amber-500/30 p-5 shadow-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                      Questions to Investigate Before Changing Code
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Maintainers recommend checking these details in the codebase first so you don't break existing logic:
                  </p>
                  <ul className="space-y-2">
                    {result.preInvestigationQuestions.map((q, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl bg-[#080d1a] border border-amber-500/15 p-3 flex items-start gap-2.5 text-xs text-amber-100"
                      >
                        <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. Interactive Checklist for Users to Tick Off (Requirement 8) */}
              {result.checklist && result.checklist.length > 0 && (
                <div className="rounded-2xl bg-slate-900/90 border border-emerald-500/30 p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                        Interactive Contributor Checklist
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">
                      {completedChecklistItems}/{totalChecklistItems} ({checklistProgressPct}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${checklistProgressPct}%` }}
                    />
                  </div>

                  <div className="space-y-2">
                    {result.checklist.map((task, idx) => {
                      const isDone = Boolean(checkedTasks[idx]);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleTask(idx)}
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
                          <span className={`text-xs leading-relaxed ${isDone ? 'line-through text-slate-400' : ''}`}>
                            {task}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Step-by-Step Investigation & Resolution Plan (Requirement 7) */}
              <div className="rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-5 shadow-lg space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <ListOrdered className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                    Step-by-Step Investigation & Resolution Plan
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {result.stepByStepPlan.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="rounded-xl bg-[#080d1a] border border-white/5 p-3.5 flex items-start gap-3 hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {step.stepNumber}
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white">{step.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{step.action}</p>
                        {step.tips && (
                          <div className="text-[11px] text-cyan-300/80 bg-cyan-950/30 px-2.5 py-1 rounded border border-cyan-500/15 mt-1.5 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>Tip: {step.tips}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. How to Test & Verify */}
              <div className="rounded-2xl bg-slate-900/90 border border-emerald-500/30 p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                    How to Test & Verify Before Submitting
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {result.howToVerify}
                </p>
              </div>

              {/* 6. Ready-to-Use PR Template */}
              <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                    Recommended PR Title & Description
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${result.samplePrTitle}\n\n${result.samplePrBody}`, 'pr-template')}
                    className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10 cursor-pointer"
                  >
                    {copiedKey === 'pr-template' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied Template</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy PR Markdown</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-[#080d1a] border border-white/5 rounded-xl p-3 text-xs font-mono text-cyan-300">
                  <span className="text-slate-500 select-none">Title: </span>{result.samplePrTitle}
                </div>

                <pre className="p-3.5 rounded-xl bg-[#080d1a] border border-white/5 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  <code>{result.samplePrBody}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
