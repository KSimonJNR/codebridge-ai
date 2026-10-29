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
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-ink-subtle text-[12px] font-medium uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#0070E0]" />
            Issue Deconstruction & Mentorship
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-ink-strong tracking-tight">
            GitHub Issue Helper <span className="text-ink-subtle">· Contributor Blueprint</span>
          </h2>
          <p className="text-[13px] text-ink-subtle mt-1 max-w-2xl leading-relaxed">
            Paste any GitHub issue title and description to receive an understandable summary, required skills, investigation checklist, and a ready-to-use PR template.
          </p>
        </div>

        {/* Demo Issue Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-ink-subtle font-medium">Sample Issues:</span>
          {DEMO_ISSUES.map((demo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadDemo(demo)}
              className="btn-secondary h-7 px-2.5 rounded-[8px] text-[12px] cursor-pointer"
            >
              Issue #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3.5">
            {/* Issue Title Input */}
            <div>
              <label htmlFor="issue-title" className="block text-[12px] font-medium text-ink-strong mb-1.5">
                GitHub Issue Title:
              </label>
              <input
                id="issue-title"
                type="text"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="e.g. Bug: Search modal does not close when pressing ESC"
                className="input-71 text-[13px]"
              />
            </div>

            {/* Optional GitHub Issue URL Field */}
            <div>
              <label htmlFor="issue-url" className="flex items-center justify-between text-[12px] font-medium text-ink-strong mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-[#0070E0]" />
                  GitHub Issue URL (optional):
                </span>
                <span className="text-[11px] font-normal text-ink-subtle">Links to GitHub</span>
              </label>
              <div className="relative">
                <input
                  id="issue-url"
                  type="url"
                  value={issueUrl}
                  onChange={(e) => setIssueUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/issues/123"
                  className="input-71 font-mono text-[12px] pr-8"
                />
                {issueUrl && issueUrl.startsWith('http') && (
                  <a
                    href={issueUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#0070E0] hover:underline p-1"
                    title="Open issue on GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Optional Repo Context */}
            <div>
              <label htmlFor="repo-stack" className="block text-[12px] font-medium text-ink-strong mb-1.5">
                Repository Tech Stack / Context (optional):
              </label>
              <input
                id="repo-stack"
                type="text"
                value={repoContext}
                onChange={(e) => setRepoContext(e.target.value)}
                placeholder="e.g. Next.js 14, Tailwind CSS, TypeScript"
                className="input-71 text-[12px]"
              />
            </div>

            {/* Issue Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="issue-desc" className="text-[12px] font-medium text-ink-strong">
                  Issue Description (Markdown / Text):
                </label>
                <span className="text-[11px] text-ink-subtle font-mono tabular-nums">
                  {issueBody.length} characters
                </span>
              </div>
              <textarea
                id="issue-desc"
                value={issueBody}
                onChange={(e) => setIssueBody(e.target.value)}
                placeholder="Paste the GitHub issue markdown or text here..."
                rows={12}
                className="w-full bg-surface-2 border border-hairline rounded-lg p-3 text-xs font-mono text-ink placeholder:text-ink-subtle focus:outline-none focus:border-[#0070E0] resize-y leading-relaxed"
              />
            </div>

            {/* Action Button: "Analyze Issue" */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-hairline">
              <span className="text-[11px] text-ink-subtle hidden sm:inline">
                Analyzed via server-side Gemini
              </span>

              <button
                type="button"
                onClick={handleAnalyzeIssue}
                disabled={loading}
                className="btn-primary h-9 px-5 rounded-[10px] text-[13px] font-medium w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Issue...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze Issue</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-600 dark:text-red-400 text-[13px] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-medium text-red-700 dark:text-red-300">Analysis Failed</p>
                <p className="text-ink-subtle">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results Display */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !loading && (
            <div className="rounded-xl bg-surface border border-dashed border-hairline p-10 text-center flex flex-col items-center justify-center min-h-[480px]">
              <div className="w-12 h-12 rounded-[10px] bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle mb-3">
                <FileCode2 className="w-6 h-6 text-[#0070E0]" />
              </div>
              <h3 className="text-[15px] font-medium text-ink-strong mb-1">No Issue Analyzed Yet</h3>
              <p className="text-[12px] text-ink-subtle max-w-sm leading-relaxed mb-4">
                Paste any GitHub issue title and description on the left, then click <strong>"Analyze Issue"</strong> to receive an actionable contributor blueprint.
              </p>
              <button
                type="button"
                onClick={handleAnalyzeIssue}
                className="btn-secondary h-8 px-3 rounded-[10px] text-[12px] cursor-pointer"
              >
                Analyze Current Sample Issue &rarr;
              </button>
            </div>
          )}

          {loading && (
            <div className="rounded-xl bg-surface border border-hairline p-10 text-center flex flex-col items-center justify-center min-h-[480px] space-y-3">
              <div className="w-10 h-10 border-2 border-[#0070E0] border-t-transparent rounded-full animate-spin" />
              <h3 className="text-[14px] font-medium text-ink-strong">Deconstructing GitHub Issue...</h3>
              <p className="text-[12px] text-ink-subtle max-w-xs leading-relaxed">
                Analyzing the problem, identifying required skills, formulating pre-investigation questions, and building your step-by-step checklist.
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3.5">
              {/* Mandatory AI Verification Disclaimer Callout */}
              <div className="rounded-lg bg-surface-2 border border-hairline p-3 flex items-start gap-2.5 text-[12px] text-ink-subtle">
                <Info className="w-3.5 h-3.5 text-[#0070E0] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-ink font-medium">Notice:</strong> Suggested solutions are AI-generated based on the issue description provided and have not been verified against the actual repository code unless its contents have been directly retrieved. Always verify against the target codebase before submitting a PR.
                </p>
              </div>

              {/* 1. Problem in Plain English & Overview Card */}
              <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0070E0]" />
                    <h3 className="text-[12px] font-medium text-ink-strong tracking-wide uppercase">
                      Problem in Plain English
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="badge-71 text-[10px]">
                      {result.difficultyLevel}
                    </span>

                    {onSaveItem && (
                      <button
                        type="button"
                        onClick={handleSaveToDashboard}
                        className="btn-secondary h-7 px-2.5 rounded-[8px] text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        {saved ? (
                          <>
                            <BookmarkCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400">Saved</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3 h-3 text-[#0070E0]" />
                            <span>Save to Dashboard</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[13px] text-ink leading-relaxed">
                  {result.plainEnglishProblem}
                </p>

                <p className="text-[12px] text-ink-subtle italic">
                  <strong className="text-ink font-medium">Difficulty rationale:</strong> {result.difficultyReason}
                </p>

                {/* Likely Language, Skills & Concepts */}
                <div className="pt-2.5 border-t border-hairline space-y-2.5">
                  {result.likelyLanguage && (
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="font-medium text-ink-subtle flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5 text-[#0070E0]" />
                        Likely Language / Stack:
                      </span>
                      <span className="font-mono text-[#0070E0] bg-surface-2 px-2 py-0.5 rounded-[4px] border border-hairline font-medium text-[11px]">
                        {result.likelyLanguage}
                      </span>
                    </div>
                  )}

                  {result.relevantSkills && result.relevantSkills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
                      <span className="text-ink-subtle font-medium mr-1">Relevant Skills:</span>
                      {result.relevantSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="badge-71 text-[10px]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {result.importantConcepts && result.importantConcepts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
                      <span className="text-ink-subtle font-medium mr-1">Important Concepts:</span>
                      {result.importantConcepts.map((concept, i) => (
                        <span
                          key={i}
                          className="badge-71 text-[10px]"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Questions to Investigate Before Changing Code */}
              {result.preInvestigationQuestions && result.preInvestigationQuestions.length > 0 && (
                <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-500" />
                    <h3 className="text-[12px] font-medium text-ink-strong tracking-wide uppercase">
                      Questions to Investigate Before Changing Code
                    </h3>
                  </div>
                  <p className="text-[12px] text-ink-subtle">
                    Maintainers recommend checking these details in the codebase first so you don't break existing logic:
                  </p>
                  <ul className="space-y-1.5">
                    {result.preInvestigationQuestions.map((q, idx) => (
                      <li
                        key={idx}
                        className="rounded-lg bg-surface-2 border border-hairline p-2.5 flex items-start gap-2 text-[12px] text-ink"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. Interactive Checklist for Users to Tick Off */}
              {result.checklist && result.checklist.length > 0 && (
                <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-[12px] font-medium text-ink-strong tracking-wide uppercase">
                        Interactive Contributor Checklist
                      </h3>
                    </div>
                    <span className="text-[12px] font-mono font-medium text-[#0070E0] tabular-nums">
                      {completedChecklistItems}/{totalChecklistItems} ({checklistProgressPct}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden border border-hairline">
                    <div
                      className="h-full bg-[#0070E0] transition-all duration-300"
                      style={{ width: `${checklistProgressPct}%` }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    {result.checklist.map((task, idx) => {
                      const isDone = Boolean(checkedTasks[idx]);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleTask(idx)}
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
                          <span className={`truncate leading-relaxed ${isDone ? 'line-through text-ink-subtle' : ''}`}>
                            {task}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Step-by-Step Investigation & Resolution Plan */}
              <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-[#0070E0]" />
                  <h3 className="text-[12px] font-medium text-ink-strong tracking-wide uppercase">
                    Step-by-Step Investigation & Resolution Plan
                  </h3>
                </div>

                <div className="space-y-2">
                  {result.stepByStepPlan.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="rounded-lg bg-surface-2 border border-hairline p-3 flex items-start gap-2.5"
                    >
                      <div className="w-5 h-5 rounded-[4px] bg-surface border border-hairline text-[#0070E0] flex items-center justify-center text-[11px] font-mono font-medium shrink-0 mt-0.5">
                        {step.stepNumber}
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <h4 className="text-[13px] font-medium text-ink-strong">{step.title}</h4>
                        <p className="text-[12px] text-ink-subtle leading-relaxed">{step.action}</p>
                        {step.tips && (
                          <div className="text-[11px] text-[#0070E0] bg-surface px-2 py-0.5 rounded-[4px] border border-hairline mt-1 flex items-center gap-1.5">
                            <Lightbulb className="w-3 h-3 text-[#0070E0] shrink-0" />
                            <span>Tip: {step.tips}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. How to Test & Verify */}
              <div className="rounded-xl bg-surface border border-hairline p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-[12px] font-medium text-ink-strong tracking-wide uppercase">
                    How to Test & Verify Before Submitting
                  </h3>
                </div>
                <p className="text-[13px] text-ink leading-relaxed">
                  {result.howToVerify}
                </p>
              </div>

              {/* 6. Ready-to-Use PR Template */}
              <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-medium text-ink-strong tracking-wide uppercase">
                    Recommended PR Title & Description
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${result.samplePrTitle}\n\n${result.samplePrBody}`, 'pr-template')}
                    className="btn-secondary h-7 px-2.5 rounded-[8px] text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'pr-template' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Copied Template</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy PR Markdown</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-surface-2 border border-hairline rounded-[6px] p-2.5 text-[12px] font-mono text-ink">
                  <span className="text-ink-subtle select-none">Title: </span>{result.samplePrTitle}
                </div>

                <pre className="p-3 rounded-[6px] bg-surface-2 border border-hairline text-[12px] font-mono text-ink overflow-x-auto whitespace-pre-wrap leading-relaxed">
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
