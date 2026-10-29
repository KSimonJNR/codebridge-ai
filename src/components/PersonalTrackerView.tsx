import React from 'react';
import {
  CheckSquare,
  Square,
  Bookmark,
  Trash2,
  Trophy,
  Sparkles,
  GitPullRequest,
  Code2,
  FileCode2,
  Lightbulb,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { LearningTask, SavedItem } from '../types.ts';

interface PersonalTrackerViewProps {
  tasks: LearningTask[];
  onToggleTask: (taskId: string) => void;
  savedItems: SavedItem[];
  onRemoveSavedItem: (itemId: string) => void;
  prCount: number;
  onUpdatePrCount: (count: number) => void;
  onResetProgress: () => void;
}

export const PersonalTrackerView: React.FC<PersonalTrackerViewProps> = ({
  tasks,
  onToggleTask,
  savedItems,
  onRemoveSavedItem,
  prCount,
  onUpdatePrCount,
  onResetProgress,
}) => {
  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskPct = Math.round((completedTasks / (tasks.length || 1)) * 100);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Your Open Source Journey</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-normal tracking-tight">
            <span className="font-medium text-ink-strong">Personal Dashboard</span>{' '}
            <span className="font-normal text-ink-subtle">· Milestones & tracker</span>
          </h2>
          <p className="text-[13px] text-ink-subtle mt-1 max-w-2xl leading-relaxed">
            Track your open-source learning milestones, Hacktoberfest progress, and review saved code explanations and issue breakdowns.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetProgress}
          className="self-start sm:self-auto h-8 px-3 rounded-[10px] text-[12px] font-medium bg-surface-2 hover:bg-surface text-ink-subtle hover:text-rose-500 border border-hairline transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Progress</span>
        </button>
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Hacktoberfest Progress Card */}
        <div className="card-71 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              Hacktoberfest Goal
            </span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium tracking-tight text-ink-strong font-mono tabular-nums">{prCount}</span>
              <span className="text-[12px] text-ink-subtle font-mono tabular-nums">/ 4 PRs Merged</span>
            </div>

            <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden border border-hairline">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${Math.min(100, (prCount / 4) * 100)}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-hairline flex items-center justify-between text-[12px]">
            <span className="text-ink-subtle">Update count:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdatePrCount(Math.max(0, prCount - 1))}
                className="w-7 h-7 rounded-[8px] bg-surface-2 hover:bg-surface text-ink border border-hairline flex items-center justify-center font-mono text-[13px] cursor-pointer"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onUpdatePrCount(Math.min(10, prCount + 1))}
                className="w-7 h-7 rounded-[8px] bg-accent hover:bg-accent-hover text-white flex items-center justify-center font-mono text-[13px] cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Learning Tasks Completed */}
        <div className="card-71 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              Learning Tasks
            </span>
            <CheckSquare className="w-4 h-4 text-accent" />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium tracking-tight text-ink-strong font-mono tabular-nums">{completedTasks}</span>
              <span className="text-[12px] text-ink-subtle font-mono tabular-nums">/ {tasks.length} Completed ({taskPct}%)</span>
            </div>

            <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden border border-hairline">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${taskPct}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-hairline text-[12px] text-ink-subtle">
            {completedTasks === tasks.length ? 'All milestones finished' : 'Keep checking off milestones'}
          </div>
        </div>

        {/* Saved Explanations & Items */}
        <div className="card-71 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              Saved Bookmarks
            </span>
            <Bookmark className="w-4 h-4 text-accent" />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium tracking-tight text-ink-strong font-mono tabular-nums">{savedItems.length}</span>
              <span className="text-[12px] text-ink-subtle">Notes & Blueprints</span>
            </div>
            <p className="text-[12px] text-ink-subtle leading-relaxed">
              Items saved from the AI Code Explainer, Issue Helper, or Idea Generator.
            </p>
          </div>

          <div className="pt-3 border-t border-hairline text-[12px] text-ink-subtle">
            Stored locally in your browser
          </div>
        </div>
      </div>

      {/* Learning Milestones Task List */}
      <div className="card-71 p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base font-medium text-ink-strong flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-accent" />
            <span>Open Source Contributor Milestones</span>
          </h3>
          <p className="text-[12px] text-ink-subtle mt-0.5">
            Check each milestone as you progress from learner to recognized open-source contributor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className={`p-3.5 rounded-[10px] border flex items-start gap-3 transition-colors cursor-pointer select-none ${
                task.completed
                  ? 'bg-surface-2 border-hairline text-ink-subtle'
                  : 'bg-surface-2 border-hairline text-ink hover:bg-surface'
              }`}
            >
              {task.completed ? (
                <CheckSquare className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-ink-subtle shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className={`text-[13px] font-medium ${task.completed ? 'text-ink-subtle line-through' : 'text-ink-strong'}`}>
                    {task.title}
                  </h4>
                  <span className="badge-71 text-[10px]">
                    {task.category}
                  </span>
                </div>
                <p className="text-[12px] text-ink-subtle leading-relaxed">
                  {task.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Blueprints & Explanations */}
      <div className="card-71 p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base font-medium text-ink-strong flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-accent" />
            <span>Saved Mentorship Notes & Blueprints</span>
            <span className="font-mono text-[12px] text-ink-subtle">({savedItems.length})</span>
          </h3>
          <p className="text-[12px] text-ink-subtle mt-0.5">
            Revisit your saved explanations and game plans anytime.
          </p>
        </div>

        {savedItems.length === 0 ? (
          <div className="p-8 text-center text-ink-subtle border border-hairline border-dashed rounded-[10px]">
            <Bookmark className="w-6 h-6 text-ink-subtle mx-auto mb-2" />
            <p className="text-[13px] font-medium text-ink">No saved items yet.</p>
            <p className="text-[12px] text-ink-subtle mt-1">
              Click the "Save" button in the Issue Helper or Idea Generator to pin blueprints here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-[10px] bg-surface-2 border border-hairline p-4 space-y-2 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'issue' && <FileCode2 className="w-4 h-4 text-accent" />}
                    {item.type === 'code' && <Code2 className="w-4 h-4 text-accent" />}
                    {item.type === 'idea' && <Lightbulb className="w-4 h-4 text-amber-500" />}
                    <h4 className="text-[13px] font-medium text-ink-strong line-clamp-1">{item.title}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveSavedItem(item.id)}
                    className="text-ink-subtle hover:text-rose-500 p-1 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[12px] text-ink line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>

                <div className="pt-2 text-[11px] text-ink-subtle flex items-center justify-between border-t border-hairline/60">
                  <span className="font-mono tabular-nums">Saved on {item.date}</span>
                  <span className="badge-71 uppercase text-[10px]">
                    {item.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
