import { AgentCombo } from '../../types/agent-combo';

export const ciCdLoopHealerCombo: AgentCombo = {
  id: 'combo-ci-cd-loop-healer',
  name: 'CI/CD & Lint Self-Healing Ensemble',
  description: 'Autonomous loop for diagnosing GitHub Actions CI/CD failures, lint violations, and multi-tier regressions with iterative self-healing.',
  icon: 'RefreshCw',
  subagentIds: ['subagent-log-analyzer', 'subagent-code-executor', 'subagent-qa-reviewer', 'subagent-backend-reviewer'],
  flowType: 'sequential_pipeline',
  steps: [
    {
      id: 'step-ci-diagnostics',
      subagentId: 'subagent-log-analyzer',
      stepName: '1. CI/CD & Lint Diagnostics',
      objective: 'Inspect GitHub workflow logs, ESLint/TypeScript errors, and terminal stack traces.',
      recommendedSkills: ['ci_cd_self_healing', 'debug_issue']
    },
    {
      id: 'step-surgical-remediation',
      subagentId: 'subagent-code-executor',
      stepName: '2. Surgical Self-Healing Patch',
      objective: 'Apply surgical code patches adhering strictly to Rule 4 (<150 lines per file).',
      recommendedSkills: ['ci_cd_self_healing', 'code_review']
    },
    {
      id: 'step-ci-regression-gate',
      subagentId: 'subagent-qa-reviewer',
      stepName: '3. Multi-Tier Verification Gate',
      objective: 'Re-run local CI pipeline (typecheck, unit tests, build, invariants) until 100% clean.',
      recommendedSkills: ['ci_cd_self_healing', 'code_review']
    },
    {
      id: 'step-git-integrity',
      subagentId: 'subagent-backend-reviewer',
      stepName: '4. Git Diff & Architecture Audit',
      objective: 'Confirm zero secret leaks, clean git diff, and architecture invariant compliance.',
      recommendedSkills: ['code_review']
    }
  ],
  recommendedSkills: ['ci_cd_self_healing', 'debug_issue', 'code_review'],
  scope: 'global',
  isBuiltin: true,
  updatedAt: Date.now()
};
