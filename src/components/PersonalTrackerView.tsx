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
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Your Open Source Journey
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Personal Dashboard</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Track your open-source learning milestones, Hacktoberfest progress, and review saved code explanations and issue breakdowns.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetProgress}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-500/30 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Progress
        </button>
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Hacktoberfest Progress Card */}
        <div className="rounded-2xl bg-gradient-to-br from-purple-900/30 via-slate-900/90 to-slate-900/90 border border-purple-500/30 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Hacktoberfest Goal
            </span>
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">{prCount}</span>
              <span className="text-sm text-slate-400">/ 4 PRs Merged or Reviewed</span>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (prCount / 4) * 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Update count:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdatePrCount(Math.max(0, prCount - 1))}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onUpdatePrCount(Math.min(10, prCount + 1))}
                className="w-6 h-6 rounded bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Learning Tasks Completed */}
        <div className="rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Learning Tasks
            </span>
            <CheckSquare className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">{completedTasks}</span>
              <span className="text-sm text-slate-400">/ {tasks.length} Completed ({taskPct}%)</span>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${taskPct}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
            {completedTasks === tasks.length ? '🎉 All milestones finished!' : 'Keep checking off milestones!'}
          </div>
        </div>

        {/* Saved Explanations & Items */}
        <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Saved Bookmarks
            </span>
            <Bookmark className="w-5 h-5 text-purple-400" />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">{savedItems.length}</span>
              <span className="text-sm text-slate-400">Notes & Blueprints</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Items saved from the AI Code Explainer, Issue Helper, or Idea Generator.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
            Stored locally in your browser
          </div>
        </div>
      </div>

      {/* Learning Milestones Task List */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-6 shadow-xl space-y-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            Open Source Contributor Milestones
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Check each milestone as you progress from learner to recognized open-source contributor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all cursor-pointer select-none ${
                task.completed
                  ? 'bg-purple-950/20 border-purple-500/40 text-slate-200'
                  : 'bg-[#080d1a] border-white/5 text-slate-400 hover:border-white/20'
              }`}
            >
              {task.completed ? (
                <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className={`text-xs sm:text-sm font-bold ${task.completed ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                    {task.title}
                  </h4>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-black/40 text-purple-300 border border-white/5">
                    {task.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {task.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Blueprints & Explanations */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-6 shadow-xl space-y-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-purple-400" />
            Saved Mentorship Notes & Blueprints ({savedItems.length})
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Revisit your saved explanations and game plans anytime.
          </p>
        </div>

        {savedItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-white/10 rounded-xl">
            <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-medium">No saved items yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Click the "Save" button in the Issue Helper or Idea Generator to pin blueprints here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-[#080d1a] border border-white/10 p-4 space-y-2 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'issue' && <FileCode2 className="w-4 h-4 text-purple-400" />}
                    {item.type === 'code' && <Code2 className="w-4 h-4 text-cyan-400" />}
                    {item.type === 'idea' && <Lightbulb className="w-4 h-4 text-amber-400" />}
                    <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveSavedItem(item.id)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>

                <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Saved on {item.date}</span>
                  <span className="uppercase font-semibold tracking-wider text-purple-400">
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
