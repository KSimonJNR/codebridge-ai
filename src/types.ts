export type ActiveTab =
  | 'dashboard'
  | 'explainer'
  | 'issue-helper'
  | 'pr-guide'
  | 'idea-generator'
  | 'repo-finder'
  | 'roadmap'
  | 'chat-mentor'
  | 'tracker';

export type ProgrammingLanguage =
  | 'JavaScript'
  | 'TypeScript'
  | 'Python'
  | 'Java'
  | 'Go'
  | 'Rust'
  | 'C++'
  | 'Other';

export interface CodeExplanationResult {
  summary: string;
  importantLines: Array<{
    codeSnippet: string;
    explanation: string;
  }>;
  potentialBugs: Array<{
    title: string;
    explanation: string;
    severity: 'warning' | 'tip' | 'critical' | string;
  }>;
  example: string;
  mentorTips: string[];
  _meta?: {
    modelUsed?: string;
  };
}

export interface IssueStep {
  stepNumber: number;
  title: string;
  action: string;
  tips?: string;
}

export interface IssueAnalysisResult {
  plainEnglishProblem: string;
  likelyLanguage: string;
  difficultyLevel: 'Beginner-Friendly' | 'Intermediate' | 'Advanced' | string;
  difficultyReason: string;
  relevantSkills: string[];
  importantConcepts: string[];
  preInvestigationQuestions: string[];
  stepByStepPlan: IssueStep[];
  checklist: string[];
  howToVerify: string;
  samplePrTitle: string;
  samplePrBody: string;
  _meta?: {
    modelUsed?: string;
  };
}

export interface ProjectIdea {
  title: string;
  shortDescription: string;
  skillsToPractice: string[];
  suggestedFeatures: string[];
  clearFirstStep: string;
  problemSolved?: string;
  suggestedTechnologies?: string[];
  _meta?: {
    modelUsed?: string;
  };
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  language: string | null;
  stars: number;
  forks: number;
  openIssuesCount: number;
  topics: string[];
  hasGoodFirstIssues: boolean;
  goodFirstIssuesUrl: string;
  updatedAt: string;
  ownerAvatarUrl?: string;
  licenseName?: string;
}

export interface VerifiedRepoData {
  verified: boolean;
  fullName: string;
  description: string;
  defaultBranch: string;
  language: string | null;
  stars: number;
  openIssuesCount: number;
  htmlUrl: string;
  licenseName?: string;
}

export interface VerifiedIssueData {
  verified: boolean;
  number?: number;
  title: string;
  body: string;
  state?: string;
  htmlUrl?: string;
}

export interface ContributionRoadmap {
  verifiedRepo: VerifiedRepoData;
  verifiedIssue: VerifiedIssueData;
  overview: string;
  stages: {
    projectAndGuidelines: {
      title: string;
      explanation: string;
      contributingUrl?: string;
      keyRules: string[];
    };
    understandIssue: {
      title: string;
      plainEnglishSummary: string;
      expectedBehavior: string;
      potentialTraps: string[];
    };
    areasToInvestigate: {
      title: string;
      disclaimer: string;
      recommendedAreas: Array<{
        area: string;
        why: string;
      }>;
    };
    taskBreakdown: {
      title: string;
      tasks: Array<{
        id: string;
        task: string;
        details: string;
      }>;
    };
    testingStrategy: {
      title: string;
      testCommands: string[];
      manualSteps: string[];
      howToAvoidRegression: string;
    };
    gitAndPrWorkflow: {
      title: string;
      branchName: string;
      commands: Array<{
        cmd: string;
        purpose: string;
      }>;
      suggestedPrTitle: string;
      suggestedPrBody: string;
    };
  };
  interactiveChecklist: Array<{
    id: string;
    stage: string;
    text: string;
  }>;
  _meta?: {
    modelUsed?: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'mentor';
  text: string;
  timestamp: string;
}

export interface LearningTask {
  id: string;
  title: string;
  category: 'Git' | 'GitHub' | 'Code' | 'PR';
  completed: boolean;
  description: string;
}

export interface SavedItem {
  id: string;
  type: 'code' | 'issue' | 'idea' | 'repo' | 'roadmap';
  title: string;
  date: string;
  summary: string;
  details?: any;
}

export interface ServerStatus {
  configured: boolean;
  model: string;
  fallbackModels?: string[];
  ready: boolean;
}
