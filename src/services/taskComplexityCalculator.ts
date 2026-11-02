export type TaskComplexityTier = 'L1_RAPID' | 'L2_BALANCED' | 'L3_COMPLEX' | 'L4_FRONTIER';

export interface ComplexityDimensionBreakdown {
  scopeScale: number;
  securityCriticality: number;
  architecturalDepth: number;
  cognitiveDifficulty: number;
}

export interface TaskComplexityReport {
  score: number;
  tier: TaskComplexityTier;
  dimensions: ComplexityDimensionBreakdown;
  summary: string;
  recommendedReasoningEffort: 'low' | 'medium' | 'high';
  recommendedOutputMode: 'ultra_concise' | 'structured_standard' | 'architectural_rigorous';
  thinkingBadgeText: string;
}

export interface ComplexityCalculationParams {
  taskText: string;
  contextAttachments?: any[];
  activeFilePath?: string;
  subagentRole?: string;
}

export const calculateTaskComplexity = (params: ComplexityCalculationParams): TaskComplexityReport => {
  const { taskText = '', contextAttachments = [], activeFilePath, subagentRole = '' } = params;
  const lower = `${taskText} ${subagentRole}`.toLowerCase();

  // Dimension 1: Scope & Context Scale (0 - 25)
  let scope = Math.min(10, Math.ceil((taskText.length / 300) * 2));
  if (contextAttachments.length > 0) scope += Math.min(15, contextAttachments.length * 4);
  if (activeFilePath) scope += 5;
  scope = Math.min(25, Math.max(0, scope));

  // Dimension 2: Security & Mission Criticality (0 - 25)
  let security = 0;
  if (/security|owasp|vulnerab|crypto|token|secret|auth|jwt|injection|sqli|xss|cors|leak|pentest|redteam/i.test(lower)) {
    security = 25;
  } else if (/payment|billing|database|schema|migration|drop|admin|credential|permission/i.test(lower)) {
    security = 18;
  } else if (/env|config|key|storage/i.test(lower)) {
    security = 10;
  }

  // Dimension 3: Architectural Depth & Multi-Module (0 - 25)
  let architecture = 0;
  if (/architect|refactor|monolith|rule 4|modular|decouple|distributed|race condition|lifecycle|deadlock|concurrency/i.test(lower)) {
    architecture = 25;
  } else if (/split file|subagent|workflow|pipeline|route|state management|store|zustand/i.test(lower)) {
    architecture = 18;
  } else if (/component|service|helper|controller/i.test(lower)) {
    architecture = 10;
  }

  // Dimension 4: Cognitive & Algorithmic Difficulty (0 - 25)
  let cognitive = 5;
  if (/algorithm|parser|ast|compiler|regex|optimize|benchmark|recursion|tree|graph|race condition|deadlock|concurrency|exploit|penetration/i.test(lower)) {
    cognitive = 25;
  } else if (/debug|crash|fix bug|exception|fail|trace|assert|unit test|audit|verify/i.test(lower)) {
    cognitive = 18;
  } else if (/format|lint|typo|rename|comment|style|css|html|markdown|label/i.test(lower)) {
    cognitive = 4;
  }

  // Bonus depth for specialized Security / Architect roles
  if (/security sentinel|redteam|lead architect|father agent/i.test(subagentRole.toLowerCase())) {
    cognitive = Math.min(25, cognitive + 5);
  }

  const rawScore = scope + security + architecture + cognitive;
  const score = Math.min(100, Math.max(5, rawScore));

  let tier: TaskComplexityTier = 'L2_BALANCED';
  let recommendedReasoningEffort: 'low' | 'medium' | 'high' = 'medium';
  let recommendedOutputMode: 'ultra_concise' | 'structured_standard' | 'architectural_rigorous' = 'structured_standard';

  if (score <= 25) {
    tier = 'L1_RAPID';
    recommendedReasoningEffort = 'low';
    recommendedOutputMode = 'ultra_concise';
  } else if (score <= 50) {
    tier = 'L2_BALANCED';
    recommendedReasoningEffort = 'medium';
    recommendedOutputMode = 'structured_standard';
  } else if (score <= 80) {
    tier = 'L3_COMPLEX';
    recommendedReasoningEffort = 'high';
    recommendedOutputMode = 'architectural_rigorous';
  } else {
    tier = 'L4_FRONTIER';
    recommendedReasoningEffort = 'high';
    recommendedOutputMode = 'architectural_rigorous';
  }

  const summary = `Task Complexity: ${score}/100 (${tier}) | Scope: ${scope}/25, Security: ${security}/25, Architecture: ${architecture}/25, Cognitive: ${cognitive}/25`;
  const thinkingBadgeText = `[TASK_COMPLEXITY: ${score}/100 · ${tier}]`;

  return {
    score,
    tier,
    dimensions: { scopeScale: scope, securityCriticality: security, architecturalDepth: architecture, cognitiveDifficulty: cognitive },
    summary,
    recommendedReasoningEffort,
    recommendedOutputMode,
    thinkingBadgeText
  };
};
