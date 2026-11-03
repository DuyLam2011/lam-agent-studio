import { SkillCategory } from './skills';
import { SkillEvalSuite } from './skill-eval';

export interface AnalyticSkillDraftRequest {
  workspaceId: string;
  workspaceName: string;
  targetRepoPath: string;
  targetRepoName: string;
  contextTag: string;
  // 3 required specification sections:
  projectWorkDirection: string; // Section 1: Project context & current technical trajectory
  desiredSkillObjectives: string; // Section 2: Desired skill capabilities & workflow duties
  qualityInvariants: string; // Section 3: Safety constraints, test assertions & boundaries
}

export interface SkillCapabilityAnalysis {
  primaryRole: string; // English: Executive role summary
  supportedTriggers: string[]; // English: Keywords, slash commands & router triggers
  keyResponsibilities: string[]; // English: Step-by-step actions executed
  orchestratedTools: string[]; // English: Tool capabilities authorized
  safetyBoundaries: string[]; // English: Sandbox limits and forbidden mutations
  expectedOutputs: string[]; // English: Concrete artifacts & deliverables
  summaryMarkdown: string; // English: Renderable markdown specification
}

export interface ScannedRepoIntelligence {
  repoName: string;
  rootPath: string;
  language: string;
  frameworks: string[];
  packageManager: string;
  hasTypeScript: boolean;
  hasTests: boolean;
  fileCount: number;
  detectedPatterns: string[];
}

export interface AnalyticSkillSynthesisResult {
  suggestedName: string;
  suggestedFolderName: string;
  suggestedCategory: SkillCategory;
  suggestedDescription: string;
  generatedSkillContent: string;
  capabilityAnalysis: SkillCapabilityAnalysis;
  generatedEvalSuite: SkillEvalSuite;
  repoIntelligenceSummary: string;
}
