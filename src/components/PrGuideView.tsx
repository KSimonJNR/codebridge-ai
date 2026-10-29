import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  GitFork,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  CheckSquare,
  Square,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Bot,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Compass,
  FileCheck,
  GitBranch,
  UploadCloud,
  CheckCheck
} from 'lucide-react';

interface PrGuideViewProps {
  onOpenKeyInfo?: () => void;
}

interface PrStage {
  id: number;
  stageName: string;
  title: string;
  summary: string;
  goal: string;
  docUrl: string;
  docLabel: string;
  commands?: Array<{
    cmd: string;
    explanation: string;
  }>;
  commonMistakes: string[];
  maintainerTip: string;
}

export const PrGuideView: React.FC<PrGuideViewProps> = ({ onOpenKeyInfo }) => {
  // Reactive inputs for dynamic CLI generation
  const [gitUser, setGitUser] = useState(() => localStorage.getItem('codebridge_pr_user') || 'octocat');
  const [gitRepo, setGitRepo] = useState(() => localStorage.getItem('codebridge_pr_repo') || 'facebook/react');
  const [gitBranch, setGitBranch] = useState(() => localStorage.getItem('codebridge_pr_branch') || 'fix/readme-typo');
  const [commitMessage, setCommitMessage] = useState('docs: fix typo in installation guide');
  const [issueNumber, setIssueNumber] = useState('142');

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Local storage for completed stages (Interactive Checklist)
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>(() => {
    const saved = localStorage.getItem('codebridge_pr_guide_completed_steps');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { 1: true, 2: true };
      }
    }
    return { 1: true, 2: true };
  });

  // Stage expansion & AI Mentor states
  const [activeStageId, setActiveStageId] = useState<number>(3); // Default open to Stage 3 or 4
  const [mentorOpenStageId, setMentorOpenStageId] = useState<number | null>(null);
  const [mentorQuestions, setMentorQuestions] = useState<Record<number, string>>({});
  const [mentorResponses, setMentorResponses] = useState<Record<number, { text: string; loading: boolean; error?: string }>>({});

  useEffect(() => {
    localStorage.setItem('codebridge_pr_user', gitUser);
  }, [gitUser]);

  useEffect(() => {
    localStorage.setItem('codebridge_pr_repo', gitRepo);
  }, [gitRepo]);

  useEffect(() => {
    localStorage.setItem('codebridge_pr_branch', gitBranch);
  }, [gitBranch]);

  useEffect(() => {
    localStorage.setItem('codebridge_pr_guide_completed_steps', JSON.stringify(completedSteps));
  }, [completedSteps]);

  const cleanUser = gitUser.trim() || 'your-username';
  const cleanRepo = gitRepo.trim() || 'owner/repo';
  const parts = cleanRepo.split('/');
  const repoOwner = parts.length > 1 ? parts[0] : 'owner';
  const repoName = parts.length > 1 ? parts[1] : cleanRepo;
  const cleanBranch = gitBranch.trim() || 'my-feature-branch';

  const toggleStepCompleted = (stepId: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const handleResetProgress = () => {
    if (window.confirm('Reset all 10 stages checklist progress?')) {
      setCompletedSteps({});
      localStorage.removeItem('codebridge_pr_guide_completed_steps');
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Call AI Mentor for a specific stage
  const handleAskMentor = async (stageId: number, stageTitle: string, customQuestion?: string) => {
    const questionText = customQuestion || mentorQuestions[stageId] || '';

    setMentorResponses((prev) => ({
      ...prev,
      [stageId]: { text: '', loading: true },
    }));

    try {
      const response = await fetch('/api/pr-step-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: stageId,
          stepTitle: stageTitle,
          question: questionText.trim() || undefined,
          username: cleanUser,
          repo: cleanRepo,
          branch: cleanBranch,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.keyMissing && onOpenKeyInfo) {
          onOpenKeyInfo();
        }
        throw new Error(data.error || 'Failed to get mentor explanation.');
      }

      setMentorResponses((prev) => ({
        ...prev,
        [stageId]: { text: data.advice, loading: false },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error consulting AI mentor.';
      setMentorResponses((prev) => ({
        ...prev,
        [stageId]: { text: '', loading: false, error: msg },
      }));
    }
  };

  // The 10 Essential Open Source PR Stages
  const stages: PrStage[] = [
    {
      id: 1,
      stageName: 'Stage 1',
      title: 'Understand Open Source & Choose a Repository',
      summary: 'Learn how open source projects operate and choose a friendly, well-maintained repository to contribute to.',
      goal: 'Find a welcoming repository with clear labels like "good first issue" or "hacktoberfest".',
      docUrl: 'https://docs.github.com/en/get-started/exploring-projects-on-github/finding-ways-to-contribute-to-open-source-on-github',
      docLabel: 'GitHub Docs: Finding Ways to Contribute',
      commands: [
        {
          cmd: `git --version`,
          explanation: 'Verify that Git is installed and working on your machine.',
        },
        {
          cmd: `git config --global user.name "${cleanUser}"\ngit config --global user.email "${cleanUser}@example.com"`,
          explanation: 'Set your global Git name and email to match your GitHub profile for proper commit attribution.',
        },
      ],
      commonMistakes: [
        'Picking huge repositories (like Linux or React) for your very first PR without checking issue assignment rules.',
        'Starting to code before asking if an issue is already assigned to someone else.',
        'Targeting unmaintained or inactive repositories that haven\'t had a commit in years.',
      ],
      maintainerTip: 'Comment politely on an issue saying: "Hi! I would love to work on this issue as a first-time contributor. Could you please assign it to me?"',
    },
    {
      id: 2,
      stageName: 'Stage 2',
      title: 'Read the Contribution Guidelines',
      summary: 'Every open-source project has rules regarding coding style, branch names, unit tests, and communication.',
      goal: 'Read CONTRIBUTING.md, CODE_OF_CONDUCT.md, and understand how to run tests locally.',
      docUrl: 'https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors',
      docLabel: 'GitHub Docs: Contributing Guidelines',
      commands: [
        {
          cmd: `# Open the repository in your browser to inspect CONTRIBUTING.md:\nhttps://github.com/${repoOwner}/${repoName}/blob/main/CONTRIBUTING.md`,
          explanation: 'Most repositories place their setup, testing, and formatting guidelines right in the root CONTRIBUTING.md.',
        },
      ],
      commonMistakes: [
        'Skipping the contributing guide and submitting a PR that fails formatting or lint checks.',
        'Ignoring licensing terms (ensure you are allowed to contribute and retain copyright under the project license).',
      ],
      maintainerTip: 'Maintainers write CONTRIBUTING.md to save you time. Checking it first guarantees your PR will be welcomed and reviewed much faster.',
    },
    {
      id: 3,
      stageName: 'Stage 3',
      title: 'Fork the Repository',
      summary: 'Make a personal copy of the upstream project under your own GitHub account.',
      goal: 'Have an independent remote copy at https://github.com/' + cleanUser + '/' + repoName + ' where you have push permissions.',
      docUrl: 'https://docs.github.com/en/get-started/quickstart/fork-a-repo',
      docLabel: 'GitHub Docs: Fork a Repo',
      commands: [
        {
          cmd: `# Option A: Click "Fork" at https://github.com/${repoOwner}/${repoName}\n# Option B: Use GitHub CLI in terminal:\ngh repo fork ${cleanRepo} --clone=false`,
          explanation: 'Forking creates a remote replica under your GitHub handle without altering the original repository.',
        },
      ],
      commonMistakes: [
        'Trying to push code directly to the maintainer\'s repo without forking (you will receive a 403 Permission Denied error).',
      ],
      maintainerTip: 'Always keep your fork clean. Never edit your fork\'s main branch directly.',
    },
    {
      id: 4,
      stageName: 'Stage 4',
      title: 'Clone the Fork to Your Local Machine',
      summary: 'Download your fork to your computer and configure the maintainer\'s original repo as an "upstream" remote.',
      goal: 'Set up local files and link both "origin" (your fork) and "upstream" (original repo).',
      docUrl: 'https://docs.github.com/en/get-started/getting-started-with-git/about-remote-repositories',
      docLabel: 'GitHub Docs: About Remote Repositories',
      commands: [
        {
          cmd: `git clone https://github.com/${cleanUser}/${repoName}.git\ncd ${repoName}`,
          explanation: 'Downloads your fork locally and switches into the repository directory.',
        },
        {
          cmd: `git remote add upstream https://github.com/${repoOwner}/${repoName}.git\ngit remote -v`,
          explanation: 'Links the original repository as "upstream" and verifies both remotes (origin and upstream).',
        },
      ],
      commonMistakes: [
        'Cloning the maintainer\'s repository URL instead of your own fork URL.',
        'Forgetting to configure the "upstream" remote, making it hard to pull new changes later.',
      ],
      maintainerTip: 'Running "git remote -v" should show "origin" pointing to your username and "upstream" pointing to the original repo owner.',
    },
    {
      id: 5,
      stageName: 'Stage 5',
      title: 'Create a New Git Branch',
      summary: 'Always isolate your fix or feature on a separate branch. Never work on the main branch.',
      goal: 'Create and switch to a descriptive branch (e.g. ' + cleanBranch + ').',
      docUrl: 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-branches',
      docLabel: 'GitHub Docs: About Branches',
      commands: [
        {
          cmd: `git checkout -b ${cleanBranch}`,
          explanation: 'Creates a new branch named "' + cleanBranch + '" and switches to it in one step.',
        },
        {
          cmd: `git branch`,
          explanation: 'Verifies which branch is currently active (marked with an asterisk *).',
        },
      ],
      commonMistakes: [
        'Making changes directly on the main/master branch.',
        'Using vague branch names like "patch-1" or "my-branch". Use descriptive prefixes like "fix/modal-esc" or "docs/readme".',
      ],
      maintainerTip: 'One branch per pull request! If you want to work on a second issue later, you can create another branch without conflicts.',
    },
    {
      id: 6,
      stageName: 'Stage 6',
      title: 'Make and Test Changes',
      summary: 'Open the code in your editor, write your fix, run automated tests, and verify linters pass.',
      goal: 'Implement the solution cleanly and confirm the test suite passes locally.',
      docUrl: 'https://docs.github.com/en/actions/automating-builds-and-tests/about-continuous-integration',
      docLabel: 'GitHub Docs: About Continuous Integration (CI)',
      commands: [
        {
          cmd: `git status`,
          explanation: 'Shows modified, created, or deleted files in your local workspace.',
        },
        {
          cmd: `git diff`,
          explanation: 'Shows exact line-by-line additions (+) and removals (-) before you commit.',
        },
        {
          cmd: `npm test\n# or: pytest / cargo test / mvn test (depending on tech stack)`,
          explanation: 'Runs automated unit tests locally before pushing to save CI resources.',
        },
      ],
      commonMistakes: [
        'Editing unrelated files or reformatting lines you did not touch (keeps the PR diff clean).',
        'Committing without running the linter, causing GitHub Actions CI to immediately fail.',
      ],
      maintainerTip: 'Keep your diff minimal! A 10-line pull request that fixes a bug with a test is 100x easier to merge than an 800-line refactor.',
    },
    {
      id: 7,
      stageName: 'Stage 7',
      title: 'Commit the Changes',
      summary: 'Stage your modified files and write a concise, conventional commit message.',
      goal: 'Create an atomic commit with a clear explanation of what was changed.',
      docUrl: 'https://docs.github.com/en/get-started/using-git/about-git#commit',
      docLabel: 'GitHub Docs: About Git Commits',
      commands: [
        {
          cmd: `git add .`,
          explanation: 'Stages all modified files. (Or specify files: git add src/filename.ts)',
        },
        {
          cmd: `git commit -m "${commitMessage}"`,
          explanation: 'Records the staged snapshot with a descriptive Conventional Commit message.',
        },
        {
          cmd: `git log -1 --stat`,
          explanation: 'Inspects your most recent commit and lists affected files.',
        },
      ],
      commonMistakes: [
        'Accidentally committing sensitive files (like .env, credentials, or OS files like .DS_Store).',
        'Writing unhelpful commit messages like "updated", "wip", or "fixed stuff".',
      ],
      maintainerTip: 'Follow Conventional Commits: "feat: ...", "fix: ...", "docs: ...", or "test: ...". Maintainers love clean git histories.',
    },
    {
      id: 8,
      stageName: 'Stage 8',
      title: 'Push the Branch to GitHub',
      summary: 'Upload your local branch and commits to your fork on GitHub.',
      goal: 'Push branch "' + cleanBranch + '" to origin with upstream tracking.',
      docUrl: 'https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository',
      docLabel: 'GitHub Docs: Pushing Commits',
      commands: [
        {
          cmd: `git push -u origin ${cleanBranch}`,
          explanation: 'Pushes your local branch to your GitHub fork (origin) and sets up tracking (-u).',
        },
      ],
      commonMistakes: [
        'Trying to push to "upstream" instead of "origin" (upstream is read-only for contributors).',
        'Forgetting the "-u origin <branch>" flag on your very first push of a new branch.',
      ],
      maintainerTip: 'Once pushed, GitHub will automatically display a gold banner on the repository website saying "Your recently pushed branch has changes".',
    },
    {
      id: 9,
      stageName: 'Stage 9',
      title: 'Open a Pull Request on GitHub',
      summary: 'Submit your branch for review by creating a Pull Request comparing your fork with the original repository.',
      goal: 'Open the PR with a friendly title, clear description, and link to the related issue (Closes #' + (issueNumber || '123') + ').',
      docUrl: 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request',
      docLabel: 'GitHub Docs: Creating a Pull Request',
      commands: [
        {
          cmd: `# Navigate to GitHub to review diff and submit PR:\nhttps://github.com/${repoOwner}/${repoName}/compare/main...${cleanUser}:${cleanBranch}`,
          explanation: 'Opens the GitHub compare view where you review the diff and click "Create pull request".',
        },
      ],
      commonMistakes: [
        'Opening a pull request without filling out the project\'s PR description template.',
        'Forgetting to link the issue (writing "Closes #123" in the body tells GitHub to auto-close the issue upon merging).',
      ],
      maintainerTip: 'Be friendly! Write a brief summary: what changed, why it was needed, and how you tested it. Include a screenshot if it changes the UI.',
    },
    {
      id: 10,
      stageName: 'Stage 10',
      title: 'Respond to Review Feedback & Merge',
      summary: 'Work constructively with maintainers, address feedback on the same branch, and get your contribution merged.',
      goal: 'Incorporate review suggestions, push revisions, and celebrate your first merged open-source PR!',
      docUrl: 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/incorporating-feedback-in-your-pull-request',
      docLabel: 'GitHub Docs: Incorporating Feedback in a PR',
      commands: [
        {
          cmd: `# 1. Make the requested revisions in your editor\n# 2. Commit the updates:\ngit commit -am "fix: address reviewer feedback"\n# 3. Push to your branch (GitHub updates PR automatically):\ngit push origin ${cleanBranch}`,
          explanation: 'Pushing new commits to the same branch automatically updates your active PR without creating a new PR.',
        },
      ],
      commonMistakes: [
        'Opening a brand new Pull Request when asked for changes. Simply push new commits to your existing branch!',
        'Taking code review comments personally. Code reviews are collaborative learning experiences, not critiques of you.',
      ],
      maintainerTip: 'Thank the reviewer! Reply to comments with "Updated in latest commit!" so maintainers know when to re-review.',
    },
  ];

  // Checklist calculations
  const totalStages = stages.length;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPct = Math.round((completedCount / totalStages) * 100);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-ink-subtle text-[12px] font-medium uppercase tracking-wider mb-1">
            <Compass className="w-3.5 h-3.5 text-[#0070E0]" />
            Complete 10-Stage Contributor Roadmap
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-ink-strong tracking-tight">
            First Pull Request Guide <span className="text-ink-subtle">· 10 Step Mastery</span>
          </h2>
          <p className="text-[13px] text-ink-subtle mt-1 max-w-2xl leading-relaxed">
            Master the open-source contribution workflow from understanding repositories to handling code reviews, with reactive CLI commands and instant AI step mentorship.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetProgress}
          className="btn-secondary h-8 px-3 rounded-[10px] text-[12px] self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Checklist
        </button>
      </div>

      {/* Progress & Interactive Checklist Card */}
      <div className="rounded-xl bg-surface border border-hairline p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-surface-2 border border-hairline text-[#0070E0] flex items-center justify-center font-medium">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-ink-strong">Contributor Progress</h3>
              <p className="text-[12px] text-ink-subtle">
                {completedCount} of {totalStages} stages completed ({progressPct}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono font-medium text-[#0070E0] tabular-nums">{progressPct}% Complete</span>
            <div className="w-36 sm:w-48 h-1.5 bg-surface-2 rounded-full overflow-hidden border border-hairline">
              <div
                className="h-full bg-[#0070E0] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Stage Jump Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-hairline">
          {stages.map((st) => {
            const isDone = Boolean(completedSteps[st.id]);
            const isActive = activeStageId === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStageId(st.id)}
                className={`flex items-center justify-between h-8 px-2.5 rounded-[8px] border text-[12px] transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#0070E0] bg-[#0070E0]/10 text-ink-strong font-medium'
                    : isDone
                    ? 'border-hairline bg-surface-2 text-ink-subtle'
                    : 'border-hairline bg-surface text-ink-subtle hover:text-ink'
                }`}
              >
                <span className="truncate">Stage {st.id}</span>
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                ) : (
                  <Square className="w-3 h-3 text-ink-subtle shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reactive Configuration Bar for Customized Commands */}
      <div className="rounded-xl bg-surface border border-hairline p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] font-medium text-ink-strong uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-[#0070E0]" />
            Customize Your Real Git Commands
          </div>
          <span className="badge-71 text-[10px]">
            Reactive CLI Generator
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-ink-subtle mb-1">
              Your GitHub Username:
            </label>
            <input
              type="text"
              value={gitUser}
              onChange={(e) => setGitUser(e.target.value)}
              placeholder="e.g. octocat"
              className="input-71 font-mono text-[12px]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-subtle mb-1">
              Target Repository (owner/repo):
            </label>
            <input
              type="text"
              value={gitRepo}
              onChange={(e) => setGitRepo(e.target.value)}
              placeholder="e.g. facebook/react"
              className="input-71 font-mono text-[12px]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-subtle mb-1">
              Feature Branch Name:
            </label>
            <input
              type="text"
              value={gitBranch}
              onChange={(e) => setGitBranch(e.target.value)}
              placeholder="e.g. fix/readme-typo"
              className="input-71 font-mono text-[12px]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-subtle mb-1">
              Related Issue # (optional):
            </label>
            <input
              type="text"
              value={issueNumber}
              onChange={(e) => setIssueNumber(e.target.value)}
              placeholder="e.g. 142"
              className="input-71 font-mono text-[12px]"
            />
          </div>
        </div>
      </div>

      {/* 10 Step Detailed Learning Guide Stages */}
      <div className="space-y-3">
        {stages.map((stage) => {
          const isCompleted = Boolean(completedSteps[stage.id]);
          const isOpen = activeStageId === stage.id;
          const isMentorOpen = mentorOpenStageId === stage.id;
          const mentorData = mentorResponses[stage.id];

          return (
            <div
              key={stage.id}
              className={`rounded-xl border transition-colors overflow-hidden ${
                isCompleted
                  ? 'bg-surface border-hairline'
                  : isOpen
                  ? 'bg-surface border-hairline-strong'
                  : 'bg-surface border-hairline hover:border-hairline-strong'
              }`}
            >
              {/* Stage Header Banner */}
              <div
                onClick={() => setActiveStageId(isOpen ? 0 : stage.id)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStepCompleted(stage.id);
                    }}
                    title={isCompleted ? 'Mark incomplete' : 'Mark stage completed'}
                    className={`w-7 h-7 rounded-[6px] flex items-center justify-center font-mono font-medium text-[12px] shrink-0 border transition-colors cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-surface-2 text-ink-subtle border-hairline hover:text-ink'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : stage.id}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="badge-71 font-mono uppercase text-[10px]">
                        {stage.stageName}
                      </span>
                      {isCompleted && (
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-[14px] font-medium text-ink-strong truncate mt-0.5">
                      {stage.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStepCompleted(stage.id);
                    }}
                    className={`hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] text-[12px] font-medium border transition-colors cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'btn-secondary'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        <span>Mark Done</span>
                      </>
                    )}
                  </button>

                  <div className="p-1 text-ink-subtle">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Stage Body */}
              {isOpen && (
                <div className="px-4 pb-5 pt-2 border-t border-hairline space-y-4">
                  {/* Summary & Goal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-surface-2 border border-hairline p-3.5 space-y-1">
                      <span className="text-[11px] font-medium text-[#0070E0] uppercase tracking-wider block">
                        Overview
                      </span>
                      <p className="text-[12px] text-ink leading-relaxed">
                        {stage.summary}
                      </p>
                    </div>

                    <div className="rounded-lg bg-surface-2 border border-hairline p-3.5 space-y-1">
                      <span className="text-[11px] font-medium text-ink-strong uppercase tracking-wider block">
                        Target Outcome
                      </span>
                      <p className="text-[12px] text-ink leading-relaxed">
                        {stage.goal}
                      </p>
                    </div>
                  </div>

                  {/* Git Commands Section */}
                  {stage.commands && stage.commands.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-medium text-ink-strong uppercase tracking-wider flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-[#0070E0]" />
                        Relevant Terminal Commands
                      </span>

                      <div className="space-y-2">
                        {stage.commands.map((cmdItem, cIdx) => (
                          <div
                            key={cIdx}
                            className="rounded-[8px] bg-surface-2 border border-hairline p-3 space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <pre className="text-[12px] font-mono text-[#0070E0] overflow-x-auto whitespace-pre-wrap leading-relaxed flex-1 font-medium">
                                <code>{cmdItem.cmd}</code>
                              </pre>

                              <button
                                type="button"
                                onClick={() => handleCopy(cmdItem.cmd, `stage-${stage.id}-cmd-${cIdx}`)}
                                className="px-2 py-0.5 text-[11px] font-mono rounded-[4px] bg-surface text-ink-subtle hover:text-ink shrink-0 border border-hairline flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedKey === `stage-${stage.id}-cmd-${cIdx}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <p className="text-[11px] text-ink-subtle pt-1 border-t border-hairline">
                              💡 <strong className="text-ink font-medium">What this does:</strong> {cmdItem.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Beginner Support: Common Mistakes & Maintainer Tip */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Mistakes */}
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3.5 space-y-1.5">
                      <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Common Mistakes to Avoid
                      </span>
                      <ul className="space-y-1 text-[12px] text-amber-700 dark:text-amber-200 list-disc list-inside">
                        {stage.commonMistakes.map((mistake, mIdx) => (
                          <li key={mIdx} className="leading-relaxed">
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Maintainer Rule */}
                    <div className="rounded-lg bg-surface-2 border border-hairline p-3.5 space-y-1.5">
                      <span className="text-[11px] font-medium text-ink-strong uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0070E0]" />
                        Maintainer's Golden Rule
                      </span>
                      <p className="text-[12px] text-ink leading-relaxed">
                        {stage.maintainerTip}
                      </p>
                      <div className="pt-1">
                        <a
                          href={stage.docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] text-[#0070E0] hover:underline"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{stage.docLabel}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* AI Mentor Stage Assistant */}
                  <div className="rounded-lg bg-surface-2 border border-hairline p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-[#0070E0]" />
                        <h4 className="text-[12px] font-medium text-ink-strong uppercase tracking-wider">
                          AI Mentor for Stage {stage.id}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const nextState = isMentorOpen ? null : stage.id;
                          setMentorOpenStageId(nextState);
                          if (nextState !== null && !mentorData) {
                            handleAskMentor(stage.id, stage.title);
                          }
                        }}
                        className="btn-secondary h-7 px-2.5 rounded-[8px] text-[12px] cursor-pointer"
                      >
                        {isMentorOpen ? 'Collapse Mentor' : 'Ask AI Mentor About This Stage'}
                      </button>
                    </div>

                    {isMentorOpen && (
                      <div className="pt-2 space-y-2.5">
                        {/* Custom Question Form */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAskMentor(stage.id, stage.title, mentorQuestions[stage.id]);
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={mentorQuestions[stage.id] || ''}
                            onChange={(e) =>
                              setMentorQuestions((prev) => ({ ...prev, [stage.id]: e.target.value }))
                            }
                            placeholder={`Ask Gemini anything about ${stage.title.toLowerCase()}...`}
                            disabled={mentorData?.loading}
                            className="input-71 flex-1 text-[12px]"
                          />
                          <button
                            type="submit"
                            disabled={mentorData?.loading}
                            className="btn-primary h-8 px-3 rounded-[10px] text-[12px] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            <span>Ask</span>
                          </button>
                        </form>

                        {/* Loading State */}
                        {mentorData?.loading && (
                          <div className="p-3 rounded-lg bg-surface border border-hairline flex items-center gap-2 text-[12px] text-ink-subtle">
                            <div className="w-3.5 h-3.5 border-2 border-[#0070E0] border-t-transparent rounded-full animate-spin" />
                            <span>Gemini AI Mentor is generating advice for Stage {stage.id}...</span>
                          </div>
                        )}

                        {/* Error state */}
                        {mentorData?.error && (
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{mentorData.error}</span>
                          </div>
                        )}

                        {/* Advice Output */}
                        {mentorData?.text && !mentorData.loading && (
                          <div className="rounded-lg bg-surface border border-hairline p-3.5 text-[12px] text-ink leading-relaxed whitespace-pre-wrap">
                            {mentorData.text}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Complete stage button footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-hairline text-[12px]">
                    <span className="text-ink-subtle">
                      Step {stage.id} of 10
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleStepCompleted(stage.id)}
                      className={`h-8 px-3 rounded-[10px] text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'btn-primary'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Stage {stage.id} Completed! (Click to Undo)</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Mark Stage {stage.id} as Done &rarr;</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <div className="rounded-xl bg-surface border border-hairline p-4 text-[12px] text-ink-subtle text-center leading-relaxed">
        <strong className="text-ink font-medium">Open Source Integrity:</strong> Pull requests must be submitted directly through your authenticated GitHub account via the GitHub web interface or terminal CLI. CodeBridge AI assists with preparation, code analysis, and command generation, but does not automatically submit PRs on your behalf.
      </div>
    </div>
  );
};
