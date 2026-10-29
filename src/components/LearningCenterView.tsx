import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Circle,
  HelpCircle,
  Code2,
  Terminal,
  ArrowRight,
  ExternalLink,
  Search,
  Sparkles,
  BookMarked,
  Layers,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  ShieldCheck,
  Lightbulb,
  Compass,
  GitPullRequest,
  Map,
  FileCode2,
  MessageSquare,
  Award
} from 'lucide-react';
import { ActiveTab, LearningModule, GlossaryTerm } from '../types.ts';
import { LEARNING_MODULES, GLOSSARY_TERMS } from '../data/learningCenterData.ts';

interface LearningCenterViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const LearningCenterView: React.FC<LearningCenterViewProps> = ({
  onNavigateTab,
}) => {
  const [activeSection, setActiveSection] = useState<'modules' | 'glossary'>('modules');
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(LEARNING_MODULES[0].id);

  // Safe localStorage for completed modules (Requirement 4)
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('codebridge_learning_center_completed_modules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      return {};
    }
    return {};
  });

  // Local state for user's selected exercise answers
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [answeredExercises, setAnsweredExercises] = useState<Record<string, boolean>>({});

  // Glossary search & filter
  const [glossarySearch, setGlossarySearch] = useState('');
  const [glossaryCategory, setGlossaryCategory] = useState<string>('All');

  // Copy feedback
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        'codebridge_learning_center_completed_modules',
        JSON.stringify(completedModules)
      );
    } catch {
      // ignore storage quota errors
    }
  }, [completedModules]);

  const toggleModuleComplete = (moduleId: string) => {
    setCompletedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleSelectOption = (moduleId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [moduleId]: optionIndex }));
    setAnsweredExercises((prev) => ({ ...prev, [moduleId]: true }));
  };

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset your module completion progress?')) {
      setCompletedModules({});
      setSelectedAnswers({});
      setAnsweredExercises({});
      localStorage.removeItem('codebridge_learning_center_completed_modules');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const totalModules = LEARNING_MODULES.length;
  const completedCount = Object.values(completedModules).filter(Boolean).length;
  const progressPct = Math.round((completedCount / totalModules) * 100);

  // Filter glossary
  const filteredGlossary = GLOSSARY_TERMS.filter((term) => {
    const matchesCategory = glossaryCategory === 'All' || term.category === glossaryCategory;
    const q = glossarySearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      term.term.toLowerCase().includes(q) ||
      term.definition.toLowerCase().includes(q) ||
      (term.analogy && term.analogy.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'Git', 'GitHub', 'Workflow', 'Etiquette'];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-ink-subtle text-[12px] font-medium uppercase tracking-wider mb-1">
            <GraduationCap className="w-3.5 h-3.5 text-[#0070E0]" />
            Practical Skills for Open Source
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-ink-strong tracking-tight">
            Open-Source Learning Center <span className="text-ink-subtle">· Guided Modules</span>
          </h2>
          <p className="text-[13px] text-ink-subtle mt-1 max-w-2xl leading-relaxed">
            Master the core concepts, mental models, and safe Git workflows needed to confidently contribute to open-source software.
          </p>
        </div>

        {/* Tab Switcher: Modules vs Glossary (71UI 32px controls) */}
        <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-[10px] border border-hairline self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSection('modules')}
            className={`flex items-center gap-2 h-7 px-3 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer ${
              activeSection === 'modules'
                ? 'bg-surface text-ink-strong border border-hairline shadow-sm'
                : 'text-ink-subtle hover:text-ink'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0070E0]" />
            <span>Modules ({totalModules})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('glossary')}
            className={`flex items-center gap-2 h-7 px-3 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer ${
              activeSection === 'glossary'
                ? 'bg-surface text-ink-strong border border-hairline shadow-sm'
                : 'text-ink-subtle hover:text-ink'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5 text-[#0070E0]" />
            <span>Glossary ({GLOSSARY_TERMS.length})</span>
          </button>
        </div>
      </div>

      {/* Progress Indicator Card */}
      <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-surface-2 border border-hairline text-[#0070E0] flex items-center justify-center font-medium shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-ink-strong">
                Learning Progress
              </h3>
              <p className="text-[12px] text-ink-subtle">
                {completedCount} of {totalModules} modules completed ({progressPct}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-mono font-medium text-[#0070E0] tabular-nums">{progressPct}%</span>
              <div className="w-32 sm:w-44 h-1.5 bg-surface-2 rounded-full overflow-hidden border border-hairline">
                <div
                  className="h-full bg-[#0070E0] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleResetProgress}
                title="Reset module completion progress"
                className="text-[12px] text-ink-subtle hover:text-red-500 transition-colors p-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section 1: Learning Modules View */}
      {activeSection === 'modules' && (
        <div className="space-y-3">
          {LEARNING_MODULES.map((module) => {
            const isCompleted = Boolean(completedModules[module.id]);
            const isExpanded = expandedModuleId === module.id;
            const userAnswer = selectedAnswers[module.id];
            const hasAnswered = Boolean(answeredExercises[module.id]);
            const isCorrect = userAnswer === module.exercise.correctIndex;

            return (
              <div
                key={module.id}
                className={`rounded-xl border transition-colors overflow-hidden ${
                  isExpanded
                    ? 'bg-surface border-hairline-strong'
                    : 'bg-surface border-hairline hover:border-hairline-strong'
                }`}
              >
                {/* Module Header Bar (Click to toggle expansion) */}
                <div
                  onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModuleComplete(module.id);
                      }}
                      className="mt-0.5 sm:mt-0 shrink-0 text-ink-subtle hover:text-emerald-500 transition-colors cursor-pointer"
                      title={isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-ink-subtle" />
                      )}
                    </button>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-medium text-[#0070E0]">
                          Module {module.moduleNumber}
                        </span>
                        <span className="badge-71 text-[10px]">
                          {module.badge}
                        </span>
                        <span className="text-[11px] text-ink-subtle">
                          · {module.readTime}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-medium text-ink-strong truncate">
                        {module.title}
                      </h3>
                      <p className="text-[12px] text-ink-subtle line-clamp-1">
                        {module.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-hairline">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModuleComplete(module.id);
                      }}
                      className={`h-8 px-3 rounded-[10px] text-[12px] font-medium border transition-colors cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'btn-secondary'
                      }`}
                    >
                      {isCompleted ? (
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span>Mark Done</span>
                      )}
                    </button>

                    <div className="w-7 h-7 rounded-[6px] bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Module Content */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-hairline space-y-4">
                    {/* Part A: Human Explanation & Deep Dive */}
                    <div className="space-y-3">
                      <div className="rounded-lg bg-surface-2 border border-hairline p-4 space-y-2">
                        <span className="text-[11px] font-medium text-[#0070E0] uppercase tracking-wider block">
                          Core Concept
                        </span>
                        <p className="text-[13px] text-ink-strong leading-relaxed font-medium">
                          {module.explanation.coreConcept}
                        </p>
                        <p className="text-[12px] text-ink-subtle leading-relaxed pt-1">
                          {module.explanation.deepDive}
                        </p>
                      </div>

                      {/* Key Takeaways */}
                      <div className="rounded-lg bg-surface-2 border border-hairline p-4 space-y-2">
                        <span className="text-[11px] font-medium text-ink-strong uppercase tracking-wider block">
                          Key Takeaways
                        </span>
                        <ul className="space-y-1 text-[12px] text-ink-subtle list-disc list-inside">
                          {module.explanation.keyTakeaways.map((point, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Part B: Practical Example & Real Commands */}
                    <div className="rounded-lg bg-surface-2 border border-hairline p-4 space-y-3">
                      <div className="flex items-center gap-2 text-[12px] font-medium text-ink-strong">
                        <Terminal className="w-4 h-4 text-[#0070E0]" />
                        <span>Practical Example: {module.practicalExample.title}</span>
                      </div>

                      <p className="text-[12px] text-ink-subtle italic">
                        Scenario: {module.practicalExample.scenario}
                      </p>

                      {/* Code/Commands with Explanations */}
                      {module.practicalExample.codeOrCommands && (
                        <div className="space-y-2 pt-1">
                          {module.practicalExample.codeOrCommands.map((item, idx) => (
                            <div
                              key={idx}
                              className="rounded-[8px] bg-surface border border-hairline p-3 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <code className="text-[12px] font-mono text-[#0070E0] font-medium">{item.cmd}</code>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.cmd)}
                                  className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-surface-2 text-ink-subtle hover:text-ink border border-hairline cursor-pointer"
                                >
                                  {copiedCmd === item.cmd ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <p className="text-[12px] text-ink-subtle">
                                <strong className="font-medium text-ink">Explanation:</strong> {item.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-[12px] text-ink-subtle leading-relaxed whitespace-pre-line pt-1">
                        {module.practicalExample.explanation}
                      </div>
                    </div>

                    {/* Part C: Small Interactive Exercise */}
                    <div className="rounded-lg bg-surface-2 border border-hairline p-4 space-y-3">
                      <div className="flex items-center gap-2 text-[12px] font-medium text-ink-strong">
                        <HelpCircle className="w-4 h-4 text-[#0070E0]" />
                        <span>Quick Check Exercise</span>
                      </div>

                      <p className="text-[13px] font-medium text-ink-strong leading-relaxed">
                        {module.exercise.prompt}
                      </p>

                      <div className="space-y-2 pt-1">
                        {module.exercise.options.map((opt, optIdx) => {
                          const isSelected = userAnswer === optIdx;
                          const showCorrect = hasAnswered && optIdx === module.exercise.correctIndex;
                          const showWrong = hasAnswered && isSelected && !isCorrect;

                          return (
                            <div
                              key={optIdx}
                              onClick={() => handleSelectOption(module.id, optIdx)}
                              className={`p-3 rounded-[8px] border text-[12px] flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                showCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                  : showWrong
                                  ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                                  : isSelected
                                  ? 'bg-[#0070E0]/10 border-[#0070E0] text-ink-strong'
                                  : 'bg-surface border-hairline text-ink hover:border-hairline-strong'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-[4px] bg-surface-2 text-ink-subtle flex items-center justify-center text-[10px] font-mono font-medium shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="leading-relaxed">{opt}</span>
                              </div>

                              {showCorrect && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {hasAnswered && (
                        <div
                          className={`p-3 rounded-[8px] border text-[12px] leading-relaxed ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          <p className="font-medium mb-1">
                            {isCorrect ? '✓ Correct!' : 'Not quite. Here is why:'}
                          </p>
                          <p>{module.exercise.explanation}</p>
                        </div>
                      )}
                    </div>

                    {/* Part D: Contextual Feature Navigation */}
                    {module.relatedFeature && (
                      <div className="p-3.5 rounded-lg bg-surface border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-[#0070E0]">
                            Put this into practice
                          </span>
                          <h4 className="text-[13px] font-medium text-ink-strong">
                            {module.relatedFeature.label}
                          </h4>
                          <p className="text-[12px] text-ink-subtle">
                            {module.relatedFeature.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onNavigateTab(module.relatedFeature!.tab)}
                          className="btn-primary h-8 px-3 rounded-[10px] text-[12px] self-start sm:self-auto flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <span>Launch Feature</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Section 2: Open-Source Glossary View */}
      {activeSection === 'glossary' && (
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="rounded-xl bg-surface border border-hairline p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  placeholder="Search open-source terms, analogies, or definitions..."
                  className="input-71 pl-9 font-mono text-[13px]"
                />
              </div>

              {/* Category Pills (71UI 32px height buttons, 10px radius) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGlossaryCategory(cat)}
                    className={`h-8 px-3 rounded-[10px] text-[12px] font-medium border transition-colors cursor-pointer ${
                      glossaryCategory === cat
                        ? 'bg-surface-2 text-ink-strong border-hairline-strong shadow-xs'
                        : 'bg-surface text-ink-subtle border-hairline hover:text-ink'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[12px] text-ink-subtle pt-1">
              <span>Showing <strong className="text-ink font-medium">{filteredGlossary.length}</strong> open-source terms</span>
              {glossarySearch && (
                <button
                  type="button"
                  onClick={() => setGlossarySearch('')}
                  className="text-[#0070E0] hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          {/* Glossary Terms Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredGlossary.map((term, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-surface border border-hairline p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[14px] font-medium text-ink-strong">
                      {term.term}
                    </h3>
                    <span className="badge-71 text-[10px] font-mono uppercase">
                      {term.category}
                    </span>
                  </div>

                  <p className="text-[13px] text-ink leading-relaxed">
                    {term.definition}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-hairline text-[12px]">
                  {term.analogy && (
                    <div className="p-2.5 rounded-[6px] bg-surface-2 border border-hairline text-ink-subtle leading-relaxed">
                      💡 <strong className="font-medium text-ink">Mental Model:</strong> {term.analogy}
                    </div>
                  )}

                  {term.example && (
                    <div className="font-mono text-[11px] text-ink-subtle bg-surface-2 p-2 rounded-[6px] border border-hairline">
                      <span className="text-ink-subtle">Example: </span>
                      {term.example}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
