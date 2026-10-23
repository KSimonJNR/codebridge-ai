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
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            Practical Skills for Open Source
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Open-Source Learning Center</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Master the core concepts, mental models, and safe Git workflows needed to confidently contribute to open-source software.
          </p>
        </div>

        {/* Tab Switcher: Modules vs Glossary */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSection('modules')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSection === 'modules'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Modules ({totalModules})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('glossary')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSection === 'glossary'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Glossary ({GLOSSARY_TERMS.length})</span>
          </button>
        </div>
      </div>

      {/* Progress Indicator Card (Requirement 3) */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900/95 via-purple-950/20 to-slate-900/95 border border-purple-500/30 p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold shrink-0">
              <Award className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Learning Progress
              </h3>
              <p className="text-xs text-slate-400">
                {completedCount} of {totalModules} modules completed ({progressPct}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-300">{progressPct}%</span>
              <div className="w-32 sm:w-44 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleResetProgress}
                title="Reset module completion progress"
                className="text-xs text-slate-500 hover:text-red-400 transition-colors p-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section 1: Learning Modules View */}
      {activeSection === 'modules' && (
        <div className="space-y-4">
          {LEARNING_MODULES.map((module) => {
            const isCompleted = Boolean(completedModules[module.id]);
            const isExpanded = expandedModuleId === module.id;
            const userAnswer = selectedAnswers[module.id];
            const hasAnswered = Boolean(answeredExercises[module.id]);
            const isCorrect = userAnswer === module.exercise.correctIndex;

            return (
              <div
                key={module.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg ${
                  isExpanded
                    ? 'bg-slate-900/95 border-purple-500/40'
                    : 'bg-slate-900/70 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Module Header Bar (Click to toggle expansion) */}
                <div
                  onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModuleComplete(module.id);
                      }}
                      className="mt-0.5 sm:mt-0 shrink-0 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      title={isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-600 hover:text-slate-400" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                          Module {module.moduleNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 border border-white/5 text-purple-300">
                          {module.badge}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          • {module.readTime}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white truncate">
                        {module.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {module.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModuleComplete(module.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
                      }`}
                    >
                      {isCompleted ? (
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span>Mark as Complete</span>
                      )}
                    </button>

                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Module Content (Requirement 2) */}
                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-white/5 space-y-6 animate-fadeIn">
                    {/* Part A: Human Explanation & Deep Dive */}
                    <div className="space-y-4">
                      <div className="rounded-xl bg-[#080d1a] border border-white/5 p-4 sm:p-5 space-y-2.5">
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                          Core Concept
                        </span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                          {module.explanation.coreConcept}
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed pt-1">
                          {module.explanation.deepDive}
                        </p>
                      </div>

                      {/* Key Takeaways */}
                      <div className="rounded-xl bg-purple-950/20 border border-purple-500/20 p-4 space-y-2">
                        <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                          Key Takeaways
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                          {module.explanation.keyTakeaways.map((point, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Part B: Practical Example & Real Commands */}
                    <div className="rounded-xl bg-[#080d1a] border border-white/5 p-4 sm:p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        <Terminal className="w-4 h-4" />
                        <span>Practical Example: {module.practicalExample.title}</span>
                      </div>

                      <p className="text-xs text-slate-300 italic">
                        Scenario: {module.practicalExample.scenario}
                      </p>

                      {/* Code/Commands with Explanations (Requirement 8 - Safe, explained commands) */}
                      {module.practicalExample.codeOrCommands && (
                        <div className="space-y-2 pt-1">
                          {module.practicalExample.codeOrCommands.map((item, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg bg-[#060a14] border border-white/10 p-3 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <code className="text-xs font-mono text-cyan-300">{item.cmd}</code>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.cmd)}
                                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-white/10"
                                >
                                  {copiedCmd === item.cmd ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                💡 <strong>Explanation:</strong> {item.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line pt-1">
                        {module.practicalExample.explanation}
                      </div>
                    </div>

                    {/* Part C: Small Interactive Exercise (Requirement 2) */}
                    <div className="rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 p-4 sm:p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                        <HelpCircle className="w-4 h-4 text-cyan-400" />
                        <span>Quick Check Exercise</span>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
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
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all cursor-pointer ${
                                showCorrect
                                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                                  : showWrong
                                  ? 'bg-red-950/40 border-red-500/50 text-red-200'
                                  : isSelected
                                  ? 'bg-purple-950/40 border-purple-500/50 text-white'
                                  : 'bg-[#080d1a] border-white/5 text-slate-300 hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="leading-relaxed">{opt}</span>
                              </div>

                              {showCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {hasAnswered && (
                        <div
                          className={`p-3 rounded-xl border text-xs leading-relaxed animate-fadeIn ${
                            isCorrect
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                              : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                          }`}
                        >
                          <p className="font-semibold mb-1">
                            {isCorrect ? '🎉 Correct!' : '🤔 Not quite. Here is why:'}
                          </p>
                          <p>{module.exercise.explanation}</p>
                        </div>
                      )}
                    </div>

                    {/* Part D: Contextual Feature Navigation (Requirement 6) */}
                    {module.relatedFeature && (
                      <div className="p-4 rounded-xl bg-slate-800/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                            Put this into practice
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-white">
                            {module.relatedFeature.label}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {module.relatedFeature.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onNavigateTab(module.relatedFeature!.tab)}
                          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-semibold shrink-0 shadow-md transition-all cursor-pointer"
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

      {/* Section 2: Open-Source Glossary View (Requirement 5) */}
      {activeSection === 'glossary' && (
        <div className="space-y-6">
          {/* Search & Category Filter Bar */}
          <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  placeholder="Search open-source terms, analogies, or definitions..."
                  className="w-full bg-[#080d1a] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGlossaryCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      glossaryCategory === cat
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-slate-800 text-slate-300 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Showing <strong>{filteredGlossary.length}</strong> open-source terms</span>
              {glossarySearch && (
                <button
                  type="button"
                  onClick={() => setGlossarySearch('')}
                  className="text-cyan-400 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          {/* Glossary Terms Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossary.map((term, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#080d1a] border border-white/10 p-5 space-y-3 shadow-lg hover:border-purple-500/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {term.term}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {term.category}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {term.definition}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                  {term.analogy && (
                    <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-indigo-200 leading-relaxed">
                      💡 <strong>Mental Model:</strong> {term.analogy}
                    </div>
                  )}

                  {term.example && (
                    <div className="font-mono text-[11px] text-slate-400 bg-black/40 p-2 rounded-lg border border-white/5">
                      <span className="text-slate-500">Example: </span>
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
