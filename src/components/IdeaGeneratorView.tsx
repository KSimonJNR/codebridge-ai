import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  Layers,
  CheckCircle2,
  BookmarkPlus,
  BookmarkCheck,
  Code2,
  Terminal,
  Target,
  Copy,
  Check,
  Info,
  RefreshCw,
  FolderGit2,
  Users,
  Cpu,
  Compass,
  FileText,
  Workflow,
  Share2,
  HeartHandshake
} from 'lucide-react';
import { ProjectIdea } from '../types.ts';

interface IdeaGeneratorViewProps {
  onOpenKeyInfo: () => void;
  onSaveIdea?: (idea: ProjectIdea) => void;
}

const PRESET_INTERESTS = [
  'Community Tools',
  'AI',
  'Education',
  'Healthcare',
  'Productivity',
  'Climate',
];

export const IdeaGeneratorView: React.FC<IdeaGeneratorViewProps> = ({
  onOpenKeyInfo,
  onSaveIdea,
}) => {
  // User Inputs (Requirements 1-5)
  const [experience, setExperience] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [language, setLanguage] = useState<'Python' | 'JavaScript' | 'TypeScript' | 'Java' | 'Other'>('TypeScript');
  const [selectedInterest, setSelectedInterest] = useState<string>('Community Tools');
  const [customInterest, setCustomInterest] = useState<string>('');
  const [projectType, setProjectType] = useState<'Web app' | 'AI assistant' | 'Developer tool' | 'Automation'>('Web app');
  const [customIdeaDescription, setCustomIdeaDescription] = useState<string>('');

  // Execution states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<ProjectIdea[]>(() => {
    const saved = localStorage.getItem('codebridge_cached_ideas');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Local persistence for saved ideas (Requirement: Persist saved ideas locally)
  const [savedIdeas, setSavedIdeas] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('codebridge_saved_ideas');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const map: Record<string, boolean> = {};
        parsed.forEach((item: { title: string }) => {
          if (item.title) map[item.title] = true;
        });
        return map;
      } catch {
        return {};
      }
    }
    return {};
  });

  // Copy feedback state
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (ideas.length > 0) {
      localStorage.setItem('codebridge_cached_ideas', JSON.stringify(ideas));
    }
  }, [ideas]);

  const activeInterestValue = selectedInterest === 'Custom'
    ? (customInterest.trim() || 'General Community Tools')
    : selectedInterest;

  const handleGenerate = async () => {
    // Input validation
    if (selectedInterest === 'Custom' && !customInterest.trim()) {
      setError('Please specify your custom interest or select one of the preset topics.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience,
          language,
          interests: activeInterestValue,
          projectType,
          customIdeaDescription: customIdeaDescription.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.keyMissing) {
          onOpenKeyInfo();
        }
        throw new Error(data.error || 'Failed to generate project ideas.');
      }

      setIdeas(data.ideas || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating project ideas.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (idea: ProjectIdea) => {
    // Save to localStorage
    const existing: ProjectIdea[] = JSON.parse(localStorage.getItem('codebridge_saved_ideas') || '[]');
    const isAlreadySaved = existing.some((item) => item.title === idea.title);

    let updated: ProjectIdea[];
    if (isAlreadySaved) {
      updated = existing.filter((item) => item.title !== idea.title);
      setSavedIdeas((prev) => ({ ...prev, [idea.title]: false }));
    } else {
      updated = [idea, ...existing];
      setSavedIdeas((prev) => ({ ...prev, [idea.title]: true }));
    }

    localStorage.setItem('codebridge_saved_ideas', JSON.stringify(updated));

    // Also notify parent for personal dashboard synchronization
    if (onSaveIdea && !isAlreadySaved) {
      onSaveIdea(idea);
    }
  };

  const handleCopyMarkdown = (idea: ProjectIdea, index: number) => {
    const md = `# ${idea.title}

> ${idea.shortDescription}

## Problem Solved
${idea.problemSolved}

## Target Audience
${idea.targetAudience}

## Suggested Technologies
${idea.suggestedTechnologies.map((t) => `- ${t}`).join('\n')}

## Core Features
${idea.coreFeatures.map((f) => `- ${f}`).join('\n')}

## MVP Roadmap
${idea.mvpRoadmap.map((m) => `- **${m.phase}**: ${m.milestone}`).join('\n')}

## AI Feature
${idea.aiFeature}

## Beginner Next Steps
${idea.beginnerNextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Recommended README Sections
${idea.readmeSections.map((sec) => `### ${sec.heading}\n${sec.content}`).join('\n\n')}

---
*Generated with CodeBridge AI for Hacktoberfest*
`;

    navigator.clipboard.writeText(md);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Hacktoberfest Project Incubator
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">AI Project Idea Generator</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Discover tailored, portfolio-worthy open-source project concepts designed for your skill level, complete with core features, MVP roadmaps, and README blueprints.
          </p>
        </div>

        {ideas.length > 0 && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-white/10 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Generate Another Set</span>
          </button>
        )}
      </div>

      {/* Input Configuration Panel (Requirements 1-5) */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 sm:p-7 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Programming Experience */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              1. Programming Experience:
            </label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value as any)}
              className="w-full bg-[#080d1a] border border-white/10 text-cyan-300 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
            >
              <option value="Beginner">Beginner (First-time open source)</option>
              <option value="Intermediate">Intermediate (Building full apps)</option>
              <option value="Advanced">Advanced (High-scale & architecture)</option>
            </select>
          </div>

          {/* 2. Preferred Programming Language */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              2. Preferred Language:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full bg-[#080d1a] border border-white/10 text-cyan-300 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
            >
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="TypeScript">TypeScript</option>
              <option value="Java">Java</option>
              <option value="Other">Other (Go, Rust, etc.)</option>
            </select>
          </div>

          {/* 3. Project Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              3. Project Type:
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as any)}
              className="w-full bg-[#080d1a] border border-white/10 text-cyan-300 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
            >
              <option value="Web app">Web app</option>
              <option value="AI assistant">AI assistant</option>
              <option value="Developer tool">Developer tool</option>
              <option value="Automation">Automation / CLI</option>
            </select>
          </div>

          {/* 4. Domain & Interests Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              4. Core Interest / Domain:
            </label>
            <select
              value={selectedInterest}
              onChange={(e) => setSelectedInterest(e.target.value)}
              className="w-full bg-[#080d1a] border border-white/10 text-cyan-300 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
            >
              {PRESET_INTERESTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
              <option value="Custom">Custom Interest...</option>
            </select>
          </div>
        </div>

        {/* Custom Interest Input (shown if Custom selected) */}
        {selectedInterest === 'Custom' && (
          <div className="pt-2 animate-fadeIn">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Specify Your Custom Interest / Topic:
            </label>
            <input
              type="text"
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              placeholder="e.g. Markdown notes, accessibility checkers, marine biology, gaming discord bots"
              className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
            />
          </div>
        )}

        {/* 5. Optional Description / Ideas of the User */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            5. Optional Description or Ideas (constraints, existing inspiration, or API preferences):
          </label>
          <textarea
            value={customIdeaDescription}
            onChange={(e) => setCustomIdeaDescription(e.target.value)}
            placeholder="e.g. I want to build a lightweight tool with a fast CLI and no heavy database setup, or integrate with GitHub's public API..."
            rows={3}
            className="w-full bg-[#080d1a] border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-y leading-relaxed font-mono"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/10">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Generates 3 full open-source project proposals tailored to your criteria
          </span>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:shadow-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Crafting Project Blueprints with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Generate Project Ideas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Friendly Error Display */}
      {error && (
        <div className="rounded-xl bg-red-950/40 border border-red-500/40 p-4 text-red-200 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-300">Generation Failed</p>
            <p className="text-slate-300">{error}</p>
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer (Requirement: Label generated content as AI suggestions, not verified project requirements) */}
      {ideas.length > 0 && (
        <div className="rounded-xl bg-indigo-950/30 border border-indigo-500/30 p-3.5 flex items-start gap-3 text-xs text-indigo-200">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Advisory:</strong> These project concepts are AI-generated suggestions to inspire your Hacktoberfest portfolio and open-source contributions. They are conceptual blueprints, not pre-verified project requirements. Feel free to adapt the scope, libraries, or architecture to fit your learning goals!
          </p>
        </div>
      )}

      {/* Empty State */}
      {ideas.length === 0 && !loading && (
        <div className="rounded-2xl bg-slate-900/60 border border-dashed border-white/15 p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
            <Lightbulb className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Ready to Discover Ideas</h3>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
            Configure your experience level, favorite programming language, and interests above, then click <strong>"Generate Project Ideas"</strong> to create 3 full repository blueprints.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            Generate Ideas for {language} ({experience}) &rarr;
          </button>
        </div>
      )}

      {/* 3 Generated Project Cards */}
      {ideas.length > 0 && (
        <div className="space-y-8 animate-fadeIn">
          {ideas.map((idea, index) => {
            const isSaved = Boolean(savedIdeas[idea.title]);

            return (
              <div
                key={index}
                className="rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-white/10 p-6 sm:p-7 shadow-2xl space-y-6 hover:border-purple-500/40 transition-all"
              >
                {/* Top Idea Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-500 to-cyan-500 text-white flex items-center justify-center text-xs font-extrabold">
                        {index + 1}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {idea.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        {projectType}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base font-medium text-cyan-300">
                      {idea.shortDescription}
                    </p>
                  </div>

                  {/* Actions: Save & Copy (Requirements) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSave(idea)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 hover:text-white border-white/10 hover:border-purple-400'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Saved to Dashboard</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Save Idea</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyMarkdown(idea, index)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors cursor-pointer"
                      title="Copy full markdown proposal"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied Markdown</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Spec</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Problem Solved & Target Audience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[#080d1a] border border-white/5 p-4 space-y-1">
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      The Problem It Solves
                    </span>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {idea.problemSolved}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#080d1a] border border-white/5 p-4 space-y-1">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Who Would Benefit
                    </span>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {idea.targetAudience}
                    </p>
                  </div>
                </div>

                {/* Suggested Technologies */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    Suggested Technologies & Stack
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {idea.suggestedTechnologies.map((tech, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-cyan-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Core Features & AI Feature */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[#080d1a] border border-white/5 p-4 space-y-2">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      3–5 Core Features
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                      {idea.coreFeatures.map((feat, fIdx) => (
                        <li key={fIdx} className="leading-relaxed">
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl bg-purple-950/20 border border-purple-500/30 p-4 space-y-2">
                    <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      Recommended AI Enhancement
                    </span>
                    <p className="text-xs text-purple-100 leading-relaxed">
                      {idea.aiFeature}
                    </p>
                  </div>
                </div>

                {/* MVP Roadmap */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Workflow className="w-4 h-4 text-cyan-400" />
                    Simple MVP Development Roadmap
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {idea.mvpRoadmap.map((road, rIdx) => (
                      <div
                        key={rIdx}
                        className="rounded-xl bg-[#060a14] border border-white/5 p-3 space-y-1"
                      >
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                          {road.phase}
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {road.milestone}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Beginner-friendly Next Steps */}
                <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-4 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    Beginner-Friendly Next Steps
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {idea.beginnerNextSteps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-black/30 border border-white/5 rounded-lg p-2.5 text-xs text-slate-200 flex items-start gap-2"
                      >
                        <span className="font-bold text-emerald-400 shrink-0">{sIdx + 1}.</span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested GitHub README Sections */}
                <div className="rounded-xl bg-[#060a14] border border-white/10 p-4 space-y-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-400" />
                    Suggested GitHub README.md Blueprint
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {idea.readmeSections.map((sec, secIdx) => (
                      <div
                        key={secIdx}
                        className="rounded-lg bg-[#080d1a] border border-white/5 p-3 space-y-1 text-xs"
                      >
                        <span className="font-mono font-bold text-cyan-300 text-[11px]">
                          ## {sec.heading}
                        </span>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          {sec.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
