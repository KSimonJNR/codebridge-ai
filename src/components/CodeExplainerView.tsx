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
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Gemini 3.8 Flash Powered
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">AI Code Explainer</h2>
          <p className="text-sm text-slate-400 mt-1">
            Paste confusing code from open-source repos and receive a gentle, line-by-line breakdown with potential pitfalls.
          </p>
        </div>

        {/* Preset sample buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
          {SAMPLE_SNIPPETS.map((sample, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              {sample.language}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Box */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-4 sm:p-5 shadow-xl">
            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <label htmlFor="lang-select" className="text-xs font-semibold text-slate-300">
                  Language:
                </label>
                <select
                  id="lang-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as ProgrammingLanguage)}
                  className="bg-slate-950 border border-white/10 text-cyan-300 text-xs font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400"
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
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1"
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
                className="w-full bg-[#080d1a] border border-white/10 rounded-xl p-4 text-xs sm:text-sm font-mono text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 resize-y leading-relaxed"
              />
              <div className="absolute bottom-3 right-3 text-[11px] text-slate-500 bg-slate-900/90 px-2 py-0.5 rounded border border-white/5">
                {code.split('\n').length} lines
              </div>
            </div>

            {/* Optional Context */}
            <div className="mt-3">
              <label htmlFor="repo-context" className="block text-[11px] font-semibold text-slate-400 mb-1">
                Repository or File Context (optional):
              </label>
              <input
                id="repo-context"
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. In an open-source React dashboard inside utils/auth.ts"
                className="w-full bg-[#080d1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Action Bar */}
            <div className="mt-5 flex items-center justify-between gap-4 pt-3 border-t border-white/10">
              <span className="text-xs text-slate-400 hidden sm:inline">
                Analyzed on server via <code className="text-purple-300 font-mono text-[11px]">@google/genai</code>
              </span>

              <button
                type="button"
                onClick={handleExplain}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Code...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Explain My Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Friendly Error Box */}
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

        {/* Right Column: Structured Output Display */}
        <div className="lg:col-span-6 space-y-5">
          {!result && !loading && (
            <div className="rounded-2xl bg-slate-900/60 border border-dashed border-white/15 p-10 text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Code2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ready to Explain</h3>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
                Paste your code snippet on the left and click <strong>"Explain My Code"</strong>. We will unpack the logic, key lines, and potential gotchas.
              </p>
              <button
                type="button"
                onClick={handleExplain}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-white/10 transition-colors"
              >
                Explain Current Sample Code &rarr;
              </button>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-10 text-center flex flex-col items-center justify-center min-h-[460px] space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-500 animate-spin flex items-center justify-center p-[2px]">
                  <div className="w-full h-full bg-[#070a13] rounded-[14px]" />
                </div>
                <Sparkles className="w-6 h-6 text-cyan-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white">Gemini is Mentoring You...</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Examining logic, edge cases, open-source best practices, and drafting a plain-English explanation.
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4 animate-fadeIn">
              {/* 1. Summary Card */}
              <div className="rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                      Plain English Explanation
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    High-Level Concept
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {result.summary}
                </p>
              </div>

              {/* 2. Important Lines & What They Do */}
              <div className="rounded-2xl bg-slate-900/90 border border-purple-500/30 p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                    Important Lines & Mechanics
                  </h3>
                </div>
                <div className="space-y-3">
                  {result.importantLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-[#080d1a] border border-white/5 p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                          Key Block #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(line.codeSnippet, `line-${idx}`)}
                          className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                        >
                          {copiedKey === `line-${idx}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs font-mono text-cyan-300 overflow-x-auto py-1 px-2 rounded bg-black/40 border border-white/5">
                        <code>{line.codeSnippet}</code>
                      </pre>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        {line.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Potential Bugs & Edge Cases */}
              <div className="rounded-2xl bg-slate-900/90 border border-amber-500/30 p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                    Potential Bugs & Edge Cases
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {result.potentialBugs.map((bug, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 flex items-start gap-3"
                    >
                      <Bug className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-amber-300">{bug.title}</span>
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200">
                            {bug.severity || 'Notice'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{bug.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Working Example / Demonstration */}
              <div className="rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                      Working Usage Example
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.example, 'example')}
                    className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-slate-800 border border-white/5"
                  >
                    {copiedKey === 'example' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-[#080d1a] border border-white/10 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
                  <code>{result.example}</code>
                </pre>
              </div>

              {/* Mentor Open Source Tips */}
              {result.mentorTips && result.mentorTips.length > 0 && (
                <div className="rounded-2xl bg-indigo-950/40 border border-indigo-500/30 p-4">
                  <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                    <Lightbulb className="w-4 h-4 text-indigo-400" />
                    Maintainer's Perspective
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-300">
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
