import { SkillScopeType } from './skills';

export interface SkillTemplate {
  id: string;
  title: string;
  category: 'code-quality' | 'testing' | 'security' | 'architecture' | 'devops' | 'workflow';
  description: string;
  defaultFolderName: string;
  tags: string[];
  templateContent: string;
}

export interface SkillQualityReport {
  score: number;
  isFrontmatterValid: boolean;
  hasClearTrigger: boolean;
  wordCount: number;
  isUnderWordLimit: boolean;
  estimatedTokens: number;
  hasVerificationStep: boolean;
  hasSafetyConstraint: boolean;
  parsedName?: string;
  parsedDescription?: string;
  recommendations: string[];
}

export interface SkillDryRunResult {
  skillId: string;
  skillName: string;
  matchedKeywords: string[];
  routingConfidence: number;
  simulatedSystemContext: string;
  estimatedTokens: number;
  status: 'pass' | 'warning' | 'fail';
  diagnosticNotes: string[];
}

export interface SkillStudioFormData {
  name: string;
  folderName: string;
  description: string;
  content: string;
  category: 'workflow' | 'testing' | 'security' | 'architecture' | 'devops' | 'code-quality' | 'general';
  scope: SkillScopeType;
  targetId?: string;
}
