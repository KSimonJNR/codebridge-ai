import { LearningModule, GlossaryTerm } from '../types.ts';

export const LEARNING_MODULES: LearningModule[] = [
  {
    id: 'module-1',
    moduleNumber: 1,
    title: 'What Open Source Means',
    badge: 'Culture & Foundations',
    readTime: '3 min read',
    summary: 'Understand the collaborative philosophy of open source, software licensing, and why millions of developers build together in public.',
    explanation: {
      coreConcept:
        'Open source software (OSS) is code published openly with a license that grants anyone the legal right to inspect, modify, use, and share it freely. It is not just about free software; it is a global decentralized community model.',
      keyTakeaways: [
        'Open source is powered by volunteer maintainers who review code and triage issues.',
        'Licenses like MIT and Apache 2.0 allow commercial and personal use with minimal restrictions.',
        'Contributing builds real-world portfolio experience, communication skills, and professional relationships.',
        'Every major company (Google, Microsoft, Meta) depends on open source software daily.',
      ],
      deepDive:
        'When you contribute to open source, you are joining a collective workspace. Code is public, discussions happen in issue trackers, and collaboration happens asynchronously across time zones. Maintaining empathy, patience, and clear communication is just as vital as writing correct code.',
    },
    practicalExample: {
      title: 'Real-World License Comparison',
      scenario: 'You find a useful JavaScript utility on GitHub. Can you use and contribute to it?',
      explanation:
        'Always check the LICENSE file in the repo root:\n• MIT License: Permissive, permits use in any project as long as copyright is retained.\n• Apache 2.0: Permissive like MIT, but also grants explicit patent rights.\n• GPLv3: Copyleft, requires derivative works to also remain open-source.\nIf a project has no license, you cannot legally copy or redistribute it!',
    },
    exercise: {
      prompt: 'Why do open-source projects require an official software license like MIT or Apache 2.0?',
      options: [
        'To restrict anyone from running the code without paying a monthly fee',
        'To legally grant developers permission to view, modify, and distribute the code',
        'To prevent GitHub from hosting the repository on public servers',
        'To guarantee that bugs will never occur in the project',
      ],
      correctIndex: 1,
      explanation:
        'Correct! Without an explicit open-source license, default copyright laws apply, meaning nobody has legal permission to modify or distribute the author’s work.',
    },
    relatedFeature: {
      tab: 'idea-generator',
      label: 'Explore Project Ideas',
      description: 'Find creative open-source project ideas tailored to your programming stack in the AI Project Idea Generator.',
    },
  },
  {
    id: 'module-2',
    moduleNumber: 2,
    title: 'Git and GitHub Fundamentals',
    badge: 'Core Tools',
    readTime: '4 min read',
    summary: 'Demystify the difference between Git (the local engine) and GitHub (the collaborative cloud platform).',
    explanation: {
      coreConcept:
        'Git is a decentralized command-line program that tracks changes in your local files like an undo history. GitHub is a cloud-based web hosting service that stores Git repositories online and provides collaboration tools like issues, discussions, and pull requests.',
      keyTakeaways: [
        'Git runs completely offline on your computer; you do not need internet to commit changes.',
        'GitHub acts as a remote backup and collaboration hub where teams share their Git branches.',
        'You use Git commands (like git status, git add, git commit) to record local history.',
        'You use git push and git fetch to sync your local Git history with GitHub.',
      ],
      deepDive:
        'Think of Git as the camera that captures snapshots of your code as you build. GitHub is like an online gallery where you publish those snapshots so other developers can inspect, review, and suggest enhancements.',
    },
    practicalExample: {
      title: 'Connecting Local Git to Remote GitHub',
      scenario: 'How your terminal talks to GitHub without confusing local and remote states.',
      codeOrCommands: [
        {
          cmd: 'git status',
          explanation: 'Checks which files were edited, staged, or untracked in your local workspace.',
        },
        {
          cmd: 'git remote -v',
          explanation: 'Lists the remote URLs (origin & upstream) your local Git clone connects to.',
        },
      ],
      explanation:
        'The term "origin" is simply the default shorthand name Git gives to your own GitHub repository link, while "upstream" points to the original project repository you forked from.',
    },
    exercise: {
      prompt: 'Which statement accurately describes the relationship between Git and GitHub?',
      options: [
        'Git and GitHub are the exact same product developed by Microsoft',
        'Git is the local version control software, while GitHub is a web service that hosts Git repositories',
        'GitHub is installed on your computer terminal, while Git is only accessed via web browser',
        'You cannot use Git without having a paid GitHub enterprise subscription',
      ],
      correctIndex: 1,
      explanation:
        'Correct! Git is an open-source version control tool running locally on your machine, whereas GitHub is a web platform that hosts Git repositories in the cloud.',
    },
    relatedFeature: {
      tab: 'pr-guide',
      label: 'Interactive PR Guide',
      description: 'Practice the end-to-end Git workflow with dynamic commands in the First Pull Request Guide.',
    },
  },
  {
    id: 'module-3',
    moduleNumber: 3,
    title: 'Repositories, Branches, Commits & PRs',
    badge: 'Mental Models',
    readTime: '4 min read',
    summary: 'Master the four core concepts that make open-source development safe, isolated, and scalable.',
    explanation: {
      coreConcept:
        'Open-source repositories protect their primary production code (main branch) by keeping changes strictly isolated in feature branches until peer-reviewed through a Pull Request.',
      keyTakeaways: [
        'Repository (Repo): The folder containing your project files plus the entire .git commit history.',
        'Commit: An immutable snapshot of changes, accompanied by an author, timestamp, and message.',
        'Branch: An isolated workspace pointer allowing you to experiment without breaking the main code.',
        'Pull Request (PR): A formal proposal to merge commits from your feature branch into the target repository.',
      ],
      deepDive:
        'Never make edits directly on the default "main" branch. By creating a dedicated branch (e.g. "fix/button-color"), you can work freely, run tests, and if something goes wrong, your main branch remains completely clean and stable.',
    },
    practicalExample: {
      title: 'Branching Workflow in Practice',
      scenario: 'You want to fix a typo in the documentation without risking the main app codebase.',
      codeOrCommands: [
        {
          cmd: 'git checkout -b fix/docs-typo',
          explanation: 'Creates a new branch named "fix/docs-typo" and switches your working directory to it.',
        },
        {
          cmd: 'git branch',
          explanation: 'Lists all local branches, with an asterisk highlighting your active branch.',
        },
      ],
      explanation:
        'Every commit you make now belongs exclusively to "fix/docs-typo". When you open a PR on GitHub, maintainers review only those specific commits.',
    },
    exercise: {
      prompt: 'Why should you always create a new Git branch before starting work on a bug or feature?',
      options: [
        'Because GitHub will automatically delete your repository if you commit to main',
        'To isolate your changes so you do not break the main codebase or block other updates',
        'Because Git will run twice as fast on branches with hyphens in their name',
        'To hide your code permanently from the project maintainers',
      ],
      correctIndex: 1,
      explanation:
        'Correct! Branches isolate your work, allowing you to develop, test, and request code reviews without disrupting the stable main branch.',
    },
    relatedFeature: {
      tab: 'chat-mentor',
      label: 'Ask Mentor AI',
      description: 'Have questions about branch naming conventions or Git commits? Ask CodeBridge AI Mentor anytime.',
    },
  },
  {
    id: 'module-4',
    moduleNumber: 4,
    title: 'How to Read a README and CONTRIBUTING File',
    badge: 'Project Orientation',
    readTime: '3 min read',
    summary: 'Learn how to navigate repository documentation so you can set up your local environment on the first try.',
    explanation: {
      coreConcept:
        'The README is a project’s welcome front door, while CONTRIBUTING.md is the contributor manual. Reading both before writing code saves you hours of frustration and demonstrates respect for maintainers.',
      keyTakeaways: [
        'README.md explains what the project does, prerequisites, and basic quickstart commands.',
        'CONTRIBUTING.md provides branching conventions, testing commands, and PR submission rules.',
        'Look for CODE_OF_CONDUCT.md to understand the community standards and respectful behavior expectations.',
        'Check for .github/pull_request_template.md to see what details maintainers expect in your PR.',
      ],
      deepDive:
        'Maintainers spend considerable effort crafting contribution guides. Common guidelines include: running code formatters (Prettier, Black, ESLint), ensuring unit tests pass, and adhering to Conventional Commit message formats.',
    },
    practicalExample: {
      title: 'Checklist for Reviewing Repo Docs',
      scenario: 'You just opened a repository. What should you scan for first?',
      explanation:
        '1. Prerequisites: Node.js version, Python version, Docker requirements.\n2. Setup: Is it "npm install", "yarn", or "poetry install"?\n3. Verification: How do you run tests? ("npm test", "pytest")\n4. Branching policy: Do they merge to "main", "dev", or "canary"?',
    },
    exercise: {
      prompt: 'Where in a repository should you look first to find instructions on running tests and submitting a pull request?',
      options: [
        'package-lock.json',
        'CONTRIBUTING.md (or the Contributing section of README.md)',
        'The .git/config internal directory',
        'The LICENSE file',
      ],
      correctIndex: 1,
      explanation:
        'Correct! The CONTRIBUTING.md document outlines specific development setup instructions, code style rules, and PR checklist requirements.',
    },
    relatedFeature: {
      tab: 'roadmap',
      label: 'AI Contribution Roadmap',
      description: 'Get an automated breakdown of a repository’s contribution guidelines and orientation with the AI Contribution Roadmap.',
    },
  },
  {
    id: 'module-5',
    moduleNumber: 5,
    title: 'How to Find and Understand GitHub Issues',
    badge: 'Finding Opportunities',
    readTime: '4 min read',
    summary: 'Discover how to spot beginner-friendly issues, verify tickets, and communicate with maintainers respectfully.',
    explanation: {
      coreConcept:
        'GitHub Issues track bugs, feature requests, and tasks. High-quality repositories label beginner tasks with tags like "good first issue" or "help wanted" to guide new contributors.',
      keyTakeaways: [
        'Look for the "good first issue" label for well-scoped, approachable tasks.',
        'Read the issue description to understand the expected vs actual behavior.',
        'Always read existing comments to verify whether someone is already working on it.',
        'Leave a polite comment asking to be assigned before starting work to avoid duplicated effort.',
      ],
      deepDive:
        'Maintainers appreciate concise, professional inquiries. For example: "Hi! I would love to tackle this issue. I plan to check X in directory Y and update the unit test. Could I be assigned to this ticket?"',
    },
    practicalExample: {
      title: 'Evaluating an Issue Before Claiming It',
      scenario: 'How to tell if an issue is ready to be worked on.',
      explanation:
        '• Green Flag: Clear reproduction steps, labeled "good first issue", active maintainer engagement.\n• Yellow Flag: Open for 3 years without maintainer replies, unclear description, or missing logs.\n• Red Flag: 5 people have already commented "I am working on this" within the last 2 days.',
    },
    exercise: {
      prompt: 'What is the best etiquette before you start coding to fix an open GitHub issue?',
      options: [
        'Immediately submit 10 pull requests to get the maintainer’s attention',
        'Leave a polite comment confirming if the issue is still open and asking if you may be assigned',
        'Direct message the repository owner on Twitter or personal email',
        'Download the code and push directly to the project’s main branch',
      ],
      correctIndex: 1,
      explanation:
        'Correct! Commenting politely confirms the issue is still relevant and ensures other contributors do not duplicate your work.',
    },
    relatedFeature: {
      tab: 'repo-finder',
      label: 'Find Beginner Repositories',
      description: 'Browse real repositories actively tagging "good first issue" tickets using the Open-Source Repository Finder.',
    },
  },
  {
    id: 'module-6',
    moduleNumber: 6,
    title: 'Fork, Clone, Branch, Commit & Open PR',
    badge: 'The Complete Workflow',
    readTime: '5 min read',
    summary: 'Follow the canonical, industry-standard 7-step sequence from forking a repo to opening your pull request.',
    explanation: {
      coreConcept:
        'Because you do not have write permissions to push directly to someone else’s repository, you fork their repo to your own GitHub account, clone your fork locally, make changes on a branch, push to your fork, and submit a Pull Request back to the original project.',
      keyTakeaways: [
        'Fork: Creates your personal copy of the repository under your GitHub account.',
        'Clone: Downloads your fork to your computer filesystem.',
        'Upstream remote: Connects your local clone to the original project so you can sync updates.',
        'Push: Uploads your local commits to your GitHub fork so they are visible on the web.',
        'Pull Request: Requests the upstream project maintainers to review and merge your branch.',
      ],
      deepDive:
        'This decentralized model protects open-source projects. Maintainers retain complete control over what code enters their project, while any developer in the world can contribute safely.',
    },
    practicalExample: {
      title: 'The Canonical Git Command Sequence',
      scenario: 'Complete sequence of safe terminal commands for a contribution:',
      codeOrCommands: [
        {
          cmd: 'git clone https://github.com/<your-username>/<repo-name>.git',
          explanation: 'Downloads your GitHub fork to your computer.',
        },
        {
          cmd: 'git remote add upstream https://github.com/<original-owner>/<repo-name>.git',
          explanation: 'Adds a link to the original project so you can sync future changes.',
        },
        {
          cmd: 'git checkout -b fix/header-typo',
          explanation: 'Creates and switches to a dedicated feature branch.',
        },
        {
          cmd: 'git add src/header.js',
          explanation: 'Stages the specific modified file for your next snapshot.',
        },
        {
          cmd: 'git commit -m "docs: fix typo in header navigation link"',
          explanation: 'Records your staged changes with a clear conventional commit message.',
        },
        {
          cmd: 'git push -u origin fix/header-typo',
          explanation: 'Pushes your feature branch to your GitHub fork.',
        },
      ],
      explanation:
        'After running git push, visit your fork on GitHub. You will see a prominent green button labeled "Compare & pull request". Click it, fill out the PR description, and click "Create pull request"!',
    },
    exercise: {
      prompt: 'After pushing your feature branch to your fork on GitHub, what is the next step to submit your contribution?',
      options: [
        'Delete your local repository to free up disk space',
        'Visit GitHub and click "Compare & pull request" to submit your PR to the upstream repository',
        'Send an email to GitHub customer support with your commit hash',
        'Run git reset --hard to erase the commits from your computer',
      ],
      correctIndex: 1,
      explanation:
        'Correct! GitHub will display a banner on your fork with a "Compare & pull request" button to propose your changes to the original maintainers.',
    },
    relatedFeature: {
      tab: 'pr-guide',
      label: 'Interactive 10-Stage PR Guide',
      description: 'Follow step-by-step guidance and copy customized Git commands in the First Pull Request Guide.',
    },
  },
  {
    id: 'module-7',
    moduleNumber: 7,
    title: 'How to Respond to Code Review Feedback',
    badge: 'Collaboration & Merging',
    readTime: '3 min read',
    summary: 'Learn how to interpret reviewer comments, update your pull request branch, and celebrate your first merged contribution.',
    explanation: {
      coreConcept:
        'Code review is a standard, collaborative mentorship process. When a maintainer asks for changes, they are investing time to help you get your code merged to production standards.',
      keyTakeaways: [
        'Never take code review feedback personally; critique is directed at code quality and project consistency.',
        'To address feedback, simply make edits on your local branch, commit them, and run "git push origin <branch>". The PR on GitHub updates automatically!',
        'You do not need to close the PR or open a new PR to address feedback.',
        'Reply to review comments politely, confirming what was changed or asking for clarification if unsure.',
      ],
      deepDive:
        'Automated CI tests (GitHub Actions) might fail if a test is broken or linting is off. Click "Details" next to the failed check to see the exact error output, fix it locally, and push an update.',
    },
    practicalExample: {
      title: 'Updating an Existing PR in 3 Commands',
      scenario: 'A maintainer asked: "Could you rename this variable to camelCase?"',
      codeOrCommands: [
        {
          cmd: 'git add src/utils.js',
          explanation: 'Stage your updated file with the requested variable name.',
        },
        {
          cmd: 'git commit -m "refactor: rename variable to camelCase per review"',
          explanation: 'Commit the requested revision.',
        },
        {
          cmd: 'git push origin fix/header-typo',
          explanation: 'Push to your branch. GitHub automatically attaches this new commit to your existing PR!',
        },
      ],
      explanation:
        'Once pushed, leave a friendly comment: "Thanks for the feedback! I updated the variable naming to camelCase as requested." Maintainers love this responsiveness.',
    },
    exercise: {
      prompt: 'When a maintainer asks you to change something in your Pull Request, what should you do?',
      options: [
        'Immediately delete your fork and close your GitHub account in frustration',
        'Close the PR and open a brand new PR from scratch with the new code',
        'Make the requested change on your local feature branch, commit it, and push to your fork branch',
        'Argue with the maintainer that your code is flawless',
      ],
      correctIndex: 2,
      explanation:
        'Correct! Simply make the requested adjustments on your local branch, commit, and push. Your existing Pull Request updates automatically on GitHub.',
    },
    relatedFeature: {
      tab: 'explainer',
      label: 'AI Code Explainer',
      description: 'Need help understanding tricky code suggestions or error logs from reviewers? Paste them into the AI Code Explainer.',
    },
  },
];

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'Repository (Repo)',
    category: 'GitHub',
    definition: 'A digital storage folder containing all project files, documentation, and the complete commit history tracked by Git.',
    analogy: 'Like a project file cabinet with an unalterable logbook of every revision ever made.',
    example: 'facebook/react is React’s open-source repository.',
  },
  {
    term: 'Fork',
    category: 'GitHub',
    definition: 'A personal copy of another user’s GitHub repository hosted under your own GitHub account.',
    analogy: 'Like taking a photocopy of a cookbook recipe so you can experiment in your own kitchen without altering the original book.',
    example: 'You fork freeCodeCamp/freeCodeCamp to your-username/freeCodeCamp before cloning.',
  },
  {
    term: 'Clone',
    category: 'Git',
    definition: 'Downloading a copy of a remote Git repository from GitHub directly onto your computer’s hard drive.',
    analogy: 'Downloading an offline copy of a document so you can read and edit it in your local text editor.',
    example: 'git clone https://github.com/octocat/Spoon-Knife.git',
  },
  {
    term: 'Commit',
    category: 'Git',
    definition: 'An immutable snapshot of your staged files at a specific moment in time, identified by a unique SHA hash and commit message.',
    analogy: 'Like saving your game progress at a specific checkpoint with a note describing what level you just beat.',
    example: 'git commit -m "fix(auth): handle null token exception"',
  },
  {
    term: 'Branch',
    category: 'Git',
    definition: 'A parallel, isolated version of a repository that allows you to develop features or bug fixes without affecting the main codebase.',
    analogy: 'Like creating an alternate timeline where you can test radical experiments without endangering the main universe.',
    example: 'git checkout -b fix/nav-bar-overlap',
  },
  {
    term: 'Pull Request (PR)',
    category: 'GitHub',
    definition: 'A proposed set of changes submitted by a contributor requesting maintainers to review, discuss, and merge code from a feature branch into the target repository.',
    analogy: 'Like handing in an essay draft with tracked changes for your professor or editor to review and approve before publication.',
    example: 'Opening PR #124 to resolve issue #98.',
  },
  {
    term: 'Upstream',
    category: 'Git',
    definition: 'The original primary repository from which you created your fork. Used to pull and sync the latest updates from the community.',
    analogy: 'The original river source from which your personal canal (fork) was branched.',
    example: 'git remote add upstream https://github.com/original-owner/project.git',
  },
  {
    term: 'Origin',
    category: 'Git',
    definition: 'The default remote alias Git assigns to the repository you cloned from (usually your personal fork on GitHub).',
    analogy: 'Your personal cloud locker where you push your work before asking the main team to look at it.',
    example: 'git push -u origin my-feature-branch',
  },
  {
    term: 'Merge Conflict',
    category: 'Git',
    definition: 'An event that occurs when Git cannot automatically reconcile differences between two commits editing the same lines of code.',
    analogy: 'Two people trying to write a sentence on the exact same blank line of paper at the same time.',
    example: 'Git inserts <<<<<<< HEAD markers until you choose which version to keep.',
  },
  {
    term: 'Maintainer',
    category: 'Etiquette',
    definition: 'An authorized steward of an open-source project responsible for reviewing pull requests, managing issues, releasing versions, and enforcing community standards.',
    analogy: 'Like the head editor and curator of an open-access journal.',
    example: 'Maintainers review your PR, suggest edits, and click the green "Merge" button.',
  },
  {
    term: 'Contributor',
    category: 'Etiquette',
    definition: 'Anyone who submits code, documentation, bug reports, design assets, or discussions to an open-source project.',
    analogy: 'Like an author contributing an article to a community encyclopedia.',
    example: 'Writing a 2-line typo fix in a README makes you an official contributor!',
  },
  {
    term: 'Issue',
    category: 'GitHub',
    definition: 'A trackable ticket in GitHub used to report bugs, request new features, discuss architectural decisions, or coordinate work.',
    analogy: 'A sticky note on the project corkboard describing a problem that needs attention.',
    example: 'Issue #412: "Search bar crashes on mobile Safari".',
  },
  {
    term: 'Good First Issue',
    category: 'Workflow',
    definition: 'A standardized label applied by maintainers to small, well-defined issues explicitly intended for newcomers to open source.',
    analogy: 'The "Beginner Slopes" on a ski mountain.',
    example: 'Fixing broken hyperlinks, adding missing unit tests, or small UI style bugs.',
  },
  {
    term: 'CI / Continuous Integration',
    category: 'Workflow',
    definition: 'Automated test runners (such as GitHub Actions) that automatically build and test code whenever a new pull request is opened or updated.',
    analogy: 'A spell-checker and safety inspection scanner that runs before any package is accepted at the warehouse.',
    example: 'Green checkmarks (✓) next to your PR indicating that all unit tests passed.',
  },
  {
    term: 'CLA (Contributor License Agreement)',
    category: 'Etiquette',
    definition: 'A legal agreement that contributors sign (often via a 1-click bot on GitHub) giving the project rights to distribute the contributed code.',
    analogy: 'A release form signing off that you wrote the code yourself and agree to the project license.',
    example: 'A CLA-bot leaves a comment asking you to click an authorization link.',
  },
  {
    term: 'LGTM',
    category: 'Etiquette',
    definition: 'An acronym for "Looks Good To Me", frequently used by maintainers and reviewers to approve a pull request.',
    analogy: 'A rubber stamp of approval.',
    example: '"LGTM! Merging this into main now. Thanks for your contribution!"',
  },
  {
    term: 'Rebase',
    category: 'Git',
    definition: 'A Git operation that reapplies your commits on top of another base tip, creating a linear history without unnecessary merge commits.',
    analogy: 'Picking up your stack of edits and placing them neatly on top of the newest stack of papers.',
    example: 'git fetch upstream && git rebase upstream/main',
  },
  {
    term: 'Squash',
    category: 'Git',
    definition: 'Combining multiple small work-in-progress commits into a single clean commit before merging into main.',
    analogy: 'Compacting 5 rough draft pages into 1 clean summary paragraph for the final book.',
    example: 'Maintainers often select "Squash and merge" when landing your PR.',
  },
  {
    term: 'Staging Area (Index)',
    category: 'Git',
    definition: 'The intermediate staging phase where you prepare files with "git add" before permanently committing them.',
    analogy: 'The loading dock where you put boxes before sealing the shipping container (commit).',
    example: 'git add README.md stages the file for commit.',
  },
  {
    term: 'Code of Conduct',
    category: 'Etiquette',
    definition: 'A document outlining expected community behavior, harassment policies, and inclusivity standards in an open-source project.',
    analogy: 'The community rules posted on the wall of a public workshop.',
    example: 'Ensuring respectful, welcoming language in all GitHub discussions.',
  },
];
