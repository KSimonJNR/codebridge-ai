import React, { useState } from 'react';
import {
  Code2,
  Sparkles,
  AlertTriangle,
  Check,
  Copy,
  Bug,
  Lightbulb,
  FileCode,
  Terminal,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { ProgrammingLanguage, CodeExplanationResult } from '../types.ts';

interface CodeExplainerViewProps {
  initialCode?: string;
  initialLanguage?: ProgrammingLanguage;
  onOpenKeyInfo: () => void;
}

const SAMPLE_SNIPPETS: { label: string; language: ProgrammingLanguage; code: string; context: string }[] = [
  {
    label: 'JS: Cached GitHub API Fetcher',
    language: 'JavaScript',
    context: 'From an open-source stats dashboard backend',
    code: `// Fetch repository contributors with Redis caching
async function getContributors(owner, repo) {
  const cacheKey = \`repo:\${owner}/\${repo}:contributors\`;
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const response = await fetch(\`https://api.github.com/repos/\${owner}/\${repo}/contributors\`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Hacktoberfest-Contributor-Bot'
    }
  });

  if (!response.ok) {
    throw new Error(\`GitHub API failed with status \${response.status}\`);
  }

  const data = await response.json();
  // Cache for 1 hour
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));
  return data;
}`
  },
  {
    label: 'Python: Safe File Downloader & Hash Check',
    language: 'Python',
    context: 'CLI utility for downloading dataset release assets',
    code: `import hashlib
import requests
import os

def download_and_verify(url: str, dest_path: str, expected_sha256: str) -> bool:
    """Download an asset and ensure SHA256 matches before saving."""
    sha256 = hashlib.sha256()
    temp_path = dest_path + ".tmp"
    
    with requests.get(url, stream=True, timeout=15) as r:
        r.raise_for_status()
        with open(temp_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    sha256.update(chunk)
                    f.write(chunk)
                    
    calculated_hash = sha256.hexdigest()
    if calculated_hash != expected_sha256:
        os.remove(temp_path)
        raise ValueError(f"Checksum mismatch! Got {calculated_hash}")
        
    os.replace(temp_path, dest_path)
    return True`
  },
  {
    label: 'Java: Binary Search with Edge Cases',
    language: 'Java',
    context: 'Algorithmic helper in a data structures learning repo',
    code: `public class SearchUtils {
    /**
     * Finds target in sorted array using binary search.
     * Returns index of target or -1 if not found.
     */
    public static int binarySearch(int[] arr, int target) {
        if (arr == null || arr.length == 0) {
            return -1;
        }
        int low = 0;
        int high = arr.length - 1;

        while (low <= high) {
            // Avoid integer overflow bug in (low + high) / 2
            int mid = low + (high - low) / 2;

            if (arr[mid] == target) {
                return mid;
            } else if (arr[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return -1;
    }
}`
  },
  {
    label: 'TypeScript: Debounced Search Hook',
    language: 'TypeScript',
    context: 'Frontend UI library component',
    code: `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}`
  }
];

export const CodeExplainerView: React.FC<CodeExplainerViewProps> = ({
  initialCode = '',
  initialLanguage = 'JavaScript',
  onOpenKeyInfo,
}) => {
  const [code, setCode] = useState(initialCode || SAMPLE_SNIPPETS[0].code);
  const [language, setLanguage] = useState<ProgrammingLanguage>(initialLanguage);
  const [context, setContext] = useState(SAMPLE_SNIPPETS[0].context);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CodeExplanationResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSelectSample = (sample: typeof SAMPLE_SNIPPETS[0]) => {
    setCode(sample.code);
    setLanguage(sample.language);
    setContext(sample.context);
    setError(null);
  };

  const handleExplain = async () => {
    if (!code.trim()) {
      setError('Please paste or write some code first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/explain-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          context: context.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.keyMissing) {
          onOpenKeyInfo();
        }
        throw new Error(data.error || 'Failed to explain code.');
      }

      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while explaining the code.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-ink-subtle text-[12px] font-medium uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#0070E0]" />
            Gemini 3.8 Flash Powered
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-ink-strong tracking-tight">
            AI Code Explainer <span className="text-ink-subtle">· Deep Breakdown</span>
          </h2>
          <p className="text-[13px] text-ink-subtle mt-1 max-w-2xl leading-relaxed">
            Paste confusing code from open-source repos and receive a gentle, line-by-line breakdown with potential pitfalls.
          </p>
        </div>

        {/* Preset sample buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-ink-subtle font-medium">Quick Presets:</span>
          {SAMPLE_SNIPPETS.map((sample, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className="btn-secondary h-7 px-2.5 rounded-[8px] text-[12px] cursor-pointer"
            >
              {sample.language}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Box */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3.5">
            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <label htmlFor="lang-select" className="text-[12px] font-medium text-ink-strong">
                  Language:
                </label>
                <select
                  id="lang-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as ProgrammingLanguage)}
                  className="bg-surface-2 border border-hairline text-ink text-[12px] font-medium rounded-[8px] px-2.5 py-1 focus:outline-none focus:border-[#0070E0]"
                >
                  <option value="Python">Python</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Java">Java</option>
                  <option value="Go">Go</option>
                  <option value="Rust">Rust</option>
                  <option value="C++">C++</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCode('')}
                  className="btn-secondary h-7 px-2 rounded-[6px] text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              </div>
            </div>

            {/* Code Input */}
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste code here... (e.g. from GitHub PR, issue comment, or repo file)"
                rows={16}
                spellCheck={false}
                className="w-full bg-surface-2 border border-hairline rounded-lg p-3.5 text-xs font-mono text-ink placeholder:text-ink-subtle focus:outline-none focus:border-[#0070E0] resize-y leading-relaxed"
              />
              <div className="absolute bottom-3 right-3 text-[11px] text-ink-subtle bg-surface px-2 py-0.5 rounded-[4px] border border-hairline font-mono tabular-nums">
                {code.split('\n').length} lines
              </div>
            </div>

            {/* Optional Context */}
            <div>
              <label htmlFor="repo-context" className="block text-[11px] font-medium text-ink-subtle mb-1">
                Repository or File Context (optional):
              </label>
              <input
                id="repo-context"
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. In an open-source React dashboard inside utils/auth.ts"
                className="input-71 text-[12px]"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-hairline">
              <span className="text-[12px] text-ink-subtle hidden sm:inline">
                Analyzed on server via <code className="text-[#0070E0] font-mono text-[11px]">@google/genai</code>
              </span>

              <button
                type="button"
                onClick={handleExplain}
                disabled={loading}
                className="btn-primary h-9 px-5 rounded-[10px] text-[13px] font-medium w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Code...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explain My Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Friendly Error Box */}
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

        {/* Right Column: Structured Output Display */}
        <div className="lg:col-span-6 space-y-4">
          {!result && !loading && (
            <div className="rounded-xl bg-surface border border-dashed border-hairline p-10 text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-12 h-12 rounded-[10px] bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle mb-3">
                <Code2 className="w-6 h-6 text-[#0070E0]" />
              </div>
              <h3 className="text-[15px] font-medium text-ink-strong mb-1">Ready to Explain</h3>
              <p className="text-[12px] text-ink-subtle max-w-sm leading-relaxed mb-4">
                Paste your code snippet on the left and click <strong>"Explain My Code"</strong>. We will unpack the logic, key lines, and potential gotchas.
              </p>
              <button
                type="button"
                onClick={handleExplain}
                className="btn-secondary h-8 px-3 rounded-[10px] text-[12px] cursor-pointer"
              >
                Explain Current Sample Code &rarr;
              </button>
            </div>
          )}

          {loading && (
            <div className="rounded-xl bg-surface border border-hairline p-10 text-center flex flex-col items-center justify-center min-h-[460px] space-y-3">
              <div className="w-10 h-10 border-2 border-[#0070E0] border-t-transparent rounded-full animate-spin" />
              <h3 className="text-[14px] font-medium text-ink-strong">Gemini is Mentoring You...</h3>
              <p className="text-[12px] text-ink-subtle max-w-xs leading-relaxed">
                Examining logic, edge cases, open-source best practices, and drafting a plain-English explanation.
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3.5">
              {/* 1. Summary Card */}
              <div className="rounded-xl bg-surface border border-hairline p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0070E0]" />
                    <h3 className="text-[12px] font-medium text-ink-strong tracking-wide uppercase">
                      Plain English Explanation
                    </h3>
                  </div>
                  <span className="badge-71 text-[10px]">
                    High-Level Concept
                  </span>
                </div>
                <p className="text-[13px] text-ink leading-relaxed">
                  {result.summary}
                </p>
              </div>

              {/* 2. Important Lines & What They Do */}
              <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0070E0]" />
                  <h3 className="text-[12px] font-medium text-ink-strong tracking-wide uppercase">
                    Important Lines & Mechanics
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {result.importantLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-surface-2 border border-hairline p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-medium text-[#0070E0] uppercase tracking-wider">
                          Key Block #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(line.codeSnippet, `line-${idx}`)}
                          className="text-[11px] text-ink-subtle hover:text-ink flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === `line-${idx}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-[12px] font-mono text-[#0070E0] overflow-x-auto py-1 px-2 rounded-[6px] bg-surface border border-hairline font-medium">
                        <code>{line.codeSnippet}</code>
                      </pre>
                      <p className="text-[12px] text-ink-subtle leading-relaxed pt-0.5">
                        {line.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Potential Bugs & Edge Cases */}
              <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h3 className="text-[12px] font-medium text-ink-strong tracking-wide uppercase">
                    Potential Bugs & Edge Cases
                  </h3>
                </div>
                <div className="space-y-2">
                  {result.potentialBugs.map((bug, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2.5"
                    >
                      <Bug className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-medium text-amber-700 dark:text-amber-300">{bug.title}</span>
                          <span className="badge-71 text-[9px] uppercase">
                            {bug.severity || 'Notice'}
                          </span>
                        </div>
                        <p className="text-[12px] text-amber-700 dark:text-amber-200 leading-relaxed">{bug.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Working Example / Demonstration */}
              <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0070E0]" />
                    <h3 className="text-[12px] font-medium text-ink-strong tracking-wide uppercase">
                      Working Usage Example
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.example, 'example')}
                    className="btn-secondary h-7 px-2.5 rounded-[8px] text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'example' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-surface-2 border border-hairline text-[12px] font-mono text-ink overflow-x-auto leading-relaxed">
                  <code>{result.example}</code>
                </pre>
              </div>

              {/* Mentor Open Source Tips */}
              {result.mentorTips && result.mentorTips.length > 0 && (
                <div className="rounded-xl bg-surface border border-hairline p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-ink-strong uppercase tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5 text-[#0070E0]" />
                    Maintainer's Perspective
                  </div>
                  <ul className="space-y-1 list-disc list-inside text-[12px] text-ink-subtle">
                    {result.mentorTips.map((tip, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
