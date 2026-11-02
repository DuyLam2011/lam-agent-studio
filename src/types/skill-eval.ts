export type SkillChangeSeverity = 'breaking' | 'warning' | 'improvement' | 'neutral';

export interface SkillDiffAnomaly {
  type: 'trigger_drift' | 'safety_dropped' | 'verification_dropped' | 'token_bloat' | 'syntax_error';
  severity: SkillChangeSeverity;
  message: string;
  lineReference?: string;
}

export interface SkillDiffAnalysis {
  oldName: string;
  newName: string;
  linesAdded: number;
  linesRemoved: number;
  wordCountDelta: number;
  tokenCountDelta: number;
  anomalies: SkillDiffAnomaly[];
  severity: SkillChangeSeverity;
  isMergeSafe: boolean;
  verdict: 'APPROVED' | 'REQUIRES_CHANGES' | 'BLOCKED';
  summary: string;
}

export interface SkillEvalTestCase {
  id: string;
  name: string;
  description: string;
  userPrompt: string;
  expectedBehavior: {
    mustInclude?: string[];
    mustNotInclude?: string[];
    expectedToolCalls?: string[];
    maxTokens?: number;
  };
  weight?: number;
}

export interface SkillEvalSuite {
  skillId: string;
  skillName: string;
  schemaVersion: string;
  testCases: SkillEvalTestCase[];
}

export interface TestCaseEvalResult {
  testCaseId: string;
  name: string;
  passed: boolean;
  score: number;
  matchedIncludes: string[];
  missingIncludes: string[];
  forbiddenMatches: string[];
  tokensConsumed: number;
  executionTimeMs: number;
  failureReason?: string;
}

export interface SkillEvalReport {
  skillId: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  averageScore: number;
  totalTokens: number;
  status: 'passed' | 'failed' | 'warning';
  results: TestCaseEvalResult[];
  evaluatedAt: number;
}
