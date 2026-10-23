import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Compass,
  Map,
  CheckSquare,
  Square,
  Bookmark,
  ExternalLink,
  RotateCcw,
  FolderGit2,
  Bug,
  Info,
  Clock,
  Check,
  Layers,
  ChevronRight,
  Award,
  GraduationCap
} from 'lucide-react';
import { ActiveTab, LearningTask, SavedItem, ContributionRoadmap, ProjectIdea } from '../types.ts';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onLoadQuickCode: () => void;
  onLoadQuickIssue: () => void;
  prCount: number;
  tasks?: LearningTask[];
  savedItems?: SavedItem[];
  onToggleTask?: (taskId: string) => void;
  onUpdatePrCount?: (count: number) => void;
  onResetProgress?: () => void;
  onRemoveSavedItem?: (id: string) => void;
}

const PR_GUIDE_STAGE_NAMES: Record<number, string> = {
  1: 'Understand Open Source & Choose a Repository',
  2: 'Read the Guidelines & Code of Conduct',
  3: 'Fork the Repository to Your GitHub Account',
  4: 'Clone Your Fork & Set Up Upstream Remote',
  5: 'Create a New Git Feature Branch',
  6: 'Make and Test Your Changes Locally',
  7: 'Commit Your Changes with Conventional Commits',
  8: 'Push Your Branch to Your GitHub Fork',
  9: 'Open a Pull Request with Clear Context',
  10: 'Respond to Review Feedback & Merge',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onLoadQuickCode,
  onLoadQuickIssue,
  prCount,
  tasks = [],
  savedItems = [],
  onToggleTask,
  onUpdatePrCount,
  onResetProgress,
  onRemoveSavedItem,
}) => {
  // 1. Read PR Guide Completed Steps from localStorage safely
  const [prCompletedSteps, setPrCompletedSteps] = useState<Record<number, boolean>>({});

  // 2. Read Active Contribution Roadmap & checked tasks from localStorage safely
  const [activeRoadmap, setActiveRoadmap] = useState<ContributionRoadmap | null>(null);
  const [roadmapCheckedTasks, setRoadmapCheckedTasks] = useState<Record<string, boolean>>({});

  // 3. Read Recent Project Ideas from localStorage safely
  const [recentIdeas, setRecentIdeas] = useState<ProjectIdea[]>([]);

  // 4. Read Saved Repositories from localStorage safely
  const [savedReposCount, setSavedReposCount] = useState<number>(0);

  // 5. Read Learning Center completed modules from localStorage safely
  const [learningCompleted, setLearningCompleted] = useState<Record<string, boolean>>({});

  // Load and refresh actual stored data on mount or focus or when cloud sync updates local storage
  useEffect(() => {
    loadLocalActivity();
    window.addEventListener('focus', loadLocalActivity);
    window.addEventListener('codebridge_progress_updated', loadLocalActivity);
    return () => {
      window.removeEventListener('focus', loadLocalActivity);
      window.removeEventListener('codebridge_progress_updated', loadLocalActivity);
    };
  }, []);

  const loadLocalActivity = () => {
    // 1. PR Guide completed steps
    try {
      const prSaved = localStorage.getItem('codebridge_pr_guide_completed_steps');
      if (prSaved) {
        setPrCompletedSteps(JSON.parse(prSaved));
      } else {
        setPrCompletedSteps({});
      }
    } catch {
      setPrCompletedSteps({});
    }

    // 2. Active Roadmap
    try {
      const roadmapSaved = localStorage.getItem('codebridge_cached_roadmap');
      if (roadmapSaved) {
        setActiveRoadmap(JSON.parse(roadmapSaved));
      } else {
        setActiveRoadmap(null);
      }

      const roadmapTasksSaved = localStorage.getItem('codebridge_roadmap_checked_tasks');
      if (roadmapTasksSaved) {
        setRoadmapCheckedTasks(JSON.parse(roadmapTasksSaved));
      } else {
        setRoadmapCheckedTasks({});
      }
    } catch {
      setActiveRoadmap(null);
      setRoadmapCheckedTasks({});
    }

    // 3. Recent Ideas
    try {
      const ideasSaved = localStorage.getItem('codebridge_cached_ideas_v2') || localStorage.getItem('codebridge_cached_ideas');
      if (ideasSaved) {
        const parsed = JSON.parse(ideasSaved);
        setRecentIdeas(Array.isArray(parsed) ? parsed : []);
      } else {
        setRecentIdeas([]);
      }
    } catch {
      setRecentIdeas([]);
    }

    // 4. Saved Repos
    try {
      const reposSaved = localStorage.getItem('codebridge_saved_repos');
      if (reposSaved) {
        const parsed = JSON.parse(reposSaved);
        setSavedReposCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch {
      setSavedReposCount(0);
    }

    // 5. Learning Center completed modules
    try {
      const learningSaved = localStorage.getItem('codebridge_learning_center_completed_modules');
      if (learningSaved) {
        const parsed = JSON.parse(learningSaved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setLearningCompleted(parsed);
        }
      }
    } catch {
      setLearningCompleted({});
    }
  };

  // Calculations from ACTUAL stored data (Requirement 4)
  const prGuideFinishedCount = Object.values(prCompletedSteps).filter(Boolean).length;
  const roadmapFinishedCount = Object.values(roadmapCheckedTasks).filter(Boolean).length;
  const tasksFinishedCount = tasks.filter((t) => t.completed).length;
  const learningFinishedCount = Object.values(learningCompleted).filter(Boolean).length;

  const totalChecklistItemsCompleted = prGuideFinishedCount + roadmapFinishedCount + tasksFinishedCount + learningFinishedCount;
  const activeRoadmapsCount = activeRoadmap ? 1 : 0;
  const totalSavedCount = savedItems.length + savedReposCount;

  return (
    <div className="space-y-12 pb-20">
      {/* Hero & Activity Summary Header */}
      <div className="relative text-center max-w-3xl mx-auto pt-4 sm:pt-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-cyan-500/15 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-medium mb-4 shadow-sm">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>CodeBridge AI • Contributor Activity Center</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 leading-tight">
          My Dashboard
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed mb-6">
          Your open-source command center. Review real-time progress on your pull request guide, active contribution roadmaps, and saved project ideas.
        </p>

        {/* Quick Launch Return Buttons (Requirement 7) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('learning-center')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-white/10 text-xs font-semibold hover:border-cyan-500/40 transition-all cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Learning Center
          </button>

          <button
            type="button"
            onClick={() => onNavigate('explainer')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-white/10 text-xs font-semibold hover:border-cyan-500/40 transition-all cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            Code Explainer
          </button>

          <button
            type="button"
            onClick={() => onNavigate('issue-helper')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-purple-300 border border-white/10 text-xs font-semibold hover:border-purple-500/40 transition-all cursor-pointer"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Issue Helper
          </button>

          <button
            type="button"
            onClick={() => onNavigate('pr-guide')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-white/10 text-xs font-semibold hover:border-cyan-500/40 transition-all cursor-pointer"
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            PR Guide
          </button>

          <button
            type="button"
            onClick={() => onNavigate('idea-generator')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-white/10 text-xs font-semibold hover:border-amber-500/40 transition-all cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Idea Generator
          </button>

          <button
            type="button"
            onClick={() => onNavigate('repo-finder')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border border-white/10 text-xs font-semibold hover:border-emerald-500/40 transition-all cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            Repo Finder
          </button>

          <button
            type="button"
            onClick={() => onNavigate('roadmap')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-indigo-300 border border-white/10 text-xs font-semibold hover:border-indigo-500/40 transition-all cursor-pointer"
          >
            <Map className="w-3.5 h-3.5" />
            Contribution Roadmap
          </button>
        </div>
      </div>

      {/* Progress Statistics (Requirements 4 & 6 - Computed strictly from actual stored data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Completed Checklist Items */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Completed Checklist Items
            </span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {totalChecklistItemsCompleted}
          </div>
          <p className="text-[11px] text-slate-400">
            Across PR Guide ({prGuideFinishedCount}), Learning Center ({learningFinishedCount}), Roadmap ({roadmapFinishedCount}), and Milestones ({tasksFinishedCount})
          </p>
        </div>

        {/* Stat 2: Active Roadmaps */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Roadmaps
            </span>
            <Map className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {activeRoadmapsCount}
          </div>
          <p className="text-[11px] text-slate-400">
            {activeRoadmap ? activeRoadmap.verifiedRepo.fullName : 'No active roadmap'}
          </p>
        </div>

        {/* Stat 3: Hacktoberfest PR Goal */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Hacktoberfest Goal
            </span>
            <Trophy className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{prCount}</span>
            <span className="text-xs text-slate-400">/ 4 PRs</span>
          </div>
          {onUpdatePrCount && (
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-slate-400">Adjust count:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdatePrCount(Math.max(0, prCount - 1))}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => onUpdatePrCount(prCount + 1)}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stat 4: Saved Resources */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Saved Bookmarks
            </span>
            <Bookmark className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {totalSavedCount}
          </div>
          <p className="text-[11px] text-slate-400">
            {savedItems.length} code/issues/ideas + {savedReposCount} bookmarked repos
          </p>
        </div>
      </div>

      {/* Main Activity Breakdown Grid (Requirements 2 & 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: First Pull Request Guide Checklist Progress (Requirement 2) */}
        <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-6 shadow-xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center">
                  <GitPullRequest className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">First Pull Request Guide</h3>
                  <p className="text-xs text-slate-400">
                    {prGuideFinishedCount} of 10 stages completed ({Math.round((prGuideFinishedCount / 10) * 100)}%)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('pr-guide')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>Open Guide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                style={{ width: `${(prGuideFinishedCount / 10) * 100}%` }}
              />
            </div>

            {/* Completed Stages List (or Empty State) */}
            {prGuideFinishedCount > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {Object.keys(PR_GUIDE_STAGE_NAMES).map((stageNumStr) => {
                  const stageNum = parseInt(stageNumStr, 10);
                  const isDone = Boolean(prCompletedSteps[stageNum]);
                  if (!isDone) return null;

                  return (
                    <div
                      key={stageNum}
                      className="p-2.5 rounded-xl bg-[#080d1a] border border-emerald-500/30 flex items-center gap-2.5 text-xs text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-mono text-emerald-300 text-[11px] font-bold shrink-0">
                        Stage {stageNum}
                      </span>
                      <span className="truncate">{PR_GUIDE_STAGE_NAMES[stageNum]}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Requirement 5: Clear empty state */
              <div className="rounded-xl bg-[#080d1a] border border-dashed border-white/10 p-6 text-center space-y-2">
                <GitPullRequest className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-300">No PR Guide Stages Completed Yet</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Work through the 10-stage guide covering forking, branching, committing, and opening your first pull request.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('pr-guide')}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                >
                  Start PR Guide &rarr;
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Progress automatically saved in local browser storage</span>
            <button
              type="button"
              onClick={() => onNavigate('pr-guide')}
              className="text-cyan-400 hover:underline"
            >
              Continue from Stage {Math.min(10, prGuideFinishedCount + 1)} &rarr;
            </button>
          </div>
        </div>

        {/* Section 2: AI Contribution Roadmap Checklist Progress (Requirements 2 & 3) */}
        <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-6 shadow-xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center">
                  <Map className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Active Contribution Roadmap</h3>
                  <p className="text-xs text-slate-400">
                    {activeRoadmap
                      ? `${roadmapFinishedCount} of ${activeRoadmap.interactiveChecklist?.length || 0} checklist tasks finished`
                      : 'No roadmap generated yet'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('roadmap')}
                className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>{activeRoadmap ? 'View Roadmap' : 'Create Roadmap'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Active Roadmap Card or Empty State */}
            {activeRoadmap ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#080d1a] border border-purple-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 font-mono">
                      {activeRoadmap.verifiedRepo.fullName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {activeRoadmap.verifiedRepo.verified ? 'Verified Repo' : 'Custom Input'}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {activeRoadmap.verifiedIssue.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {activeRoadmap.overview}
                  </p>
                </div>

                {/* Checklist tasks snippet */}
                {activeRoadmap.interactiveChecklist && activeRoadmap.interactiveChecklist.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {activeRoadmap.interactiveChecklist.map((task) => {
                      const isDone = Boolean(roadmapCheckedTasks[task.id]);
                      return (
                        <div
                          key={task.id}
                          className={`p-2.5 rounded-lg border flex items-center gap-2.5 text-xs ${
                            isDone
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                              : 'bg-black/30 border-white/5 text-slate-400'
                          }`}
                        >
                          {isDone ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <span className={`truncate ${isDone ? 'line-through text-slate-400' : ''}`}>
                            {task.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Requirement 5: Clear empty state */
              <div className="rounded-xl bg-[#080d1a] border border-dashed border-white/10 p-6 text-center space-y-2">
                <Map className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-300">No Contribution Roadmap Active</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Enter a target repository and issue URL to generate a personalized 6-stage roadmap and checklist.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('roadmap')}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                >
                  Create Contribution Roadmap &rarr;
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>{activeRoadmap ? 'Roadmap saved locally' : 'No active roadmap in browser'}</span>
            <button
              type="button"
              onClick={() => onNavigate('roadmap')}
              className="text-purple-300 hover:underline"
            >
              Go to Roadmap Planner &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Recently Generated Project Ideas (Requirement 3) */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Recently Generated Project Ideas</h3>
              <p className="text-xs text-slate-400">
                {recentIdeas.length > 0
                  ? `Displaying ${recentIdeas.length} project blueprints generated with Gemini`
                  : 'No project ideas generated yet'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('idea-generator')}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Generate New Ideas</span>
          </button>
        </div>

        {recentIdeas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentIdeas.slice(0, 3).map((idea, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-[#080d1a] border border-white/5 hover:border-amber-500/30 p-4 space-y-3 flex flex-col justify-between transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white truncate">{idea.title}</h4>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {idea.shortDescription}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  {idea.skillsToPractice && idea.skillsToPractice.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {idea.skillsToPractice.slice(0, 2).map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-purple-300 border border-white/5 truncate"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onNavigate('idea-generator')}
                    className="w-full text-center text-[11px] text-amber-400 hover:text-amber-300 py-1 font-semibold cursor-pointer"
                  >
                    View Full Specification &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Requirement 5: Clear empty state */
          <div className="rounded-xl bg-[#080d1a] border border-dashed border-white/10 p-8 text-center space-y-2">
            <Lightbulb className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-300">No Project Ideas Generated Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Use the AI Project Idea Generator to discover custom open-source project ideas tailored to your programming language and domain.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('idea-generator')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
            >
              Generate Project Ideas &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Section 4: Saved Bookmarks & Explanations */}
      {savedItems.length > 0 && (
        <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Saved Resources & Bookmarks</h3>
                <p className="text-xs text-slate-400">{savedItems.length} items saved locally</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('tracker')}
              className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>Manage in Tracker</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {savedItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#080d1a] border border-white/5 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {item.type}
                    </span>
                    <h4 className="font-bold text-white truncate">{item.title}</h4>
                  </div>
                  <p className="text-slate-400 line-clamp-2 leading-relaxed">{item.summary}</p>
                </div>

                {onRemoveSavedItem && (
                  <button
                    type="button"
                    onClick={() => onRemoveSavedItem(item.id)}
                    className="text-slate-500 hover:text-red-400 p-1 shrink-0"
                    title="Remove item"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Local Storage & Privacy Transparency Notice (Requirement 6 & prompt instruction) */}
      <div className="rounded-2xl bg-[#060a14] border border-white/10 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Local Storage & Data Privacy Transparency
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="rounded-xl bg-[#080d1a] p-3.5 border border-white/5 space-y-1">
            <span className="font-semibold text-emerald-300 block">✓ What is saved locally in your browser:</span>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>Completed stages from the First Pull Request Guide</li>
              <li>Active Contribution Roadmap plan and checked tasks</li>
              <li>Recently generated project ideas & bookmarks</li>
              <li>Your Hacktoberfest PR goal counter</li>
            </ul>
          </div>

          <div className="rounded-xl bg-[#080d1a] p-3.5 border border-white/5 space-y-1">
            <span className="font-semibold text-cyan-300 block">🔒 What is NOT stored or shared:</span>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>No personal database accounts or cloud user profiles required</li>
              <li>No GitHub credentials or tokens are stored in the frontend</li>
              <li>All Gemini AI analysis is processed securely via server-side routes</li>
              <li>You can reset or clear stored data at any time</li>
            </ul>
          </div>
        </div>

        {onResetProgress && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onResetProgress}
              className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Local Progress & Counters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
