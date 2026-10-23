import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  ExternalLink,
  Star,
  GitFork,
  AlertCircle,
  Tag,
  BookmarkPlus,
  BookmarkCheck,
  Code2,
  Sparkles,
  Info,
  RefreshCw,
  FolderGit2,
  Check,
  Flame,
  FileCode2,
  HelpCircle,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { GitHubRepository, ActiveTab } from '../types.ts';

interface RepoFinderViewProps {
  onNavigateTab?: (tab: ActiveTab) => void;
  onSaveRepo?: (title: string, summary: string, details: any) => void;
}

const PRESET_TOPICS = [
  'All Topics',
  'Web Development',
  'AI and Machine Learning',
  'Developer Tools',
  'Education',
  'Productivity',
  'Climate',
  'Community Tools'
];

const PRESET_LANGUAGES = [
  'Any language',
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'Go',
  'Rust',
  'C++'
];

export const RepoFinderView: React.FC<RepoFinderViewProps> = ({
  onNavigateTab,
  onSaveRepo,
}) => {
  const [language, setLanguage] = useState<string>('JavaScript');
  const [topic, setTopic] = useState<string>('Web Development');
  const [experience, setExperience] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [keyword, setKeyword] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>(() => {
    const cached = localStorage.getItem('codebridge_cached_repos');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [savedRepos, setSavedRepos] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('codebridge_saved_repos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const map: Record<string, boolean> = {};
        parsed.forEach((item: { fullName: string }) => {
          if (item.fullName) map[item.fullName] = true;
        });
        return map;
      } catch {
        return {};
      }
    }
    return {};
  });

  const [copiedUrlKey, setCopiedUrlKey] = useState<string | null>(null);

  useEffect(() => {
    if (repositories.length > 0) {
      localStorage.setItem('codebridge_cached_repos', JSON.stringify(repositories));
    }
  }, [repositories]);

  // Initial load if no cached repositories exist
  useEffect(() => {
    if (repositories.length === 0) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/find-repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: language === 'Any language' ? undefined : language,
          topic: topic === 'All Topics' ? undefined : topic,
          experience,
          keyword: keyword.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search GitHub repositories.');
      }

      setRepositories(data.repositories || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reaching GitHub Search API.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (repo: GitHubRepository) => {
    let existing: GitHubRepository[] = [];
    try {
      const stored = localStorage.getItem('codebridge_saved_repos');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) existing = parsed;
      }
    } catch {
      existing = [];
    }
    const isAlreadySaved = existing.some((item) => item.fullName === repo.fullName);

    let updated: GitHubRepository[];
    if (isAlreadySaved) {
      updated = existing.filter((item) => item.fullName !== repo.fullName);
      setSavedRepos((prev) => ({ ...prev, [repo.fullName]: false }));
    } else {
      updated = [repo, ...existing];
      setSavedRepos((prev) => ({ ...prev, [repo.fullName]: true }));
    }

    localStorage.setItem('codebridge_saved_repos', JSON.stringify(updated));

    if (onSaveRepo && !isAlreadySaved) {
      onSaveRepo(
        repo.fullName,
        `${repo.description} (${repo.language || 'Multi-language'} • ⭐ ${repo.stars.toLocaleString()})`,
        repo
      );
    }
  };

  const handleCopyLink = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlKey(key);
    setTimeout(() => setCopiedUrlKey(null), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Compass className="w-3.5 h-3.5" />
            Live GitHub Explorer
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Open-Source Repository Finder</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Discover real open-source projects actively looking for contributors, with direct links to beginner-friendly "good first issue" and "help wanted" tickets.
          </p>
        </div>

        {repositories.length > 0 && (
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-white/10 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Projects</span>
          </button>
        )}
      </div>

      {/* Filter Card */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 sm:p-7 shadow-xl space-y-5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          Filter Real Repositories
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Programming Language */}
          <div>
            <label htmlFor="repo-lang" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Programming Language:
            </label>
            <select
              id="repo-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-[#080d1a] border border-white/10 text-cyan-300 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
            >
              {PRESET_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Topic */}
          <div>
            <label htmlFor="repo-topic" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Topic / Domain:
            </label>
            <select
              id="repo-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[#080d1a] border border-white/10 text-cyan-300 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
            >
              {PRESET_TOPICS.map((top) => (
                <option key={top} value={top}>
                  {top}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Experience Level */}
          <div>
            <label htmlFor="repo-exp" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Experience Level:
            </label>
            <select
              id="repo-exp"
              value={experience}
              onChange={(e) => setExperience(e.target.value as any)}
              className="w-full bg-[#080d1a] border border-white/10 text-cyan-300 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
            >
              <option value="Beginner">Beginner (Good First Issues)</option>
              <option value="Intermediate">Intermediate (Help Wanted)</option>
              <option value="Advanced">Advanced (High Scale / Core)</option>
            </select>
          </div>

          {/* 4. Optional Keyword Search */}
          <div>
            <label htmlFor="repo-kw" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Keyword (optional):
            </label>
            <input
              id="repo-kw"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. react, markdown, cli"
              className="w-full bg-[#080d1a] border border-white/10 text-cyan-200 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 font-mono placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/10">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Searches GitHub's official search index in real time
          </span>

          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:shadow-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Searching GitHub...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-cyan-200" />
                <span>Find Projects</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl bg-red-950/40 border border-red-500/40 p-4 text-red-200 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-300">GitHub API Search Error</p>
            <p className="text-slate-300">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-white/5 p-6 space-y-4">
              <div className="h-6 bg-slate-800 rounded-lg w-3/4" />
              <div className="h-16 bg-slate-800/60 rounded-lg w-full" />
              <div className="h-4 bg-slate-800/40 rounded w-1/2" />
              <div className="h-8 bg-slate-800/50 rounded-xl w-full mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && repositories.length === 0 && (
        <div className="rounded-2xl bg-slate-900/60 border border-dashed border-white/15 p-12 text-center flex flex-col items-center justify-center min-h-[360px]">
          <FolderGit2 className="w-12 h-12 text-slate-500 mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">No Repositories Found</h3>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
            Try adjusting your language, topic, or keyword filters to broaden the search scope across GitHub.
          </p>
          <button
            type="button"
            onClick={() => {
              setLanguage('Any language');
              setTopic('All Topics');
              setKeyword('');
              handleSearch();
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            Clear Filters & Search All Topics &rarr;
          </button>
        </div>
      )}

      {/* Real Repositories Grid */}
      {!loading && repositories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong>{repositories.length}</strong> real GitHub repositories matching your criteria
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live GitHub API Data
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {repositories.map((repo) => {
              const isSaved = Boolean(savedRepos[repo.fullName]);

              return (
                <div
                  key={repo.id}
                  className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#080d1a] border border-white/10 hover:border-purple-500/40 p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all duration-200 group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Name, Avatar, Save */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {repo.ownerAvatarUrl ? (
                          <img
                            src={repo.ownerAvatarUrl}
                            alt=""
                            className="w-7 h-7 rounded-lg border border-white/10 shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                            <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                        )}
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-sm sm:text-base text-white hover:text-cyan-300 truncate transition-colors group-hover:text-cyan-300"
                          title={repo.fullName}
                        >
                          {repo.name}
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSave(repo)}
                        title={isSaved ? 'Remove from Saved' : 'Bookmark Repository'}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                          isSaved
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white border-white/10'
                        }`}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <BookmarkPlus className="w-4 h-4 text-cyan-400" />
                        )}
                      </button>
                    </div>

                    {/* Full Name & License */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono truncate">
                      <span>{repo.fullName}</span>
                      {repo.licenseName && (
                        <>
                          <span>•</span>
                          <span className="truncate">{repo.licenseName}</span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {repo.description}
                    </p>

                    {/* Metrics Bar: Language, Stars, Forks */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                      {repo.language && (
                        <span className="flex items-center gap-1.5 font-semibold text-cyan-300">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          {repo.language}
                        </span>
                      )}

                      <span className="flex items-center gap-1" title={`${repo.stars.toLocaleString()} Stars`}>
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        <span>{repo.stars.toLocaleString()}</span>
                      </span>

                      <span className="flex items-center gap-1" title={`${repo.forks.toLocaleString()} Forks`}>
                        <GitFork className="w-3.5 h-3.5 text-purple-400" />
                        <span>{repo.forks.toLocaleString()}</span>
                      </span>
                    </div>

                    {/* Topics Chips */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {repo.topics.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/5 border border-white/5 text-slate-400"
                          >
                            #{t}
                          </span>
                        ))}
                        {repo.topics.length > 3 && (
                          <span className="px-1.5 py-0.5 text-[10px] text-slate-500">
                            +{repo.topics.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    {/* Good First Issues Button */}
                    <a
                      href={repo.goodFirstIssuesUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-200 text-xs font-semibold transition-all group/btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>View Good First Issues</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover/btn:opacity-100 transition-opacity" />
                    </a>

                    {/* GitHub Repo Link */}
                    <div className="flex items-center gap-2">
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-white/10 transition-colors"
                      >
                        <span>Open on GitHub</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(repo.htmlUrl, `repo-${repo.id}`)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs border border-white/10 transition-colors cursor-pointer"
                        title="Copy Clone URL"
                      >
                        {copiedUrlKey === `repo-${repo.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <span className="font-mono text-[11px]">git clone</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
