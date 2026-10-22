import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { CodeExplainerView } from './components/CodeExplainerView.tsx';
import { IssueHelperView } from './components/IssueHelperView.tsx';
import { PrGuideView } from './components/PrGuideView.tsx';
import { IdeaGeneratorView } from './components/IdeaGeneratorView.tsx';
import { RepoFinderView } from './components/RepoFinderView.tsx';
import { RoadmapView } from './components/RoadmapView.tsx';
import { ChatMentorView } from './components/ChatMentorView.tsx';
import { PersonalTrackerView } from './components/PersonalTrackerView.tsx';
import { ApiKeyModal } from './components/ApiKeyModal.tsx';
import { ActiveTab, ServerStatus, LearningTask, SavedItem, ProjectIdea } from './types.ts';
import { AlertTriangle, Sparkles, Heart, Github, Terminal } from 'lucide-react';

const DEFAULT_TASKS: LearningTask[] = [
  {
    id: 'task-1',
    title: 'Configure Git & SSH Key',
    category: 'Git',
    completed: true,
    description: 'Set your name, email, and SSH credentials in terminal.',
  },
  {
    id: 'task-2',
    title: 'Fork an Open-Source Repository',
    category: 'GitHub',
    completed: true,
    description: 'Create a personal copy under your GitHub account.',
  },
  {
    id: 'task-3',
    title: 'Add Upstream Remote',
    category: 'Git',
    completed: false,
    description: 'Keep your local fork in sync with the original maintainer repo.',
  },
  {
    id: 'task-4',
    title: 'Understand Code with AI Explainer',
    category: 'Code',
    completed: false,
    description: 'Deconstruct a foreign utility function or algorithm before editing.',
  },
  {
    id: 'task-5',
    title: 'Solve a "Good First Issue"',
    category: 'GitHub',
    completed: false,
    description: 'Implement a bugfix or documentation tweak on a separate branch.',
  },
  {
    id: 'task-6',
    title: 'Pass Local Tests & Linters',
    category: 'Code',
    completed: false,
    description: 'Verify your changes locally before opening a pull request.',
  },
  {
    id: 'task-7',
    title: 'Open Your First Pull Request',
    category: 'PR',
    completed: false,
    description: 'Submit your branch with a polite description linking the issue.',
  },
  {
    id: 'task-8',
    title: 'Address Code Review Feedback',
    category: 'PR',
    completed: false,
    description: 'Work with the maintainer and get your PR approved and merged!',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  // LocalStorage state: Tasks
  const [tasks, setTasks] = useState<LearningTask[]>(() => {
    const saved = localStorage.getItem('codebridge_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_TASKS;
      }
    }
    return DEFAULT_TASKS;
  });

  // LocalStorage state: Saved items
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    const saved = localStorage.getItem('codebridge_saved_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // LocalStorage state: PR count
  const [prCount, setPrCount] = useState<number>(() => {
    const saved = localStorage.getItem('codebridge_pr_count');
    if (saved) {
      const parsed = parseInt(saved, 10);
      return isNaN(parsed) ? 1 : parsed;
    }
    return 1;
  });

  // Check server status
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.warn('Could not connect to server status endpoint', err);
      setStatus({ configured: false, model: 'gemini-3.8-flash', ready: false });
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    localStorage.setItem('codebridge_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('codebridge_saved_items', JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    localStorage.setItem('codebridge_pr_count', prCount.toString());
  }, [prCount]);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleSaveItem = (title: string, summary: string, details: any, type: 'issue' | 'code' | 'idea' | 'repo' | 'roadmap' = 'issue') => {
    const newItem: SavedItem = {
      id: `saved-${Date.now()}`,
      type,
      title,
      summary,
      date: new Date().toLocaleDateString(),
      details,
    };
    setSavedItems((prev) => [newItem, ...prev]);
  };

  const handleSaveIdea = (idea: ProjectIdea) => {
    handleSaveItem(
      idea.title,
      `${idea.shortDescription} — Stack: ${(idea.suggestedTechnologies || []).join(', ')}`,
      idea,
      'idea'
    );
  };

  const handleRemoveSavedItem = (id: string) => {
    setSavedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleResetProgress = () => {
    if (window.confirm('Reset all task milestones and PR counters to default?')) {
      setTasks(DEFAULT_TASKS);
      setPrCount(0);
      localStorage.removeItem('codebridge_tasks');
      localStorage.removeItem('codebridge_pr_count');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans">
      {/* Top Banner if API Key is not configured */}
      {status && !status.configured && (
        <div className="bg-amber-950/70 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>GEMINI_API_KEY Not Configured:</strong> Add your Gemini API key in the AI Studio <strong>Secrets</strong> panel or server <code className="font-mono text-amber-300">.env</code> to activate live AI answers.
              </span>
            </div>
            <button
              onClick={() => setKeyModalOpen(true)}
              className="underline font-semibold hover:text-white shrink-0 cursor-pointer"
            >
              How to Setup &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
        onOpenKeyInfo={() => setKeyModalOpen(true)}
        savedCount={savedItems.length}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLoadQuickCode={() => {
              setActiveTab('explainer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLoadQuickIssue={() => {
              setActiveTab('issue-helper');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            prCount={prCount}
            tasks={tasks}
            savedItems={savedItems}
            onToggleTask={toggleTask}
            onUpdatePrCount={setPrCount}
            onResetProgress={handleResetProgress}
            onRemoveSavedItem={handleRemoveSavedItem}
          />
        )}

        {activeTab === 'explainer' && (
          <CodeExplainerView
            onOpenKeyInfo={() => setKeyModalOpen(true)}
          />
        )}

        {activeTab === 'issue-helper' && (
          <IssueHelperView
            onOpenKeyInfo={() => setKeyModalOpen(true)}
            onSaveItem={(title, summary, details) => handleSaveItem(title, summary, details, 'issue')}
          />
        )}

        {activeTab === 'pr-guide' && (
          <PrGuideView
            onOpenKeyInfo={() => setKeyModalOpen(true)}
          />
        )}

        {activeTab === 'idea-generator' && (
          <IdeaGeneratorView
            onOpenKeyInfo={() => setKeyModalOpen(true)}
            onSaveIdea={handleSaveIdea}
          />
        )}

        {activeTab === 'repo-finder' && (
          <RepoFinderView
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSaveRepo={(title, summary, details) => handleSaveItem(title, summary, details, 'repo')}
          />
        )}

        {activeTab === 'roadmap' && (
          <RoadmapView
            onOpenKeyInfo={() => setKeyModalOpen(true)}
            onSaveItem={(title, summary, details) => handleSaveItem(title, summary, details, 'roadmap')}
          />
        )}

        {activeTab === 'chat-mentor' && (
          <ChatMentorView
            onOpenKeyInfo={() => setKeyModalOpen(true)}
          />
        )}

        {activeTab === 'tracker' && (
          <PersonalTrackerView
            tasks={tasks}
            onToggleTask={toggleTask}
            savedItems={savedItems}
            onRemoveSavedItem={handleRemoveSavedItem}
            prCount={prCount}
            onUpdatePrCount={setPrCount}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#060911]/90 py-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">CodeBridge AI</span>
            <span>•</span>
            <span>Empowering beginners in open source & Hacktoberfest</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-400">Powered by Gemini 3.8 Flash</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400/80">Server-Side Protected</span>
          </div>
        </div>
      </footer>

      {/* Key Config Modal */}
      <ApiKeyModal
        isOpen={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        onRecheck={checkStatus}
      />
    </div>
  );
}
