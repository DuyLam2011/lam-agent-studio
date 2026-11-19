import { ClarificationPrediction } from '../../types/clarification-predictor';
import { AgentDecisionLevel } from '../../types/settings-center';

interface PredictorContext {
  activeFilePath?: string;
  diffs?: any[];
  history?: any[];
  decisionLevel?: AgentDecisionLevel;
}

const THRESHOLD_MAP: Record<AgentDecisionLevel, number> = {
  autonomous: 90,
  balanced: 65,
  inquisitive: 40,
  rigorous: 20
};

export const predictClarificationNeeds = (userGoal: string, context?: PredictorContext): ClarificationPrediction => {
  const goal = (userGoal || '').trim();
  const lower = goal.toLowerCase();
  const decisionLevel = context?.decisionLevel || 'balanced';
  const threshold = THRESHOLD_MAP[decisionLevel];

  // Anti-loop gate: User confirming option, answering questionnaire, or targeting explicit file
  const isDirectAnswer = /(?:proceed with|selected|option\s+[a-c]|confirmed|phương án|chọn|áp dụng|run now)/i.test(lower);
  const hasExactTarget = context?.activeFilePath || /(?:src\/|electron\/|\.tsx?|\.json|\.css)/i.test(lower);
  if (isDirectAnswer || (hasExactTarget && !/drop|rm\s+-rf|delete\s+all|reset\s+--hard/i.test(lower))) {
    return {
      needsClarification: false, necessityScore: 10, category: 'ambiguous_scope',
      summary: 'Grounded target detected; ready for direct execution.', inferredRisks: [],
      prerequisites: [], questions: [], recommendedAnswerSummary: 'Direct execution'
    };
  }

  // 1. Destructive & High-Risk Command Gate (Necessity 95)
  if (/drop\s+database|delete\s+all|rm\s+-rf|del\s+\/s|reset\s+--hard|format\s+[a-z]:|truncate/i.test(lower)) {
    return {
      needsClarification: 95 >= threshold, necessityScore: 95, category: 'destructive_risk',
      summary: 'High-impact irreversible operation detected in user prompt.',
      inferredRisks: ['Permanent data loss', 'Uncommitted git changes wiped', 'Destructive schema reset'],
      prerequisites: [{ key: 'safety_gate', label: 'Explicit User Confirmation', status: 'missing' }],
      questions: [{
        id: 'q-destructive-safety', question: 'How should the agent execute this high-impact operation?', category: 'destructive_risk',
        options: [
          { id: 'opt-backup-dryrun', label: 'Create Git Snapshot & Dry Run First', description: 'Safeguard state and list affected resources before deleting', badge: '(Recommended)', impact: 'Zero risk', isRecommended: true, promptDirective: 'Perform dry run and create backup snapshot before execution' },
          { id: 'opt-surgical-delete', label: 'Targeted Scoped Execution', description: 'Limit deletion strictly to specified directory without touching configs', badge: 'Scoped', impact: 'Moderate risk', promptDirective: 'Execute scoped deletion strictly within target bounds' },
          { id: 'opt-force-override', label: 'Force Immediate Execution', description: 'Execute directly without confirmation prompts', badge: '⚠️ High Risk', impact: 'Irreversible', promptDirective: 'Force direct execution of command' }
        ]
      }],
      recommendedAnswerSummary: 'Create backup snapshot and dry-run affected files first.'
    };
  }

  // 2. Authentication & Session Strategy (Necessity 78)
  if (/auth|login|oauth|jwt|session|signup|sso|token/i.test(lower) && !/jwt|oauth|cookie|session/i.test(lower)) {
    return {
      needsClarification: 78 >= threshold, necessityScore: 78, category: 'prerequisite_missing',
      summary: 'Authentication feature requested without session or credential storage strategy.',
      inferredRisks: ['Architecture mismatch (Token vs Cookie)', 'Insecure credential persistence'],
      prerequisites: [{ key: 'auth_strategy', label: 'Session / Token Mechanism', status: 'missing' }],
      questions: [{
        id: 'q-auth-strategy', question: 'Which authentication architecture should be integrated?', category: 'prerequisite_missing',
        options: [
          { id: 'opt-oauth-pkce', label: 'OAuth 2.0 PKCE with Secure Storage', description: 'Production-grade enterprise auth with token refresh rotation', badge: '(Recommended)', impact: 'Best security', isRecommended: true, promptDirective: 'Implement OAuth 2.0 PKCE with token refresh' },
          { id: 'opt-jwt-bearer', label: 'Lightweight JWT Bearer Tokens', description: 'Fast stateless auth using Bearer headers', badge: '⚡ Speed', impact: 'Rapid setup', promptDirective: 'Implement stateless JWT Bearer token authentication' },
          { id: 'opt-session-cookie', label: 'HTTP-Only Session Cookies', description: 'Browser-managed cookies with CSRF defense boundary', badge: '🔒 Web Standard', impact: 'High compatibility', promptDirective: 'Implement HTTP-only session cookies with CSRF protection' }
        ]
      }],
      recommendedAnswerSummary: 'OAuth 2.0 PKCE with secure token storage.'
    };
  }

  // 3. Database & Persistence Layer (Necessity 72)
  if (/database|db|schema|table|persist|store data|storage engine/i.test(lower) && !/sqlite|postgres|mysql|localstorage|indexeddb/i.test(lower)) {
    return {
      needsClarification: 72 >= threshold, necessityScore: 72, category: 'dependency_choice',
      summary: 'Data persistence requested without target database engine specification.',
      inferredRisks: ['Heavy unneeded dependencies', 'Local vs Cloud persistence divergence'],
      prerequisites: [{ key: 'storage_engine', label: 'Database / Storage Engine', status: 'missing' }],
      questions: [{
        id: 'q-storage-engine', question: 'Which storage engine should the application use?', category: 'dependency_choice',
        options: [
          { id: 'opt-sqlite-drizzle', label: 'Embedded SQLite (Prisma / Drizzle)', description: 'Zero-configuration embedded database for standalone desktop IDE', badge: '(Recommended)', impact: 'Optimal for Electron', isRecommended: true, promptDirective: 'Use embedded SQLite with typed migrations' },
          { id: 'opt-client-indexeddb', label: 'Client-side LocalStorage / IndexedDB', description: 'Zero backend server needed; persistence inside Renderer process', badge: '📦 Standalone', impact: 'Lightweight', promptDirective: 'Use client-side IndexedDB with Zustand persistence' },
          { id: 'opt-external-sql', label: 'External PostgreSQL / MySQL Service', description: 'Connects to remote server over network socket', badge: '🌐 Network DB', impact: 'Requires running DB', promptDirective: 'Configure external PostgreSQL database connection' }
        ]
      }],
      recommendedAnswerSummary: 'Embedded SQLite with typed schema migrations.'
    };
  }

  // 4. Broad Refactoring or Architecture Overhaul (Necessity 82)
  if (/refactor|rewrite|overhaul|rearchitect|clean up|tối ưu/i.test(lower) && goal.length < 50) {
    return {
      needsClarification: 82 >= threshold, necessityScore: 82, category: 'architectural_tradeoff',
      summary: 'Broad refactoring requested without boundary contracts or risk constraints.',
      inferredRisks: ['Breaking regression in untested modules', 'Rule 4 violation with monolithic files'],
      prerequisites: [{ key: 'refactor_scope', label: 'Refactoring Boundary & Depth', status: 'ambiguous' }],
      questions: [{
        id: 'q-refactor-depth', question: 'What depth of refactoring should the agent apply?', category: 'architectural_tradeoff',
        options: [
          { id: 'opt-surgical-rule4', label: 'Surgical Modularization (<150 lines)', description: 'Split monolithic files into submodules respecting Rule 4 with zero logic mutations', badge: '(Recommended)', impact: '0% regression risk', isRecommended: true, promptDirective: 'Apply surgical modular refactoring under Rule 4 (<150 lines) with zero regressions' },
          { id: 'opt-full-overhaul', label: 'Deep Architectural Redesign', description: 'Clean-slate refactoring updating state stores, hooks and interfaces', badge: '🚀 Comprehensive', impact: 'May require API updates', promptDirective: 'Perform deep architectural overhaul across stores and components' },
          { id: 'opt-audit-only', label: 'Static Analysis & Audit Report First', description: 'Inspect AST complexity and list recommendations without modifying files', badge: '🔍 Read-Only', impact: 'Zero code mutations', promptDirective: 'Generate static analysis audit report first without editing files' }
        ]
      }],
      recommendedAnswerSummary: 'Surgical modularization (<150 lines) preserving existing logic.'
    };
  }

  return {
    needsClarification: false, necessityScore: 25, category: 'ambiguous_scope',
    summary: `Task contains sufficient direction for autonomous execution at ${decisionLevel} level.`,
    inferredRisks: [], prerequisites: [], questions: [], recommendedAnswerSummary: 'Direct autonomous execution.'
  };
};

export const compileClarificationDirective = (
  prediction: ClarificationPrediction,
  selectedOptionMap: Record<string, string[]>,
  customConstraint?: string
): string => {
  const chosenDirectives: string[] = [];
  for (const q of prediction.questions) {
    const selectedIds = selectedOptionMap[q.id] || [];
    for (const optId of selectedIds) {
      const opt = q.options.find(o => o.id === optId);
      if (opt) chosenDirectives.push(`- **${q.question}**: ${opt.label} (${opt.promptDirective})`);
    }
  }

  return [
    `[USER CLARIFICATION CONFIRMED - EXECUTE WITH RESOLVED PREREQUISITES]`,
    chosenDirectives.length > 0 ? `### Confirmed Decisions:\n${chosenDirectives.join('\n')}` : '',
    customConstraint?.trim() ? `### Additional User Constraints:\n- ${customConstraint.trim()}` : '',
    `\nProceed with implementation adhering strictly to Rule 4 (<150 lines/file) and chosen options.`
  ].filter(Boolean).join('\n\n');
};
