export type ActiveTab =
  | 'dashboard'
  | 'explainer'
  | 'issue-helper'
  | 'pr-guide'
  | 'idea-generator'
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
  problemSolved: string;
  targetAudience: string;
  suggestedTechnologies: string[];
  coreFeatures: string[];
  mvpRoadmap: Array<{ phase: string; milestone: string }>;
  aiFeature: string;
  beginnerNextSteps: string[];
  readmeSections: Array<{ heading: string; content: string }>;
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
  type: 'code' | 'issue' | 'idea';
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
