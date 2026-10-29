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
    <div className="space-y-8 pb-16">
      {/* Hero & Activity Summary Header */}
      <div className="text-center max-w-3xl mx-auto pt-2 sm:pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-surface-2 border border-hairline text-[12px] text-ink-subtle mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#0070E0]" />
          <span>CodeBridge AI · Contributor Activity Center</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-ink-strong mb-2">
          My Dashboard <span className="text-ink-subtle">· Contributor Command</span>
        </h1>

        <p className="text-sm text-ink-subtle max-w-2xl mx-auto leading-relaxed mb-6">
          Your open-source command center. Review real-time progress on your pull request guide, active contribution roadmaps, and saved project ideas.
        </p>

        {/* Quick Launch Return Buttons (71UI standard 32px controls, rounded-[10px]) */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('learning-center')}
            className="btn-secondary h-8 px-3 rounded-[10px] text-[13px] flex items-center gap-1.5 cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#0070E0]" />
            Learning Center
          </button>

          <button
            type="button"
            onClick={() => onNavigate('explainer')}
            className="btn-secondary h-8 px-3 rounded-[10px] text-[13px] flex items-center gap-1.5 cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-[#0070E0]" />
            Code Explainer
          </button>

          <button
            type="button"
            onClick={() => onNavigate('issue-helper')}
            className="btn-secondary h-8 px-3 rounded-[10px] text-[13px] flex items-center gap-1.5 cursor-pointer"
          >
            <FileCode2 className="w-3.5 h-3.5 text-[#0070E0]" />
            Issue Helper
          </button>

          <button
            type="button"
            onClick={() => onNavigate('pr-guide')}
            className="btn-secondary h-8 px-3 rounded-[10px] text-[13px] flex items-center gap-1.5 cursor-pointer"
          >
            <GitPullRequest className="w-3.5 h-3.5 text-[#0070E0]" />
            PR Guide
          </button>

          <button
            type="button"
            onClick={() => onNavigate('idea-generator')}
            className="btn-secondary h-8 px-3 rounded-[10px] text-[13px] flex items-center gap-1.5 cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#0070E0]" />
            Idea Generator
          </button>

          <button
            type="button"
            onClick={() => onNavigate('repo-finder')}
            className="btn-secondary h-8 px-3 rounded-[10px] text-[13px] flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#0070E0]" />
            Repo Finder
          </button>

          <button
            type="button"
            onClick={() => onNavigate('roadmap')}
            className="btn-secondary h-8 px-3 rounded-[10px] text-[13px] flex items-center gap-1.5 cursor-pointer"
          >
            <Map className="w-3.5 h-3.5 text-[#0070E0]" />
            Roadmap
          </button>
        </div>
      </div>

      {/* Progress Statistics (71UI Stat Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Stat 1: Completed Checklist Items */}
        <div className="rounded-xl bg-surface border border-hairline p-4 space-y-1">
          <div className="flex items-center justify-between text-ink-subtle">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              Completed Items
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#0070E0]" />
          </div>
          <div className="text-2xl sm:text-3xl font-medium text-ink-strong tabular-nums">
            {totalChecklistItemsCompleted}
          </div>
          <p className="text-[11px] text-ink-subtle leading-tight">
            PR ({prGuideFinishedCount}) · Learning ({learningFinishedCount}) · Roadmap ({roadmapFinishedCount}) · Milestones ({tasksFinishedCount})
          </p>
        </div>

        {/* Stat 2: Active Roadmaps */}
        <div className="rounded-xl bg-surface border border-hairline p-4 space-y-1">
          <div className="flex items-center justify-between text-ink-subtle">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              Active Roadmaps
            </span>
            <Map className="w-4 h-4 text-[#0070E0]" />
          </div>
          <div className="text-2xl sm:text-3xl font-medium text-ink-strong tabular-nums">
            {activeRoadmapsCount}
          </div>
          <p className="text-[11px] text-ink-subtle truncate">
            {activeRoadmap ? activeRoadmap.verifiedRepo.fullName : 'No active roadmap'}
          </p>
        </div>

        {/* Stat 3: Hacktoberfest PR Goal */}
        <div className="rounded-xl bg-surface border border-hairline p-4 space-y-1">
          <div className="flex items-center justify-between text-ink-subtle">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              Hacktoberfest Goal
            </span>
            <Trophy className="w-4 h-4 text-[#0070E0]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-medium text-ink-strong tabular-nums">{prCount}</span>
            <span className="text-xs text-ink-subtle font-normal">/ 4 PRs</span>
          </div>
          {onUpdatePrCount && (
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-ink-subtle">Adjust count:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdatePrCount(Math.max(0, prCount - 1))}
                  className="w-5 h-5 rounded-[4px] bg-surface-2 hover:bg-hairline text-ink flex items-center justify-center font-medium border border-hairline cursor-pointer"
                  aria-label="Decrease PR count"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => onUpdatePrCount(prCount + 1)}
                  className="w-5 h-5 rounded-[4px] bg-surface-2 hover:bg-hairline text-ink flex items-center justify-center font-medium border border-hairline cursor-pointer"
                  aria-label="Increase PR count"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stat 4: Saved Resources */}
        <div className="rounded-xl bg-surface border border-hairline p-4 space-y-1">
          <div className="flex items-center justify-between text-ink-subtle">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              Saved Bookmarks
            </span>
            <Bookmark className="w-4 h-4 text-[#0070E0]" />
          </div>
          <div className="text-2xl sm:text-3xl font-medium text-ink-strong tabular-nums">
            {totalSavedCount}
          </div>
          <p className="text-[11px] text-ink-subtle truncate">
            {savedItems.length} items · {savedReposCount} repos
          </p>
        </div>
      </div>

      {/* Main Activity Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: First Pull Request Guide Checklist Progress */}
        <div className="rounded-xl bg-surface border border-hairline p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-surface-2 border border-hairline text-[#0070E0] flex items-center justify-center">
                  <GitPullRequest className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-ink-strong">First Pull Request Guide</h3>
                  <p className="text-[12px] text-ink-subtle">
                    {prGuideFinishedCount} of 10 stages completed ({Math.round((prGuideFinishedCount / 10) * 100)}%)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('pr-guide')}
                className="btn-secondary h-7 px-2.5 rounded-[8px] text-[12px] flex items-center gap-1 cursor-pointer"
              >
                <span>Open Guide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden border border-hairline">
              <div
                className="h-full bg-[#0070E0] transition-all duration-300"
                style={{ width: `${(prGuideFinishedCount / 10) * 100}%` }}
              />
            </div>

            {/* Completed Stages List (or Empty State) */}
            {prGuideFinishedCount > 0 ? (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {Object.keys(PR_GUIDE_STAGE_NAMES).map((stageNumStr) => {
                  const stageNum = parseInt(stageNumStr, 10);
                  const isDone = Boolean(prCompletedSteps[stageNum]);
                  if (!isDone) return null;

                  return (
                    <div
                      key={stageNum}
                      className="h-10 px-3 rounded-[8px] bg-surface-2 border border-hairline flex items-center gap-2.5 text-[13px] text-ink"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-mono text-[11px] font-medium text-ink-subtle shrink-0">
                        Stage {stageNum}
                      </span>
                      <span className="truncate">{PR_GUIDE_STAGE_NAMES[stageNum]}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg bg-surface-2 border border-dashed border-hairline p-6 text-center space-y-2">
                <GitPullRequest className="w-7 h-7 text-ink-subtle mx-auto" />
                <h4 className="text-[13px] font-medium text-ink-strong">No PR Guide Stages Completed Yet</h4>
                <p className="text-[12px] text-ink-subtle max-w-xs mx-auto leading-relaxed">
                  Work through the 10-stage guide covering forking, branching, committing, and opening your first pull request.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('pr-guide')}
                  className="btn-secondary h-8 px-3 rounded-[8px] text-[12px] mt-1 cursor-pointer"
                >
                  Start PR Guide &rarr;
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-hairline flex items-center justify-between text-[12px] text-ink-subtle">
            <span>Saved locally in browser</span>
            <button
              type="button"
              onClick={() => onNavigate('pr-guide')}
              className="text-[#0070E0] hover:underline font-medium cursor-pointer"
            >
              Continue from Stage {Math.min(10, prGuideFinishedCount + 1)} &rarr;
            </button>
          </div>
        </div>

        {/* Section 2: AI Contribution Roadmap Checklist Progress */}
        <div className="rounded-xl bg-surface border border-hairline p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-surface-2 border border-hairline text-[#0070E0] flex items-center justify-center">
                  <Map className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-ink-strong">Active Contribution Roadmap</h3>
                  <p className="text-[12px] text-ink-subtle">
                    {activeRoadmap
                      ? `${roadmapFinishedCount} of ${activeRoadmap.interactiveChecklist?.length || 0} checklist tasks finished`
                      : 'No roadmap generated yet'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('roadmap')}
                className="btn-secondary h-7 px-2.5 rounded-[8px] text-[12px] flex items-center gap-1 cursor-pointer"
              >
                <span>{activeRoadmap ? 'View Roadmap' : 'Create Roadmap'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Active Roadmap Card or Empty State */}
            {activeRoadmap ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-surface-2 border border-hairline space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-medium text-[#0070E0]">
                      {activeRoadmap.verifiedRepo.fullName}
                    </span>
                    <span className="badge-71">
                      {activeRoadmap.verifiedRepo.verified ? 'Verified Repo' : 'Custom Input'}
                    </span>
                  </div>
                  <h4 className="text-[13px] font-medium text-ink-strong truncate">
                    {activeRoadmap.verifiedIssue.title}
                  </h4>
                  <p className="text-[12px] text-ink-subtle line-clamp-2">
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
                          className={`h-10 px-3 rounded-[8px] border flex items-center gap-2.5 text-[12px] ${
                            isDone
                              ? 'bg-surface-2 border-hairline text-ink-subtle'
                              : 'bg-surface border-hairline text-ink'
                          }`}
                        >
                          {isDone ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                          )}
                          <span className={`truncate ${isDone ? 'line-through text-ink-subtle' : ''}`}>
                            {task.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-surface-2 border border-dashed border-hairline p-6 text-center space-y-2">
                <Map className="w-7 h-7 text-ink-subtle mx-auto" />
                <h4 className="text-[13px] font-medium text-ink-strong">No Contribution Roadmap Active</h4>
                <p className="text-[12px] text-ink-subtle max-w-xs mx-auto leading-relaxed">
                  Enter a target repository and issue URL to generate a personalized 6-stage roadmap and checklist.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('roadmap')}
                  className="btn-secondary h-8 px-3 rounded-[8px] text-[12px] mt-1 cursor-pointer"
                >
                  Create Roadmap &rarr;
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-hairline flex items-center justify-between text-[12px] text-ink-subtle">
            <span>{activeRoadmap ? 'Roadmap saved locally' : 'No active roadmap in browser'}</span>
            <button
              type="button"
              onClick={() => onNavigate('roadmap')}
              className="text-[#0070E0] hover:underline font-medium cursor-pointer"
            >
              Go to Roadmap Planner &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Recently Generated Project Ideas */}
      <div className="rounded-xl bg-surface border border-hairline p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-surface-2 border border-hairline text-[#0070E0] flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-ink-strong">Recently Generated Project Ideas</h3>
              <p className="text-[12px] text-ink-subtle">
                {recentIdeas.length > 0
                  ? `Displaying ${recentIdeas.length} project blueprints generated with Gemini`
                  : 'No project ideas generated yet'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('idea-generator')}
            className="btn-secondary h-8 px-3 rounded-[10px] text-[13px] self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#0070E0]" />
            <span>Generate New Ideas</span>
          </button>
        </div>

        {recentIdeas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {recentIdeas.slice(0, 3).map((idea, idx) => (
              <div
                key={idx}
                className="rounded-lg bg-surface-2 border border-hairline hover:border-hairline-strong p-4 space-y-3 flex flex-col justify-between transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-[4px] bg-surface border border-hairline text-ink-subtle flex items-center justify-center text-[11px] font-mono font-medium">
                      {idx + 1}
                    </span>
                    <h4 className="text-[13px] font-medium text-ink-strong truncate">{idea.title}</h4>
                  </div>
                  <p className="text-[12px] text-ink-subtle line-clamp-2 leading-relaxed">
                    {idea.shortDescription}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-hairline">
                  {idea.skillsToPractice && idea.skillsToPractice.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {idea.skillsToPractice.slice(0, 2).map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="badge-71 truncate text-[11px]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onNavigate('idea-generator')}
                    className="w-full text-center text-[12px] text-[#0070E0] hover:underline py-1 font-medium cursor-pointer"
                  >
                    View Full Specification &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-surface-2 border border-dashed border-hairline p-8 text-center space-y-2">
            <Lightbulb className="w-7 h-7 text-ink-subtle mx-auto" />
            <h4 className="text-[13px] font-medium text-ink-strong">No Project Ideas Generated Yet</h4>
            <p className="text-[12px] text-ink-subtle max-w-sm mx-auto leading-relaxed">
              Use the AI Project Idea Generator to discover custom open-source project ideas tailored to your programming language and domain.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('idea-generator')}
              className="btn-secondary h-8 px-3 rounded-[8px] text-[12px] mt-1 cursor-pointer"
            >
              Generate Project Ideas &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Section 4: Saved Bookmarks & Explanations */}
      {savedItems.length > 0 && (
        <div className="rounded-xl bg-surface border border-hairline p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-hairline pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-surface-2 border border-hairline text-[#0070E0] flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[15px] font-medium text-ink-strong">Saved Resources & Bookmarks</h3>
                <p className="text-[12px] text-ink-subtle">{savedItems.length} items saved locally</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('tracker')}
              className="btn-secondary h-7 px-2.5 rounded-[8px] text-[12px] flex items-center gap-1 cursor-pointer"
            >
              <span>Manage in Tracker</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-surface-2 border border-hairline flex items-start justify-between gap-3 text-[12px]"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="badge-71 uppercase font-mono text-[10px]">
                      {item.type}
                    </span>
                    <h4 className="font-medium text-ink-strong truncate">{item.title}</h4>
                  </div>
                  <p className="text-ink-subtle line-clamp-2 leading-relaxed">{item.summary}</p>
                </div>

                {onRemoveSavedItem && (
                  <button
                    type="button"
                    onClick={() => onRemoveSavedItem(item.id)}
                    className="text-ink-subtle hover:text-red-500 p-1 shrink-0 cursor-pointer"
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

      {/* Local Storage & Privacy Transparency Notice */}
      <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
        <div className="flex items-center gap-2 text-[12px] font-medium text-ink-strong uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-[#0070E0]" />
          Local Storage & Data Privacy Transparency
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px] text-ink-subtle leading-relaxed">
          <div className="rounded-lg bg-surface-2 p-3.5 border border-hairline space-y-1">
            <span className="font-medium text-ink-strong block">✓ Stored locally in your browser:</span>
            <ul className="space-y-1 text-ink-subtle list-disc list-inside">
              <li>Completed stages from the First Pull Request Guide</li>
              <li>Active Contribution Roadmap plan and checked tasks</li>
              <li>Recently generated project ideas & bookmarks</li>
              <li>Your Hacktoberfest PR goal counter</li>
            </ul>
          </div>

          <div className="rounded-lg bg-surface-2 p-3.5 border border-hairline space-y-1">
            <span className="font-medium text-ink-strong block">🔒 Data security:</span>
            <ul className="space-y-1 text-ink-subtle list-disc list-inside">
              <li>No personal credentials required to use features</li>
              <li>No GitHub access tokens stored in frontend</li>
              <li>All Gemini AI analysis routed through secure server endpoints</li>
              <li>You can reset or clear stored data at any time</li>
            </ul>
          </div>
        </div>

        {onResetProgress && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onResetProgress}
              className="text-[12px] text-ink-subtle hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
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
