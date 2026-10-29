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
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-accent" />
            <span>Live GitHub Explorer</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-normal tracking-tight">
            <span className="font-medium text-ink-strong">Open-Source Repository Finder</span>{' '}
            <span className="font-normal text-ink-subtle">· Live GitHub directory</span>
          </h2>
          <p className="text-[13px] text-ink-subtle mt-1 max-w-2xl leading-relaxed">
            Discover real open-source projects actively looking for contributors, with direct links to beginner-friendly "good first issue" and "help wanted" tickets.
          </p>
        </div>

        {repositories.length > 0 && (
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="self-start sm:self-auto h-8 px-3 rounded-[10px] text-[12px] font-medium bg-surface-2 hover:bg-surface text-ink border border-hairline transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-ink-subtle ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Projects</span>
          </button>
        )}
      </div>

      {/* Filter Card */}
      <div className="card-71 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-[11px] font-medium text-ink-subtle uppercase tracking-wider">
          <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
          <span>Filter Real Repositories</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Programming Language */}
          <div className="space-y-1.5">
            <label htmlFor="repo-lang" className="text-[12px] font-medium text-ink-subtle block">
              Programming Language
            </label>
            <select
              id="repo-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-8 px-3 rounded-[10px] text-[13px] bg-surface-2 border border-hairline text-ink font-medium focus:outline-none focus:border-accent cursor-pointer"
            >
              {PRESET_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Topic */}
          <div className="space-y-1.5">
            <label htmlFor="repo-topic" className="text-[12px] font-medium text-ink-subtle block">
              Topic / Domain
            </label>
            <select
              id="repo-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full h-8 px-3 rounded-[10px] text-[13px] bg-surface-2 border border-hairline text-ink font-medium focus:outline-none focus:border-accent cursor-pointer"
            >
              {PRESET_TOPICS.map((top) => (
                <option key={top} value={top}>
                  {top}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Experience Level */}
          <div className="space-y-1.5">
            <label htmlFor="repo-exp" className="text-[12px] font-medium text-ink-subtle block">
              Experience Level
            </label>
            <select
              id="repo-exp"
              value={experience}
              onChange={(e) => setExperience(e.target.value as any)}
              className="w-full h-8 px-3 rounded-[10px] text-[13px] bg-surface-2 border border-hairline text-ink font-medium focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="Beginner">Beginner (Good First Issues)</option>
              <option value="Intermediate">Intermediate (Help Wanted)</option>
              <option value="Advanced">Advanced (High Scale / Core)</option>
            </select>
          </div>

          {/* 4. Optional Keyword Search */}
          <div className="space-y-1.5">
            <label htmlFor="repo-kw" className="text-[12px] font-medium text-ink-subtle block">
              Keyword (optional)
            </label>
            <input
              id="repo-kw"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. react, markdown, cli"
              className="w-full h-8 px-3 rounded-[10px] text-[13px] bg-surface-2 border border-hairline text-ink font-mono placeholder:text-ink-subtle/50 focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-hairline">
          <span className="text-[12px] text-ink-subtle hidden sm:inline">
            Searches GitHub's official search index in real time
          </span>

          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="w-full sm:w-auto h-8 px-5 rounded-[10px] bg-accent hover:bg-accent-hover text-white text-[13px] font-medium transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Searching GitHub...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Find Projects</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card-71 p-4 border-rose-500/25 bg-rose-500/5 text-[13px] flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-medium text-rose-500">GitHub API Search Error</p>
            <p className="text-ink-subtle">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-60 card-71 p-5 space-y-3 animate-pulse">
              <div className="h-5 bg-surface-2 rounded-[6px] w-3/4" />
              <div className="h-14 bg-surface-2 rounded-[6px] w-full" />
              <div className="h-4 bg-surface-2 rounded-[6px] w-1/2" />
              <div className="h-8 bg-surface-2 rounded-[10px] w-full mt-3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && repositories.length === 0 && (
        <div className="card-71 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <FolderGit2 className="w-10 h-10 text-ink-subtle mb-3" />
          <h3 className="text-base font-medium text-ink-strong mb-1">No Repositories Found</h3>
          <p className="text-[13px] text-ink-subtle max-w-md leading-relaxed mb-5">
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
            className="h-8 px-4 rounded-[10px] text-[12px] font-medium bg-surface-2 hover:bg-surface text-ink border border-hairline transition-colors cursor-pointer"
          >
            Clear Filters & Search All Topics &rarr;
          </button>
        </div>
      )}

      {/* Real Repositories Grid */}
      {!loading && repositories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[12px] text-ink-subtle px-1">
            <span>
              Showing <strong className="text-ink-strong tabular-nums">{repositories.length}</strong> real GitHub repositories matching your criteria
            </span>
            <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live GitHub API Data
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repositories.map((repo) => {
              const isSaved = Boolean(savedRepos[repo.fullName]);

              return (
                <div
                  key={repo.id}
                  className="card-71 p-5 flex flex-col justify-between space-y-4 hover:border-hairline transition-colors group"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Name, Avatar, Save */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {repo.ownerAvatarUrl ? (
                          <img
                            src={repo.ownerAvatarUrl}
                            alt=""
                            className="w-6 h-6 rounded-[6px] border border-hairline shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-[6px] bg-surface-2 border border-hairline flex items-center justify-center shrink-0">
                            <FolderGit2 className="w-3 h-3 text-accent" />
                          </div>
                        )}
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[14px] text-ink-strong hover:text-accent truncate transition-colors"
                          title={repo.fullName}
                        >
                          {repo.name}
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSave(repo)}
                        title={isSaved ? 'Remove from Saved' : 'Bookmark Repository'}
                        className={`w-7 h-7 rounded-[8px] border transition-colors flex items-center justify-center cursor-pointer shrink-0 ${
                          isSaved
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                            : 'bg-surface-2 text-ink-subtle hover:text-ink border-hairline'
                        }`}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <BookmarkPlus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Full Name & License */}
                    <div className="flex items-center gap-1.5 text-[11px] text-ink-subtle font-mono truncate">
                      <span>{repo.fullName}</span>
                      {repo.licenseName && (
                        <>
                          <span>·</span>
                          <span className="truncate">{repo.licenseName}</span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-[12px] text-ink line-clamp-3 leading-relaxed">
                      {repo.description}
                    </p>

                    {/* Metrics Bar: Language, Stars, Forks */}
                    <div className="flex flex-wrap items-center gap-3 text-[12px] text-ink-subtle pt-0.5">
                      {repo.language && (
                        <span className="flex items-center gap-1.5 font-medium text-ink">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          {repo.language}
                        </span>
                      )}

                      <span className="flex items-center gap-1 font-mono tabular-nums" title={`${repo.stars.toLocaleString()} Stars`}>
                        <Star className="w-3 h-3 text-amber-500" />
                        <span>{repo.stars.toLocaleString()}</span>
                      </span>

                      <span className="flex items-center gap-1 font-mono tabular-nums" title={`${repo.forks.toLocaleString()} Forks`}>
                        <GitFork className="w-3 h-3 text-ink-subtle" />
                        <span>{repo.forks.toLocaleString()}</span>
                      </span>
                    </div>

                    {/* Topics Chips */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-ink-subtle">
                        {repo.topics.slice(0, 3).map((t, idx) => (
                          <span key={idx} className="badge-71 font-mono text-[10px]">
                            #{t}
                          </span>
                        ))}
                        {repo.topics.length > 3 && (
                          <span className="text-[10px] text-ink-subtle font-mono">
                            +{repo.topics.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-hairline space-y-2">
                    {/* Good First Issues Button */}
                    <a
                      href={repo.goodFirstIssuesUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full h-8 px-3 rounded-[10px] bg-surface-2 hover:bg-surface border border-hairline text-ink text-[12px] font-medium transition-colors flex items-center justify-between group/btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>View Good First Issues</span>
                      </span>
                      <ExternalLink className="w-3 h-3 text-ink-subtle group-hover/btn:text-ink transition-colors" />
                    </a>

                    {/* GitHub Repo Link & Clone */}
                    <div className="flex items-center gap-2">
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-8 rounded-[10px] bg-surface-2 hover:bg-surface text-ink text-[12px] font-medium border border-hairline transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Open on GitHub</span>
                        <ExternalLink className="w-3 h-3 text-ink-subtle" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(repo.htmlUrl, `repo-${repo.id}`)}
                        className="h-8 px-2.5 rounded-[10px] bg-surface-2 hover:bg-surface text-ink text-[11px] font-mono border border-hairline transition-colors cursor-pointer flex items-center justify-center"
                        title="Copy Clone URL"
                      >
                        {copiedUrlKey === `repo-${repo.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <span>git clone</span>
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
