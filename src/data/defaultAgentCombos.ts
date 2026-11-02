import { AgentCombo } from '../types/agent-combo';

export const standardBuiltinAgentCombos: AgentCombo[] = [
  {
    id: 'combo-fullstack-web',
    name: 'Fullstack Web (Frontend + Backend)',
    description: 'Balanced swarm for modern web apps. Combines UI/DOM auditing, REST/GraphQL endpoints, and automated QA gates.',
    icon: 'Layers',
    subagentIds: ['subagent-ui-inspector', 'subagent-browser-inspector', 'subagent-backend-reviewer', 'subagent-qa-reviewer'],
    flowType: 'sequential_pipeline',
    steps: [
      {
        id: 'step-ui-audit',
        subagentId: 'subagent-ui-inspector',
        stepName: '1. UI & Token Audit',
        objective: 'Validate Tailwind classes, responsive bounds, and Glassmorphic/Minimalist design tokens.',
        recommendedSkills: ['ui_ux_review', 'enhance_ui']
      },
      {
        id: 'step-browser-dom',
        subagentId: 'subagent-browser-inspector',
        stepName: '2. Live DOM Inspection',
        objective: 'Inspect rendered element hierarchy, computed CSS styles, and console warnings in preview.',
        recommendedSkills: ['enhance_ui']
      },
      {
        id: 'step-backend-review',
        subagentId: 'subagent-backend-reviewer',
        stepName: '3. Backend & API Review',
        objective: 'Verify endpoint logic, exception handling, and clean modular architecture.',
        recommendedSkills: ['code_review']
      },
      {
        id: 'step-qa-gate',
        subagentId: 'subagent-qa-reviewer',
        stepName: '4. QA & Anti-Regression Gate',
        objective: 'Confirm Rule 3 (<150 lines) modularity and verify no regressions in git diff.',
        recommendedSkills: ['code_review']
      }
    ],
    recommendedSkills: ['ui_ux_review', 'enhance_ui', 'code_review'],
    scope: 'global',
    isBuiltin: true,
    updatedAt: Date.now()
  },
  {
    id: 'combo-backend-api-security',
    name: 'Backend Server API High Security Standard',
    description: 'Hardened security & architecture ensemble for mission-critical APIs, auth microservices, and database models.',
    icon: 'ShieldCheck',
    subagentIds: ['subagent-backend-reviewer', 'subagent-security-harness', 'subagent-qa-reviewer'],
    flowType: 'sequential_pipeline',
    steps: [
      {
        id: 'step-api-architecture',
        subagentId: 'subagent-backend-reviewer',
        stepName: '1. API Architecture & DB Review',
        objective: 'Audit route contracts, SQL/NoSQL query parameters, async routines, and error boundaries.',
        recommendedSkills: ['code_review']
      },
      {
        id: 'step-security-redteam',
        subagentId: 'subagent-security-harness',
        stepName: '2. OWASP & Zero-Leak Audit',
        objective: 'Scan input boundaries for injection, secret leaks, broken access control, and sanitization.',
        recommendedSkills: ['security_audit']
      },
      {
        id: 'step-api-qa-gate',
        subagentId: 'subagent-qa-reviewer',
        stepName: '3. Strict QA & Rule 3 Gate',
        objective: 'Enforce strict typing, zero compiler errors, and modular sub-module separation.',
        recommendedSkills: ['code_review']
      }
    ],
    recommendedSkills: ['security_audit', 'code_review', 'debug_issue'],
    scope: 'global',
    isBuiltin: true,
    updatedAt: Date.now()
  },
  {
    id: 'combo-backend-cronjob-worker',
    name: 'Backend Cronjob & Async Worker',
    description: 'Resilient worker ensemble specialized in long-running jobs, scheduler cron tasks, terminal diagnostics, and leak prevention.',
    icon: 'Clock',
    subagentIds: ['subagent-backend-reviewer', 'subagent-log-analyzer', 'subagent-qa-reviewer'],
    flowType: 'sequential_pipeline',
    steps: [
      {
        id: 'step-worker-concurrency',
        subagentId: 'subagent-backend-reviewer',
        stepName: '1. Concurrency & Lifecycle Review',
        objective: 'Audit cron timers, worker job queues, memory footprint, and graceful termination.',
        recommendedSkills: ['code_review', 'automation']
      },
      {
        id: 'step-log-diagnostics',
        subagentId: 'subagent-log-analyzer',
        stepName: '2. Terminal & Stack Trace Diagnostics',
        objective: 'Strip noisy output, inspect daemon exit codes, and diagnose uncaught exceptions.',
        recommendedSkills: ['debug_issue']
      },
      {
        id: 'step-worker-qa-gate',
        subagentId: 'subagent-qa-reviewer',
        stepName: '3. QA Regression Verification',
        objective: 'Ensure worker jobs run idempotently without side-effects or regressions.',
        recommendedSkills: ['code_review']
      }
    ],
    recommendedSkills: ['automation', 'debug_issue', 'code_review'],
    scope: 'global',
    isBuiltin: true,
    updatedAt: Date.now()
  },
  {
    id: 'combo-rapid-refactor-duo',
    name: 'Rapid Code & Refactoring Duo',
    description: 'Lean two-agent combo for swift code modifications, surgical patches, and strict modularity.',
    icon: 'Sparkles',
    subagentIds: ['subagent-backend-reviewer', 'subagent-qa-reviewer'],
    flowType: 'lead_delegation',
    steps: [
      {
        id: 'step-rapid-review',
        subagentId: 'subagent-backend-reviewer',
        stepName: '1. Code Modification Review',
        objective: 'Fast check of logic and architecture adherence.',
        recommendedSkills: ['code_review']
      },
      {
        id: 'step-rapid-gate',
        subagentId: 'subagent-qa-reviewer',
        stepName: '2. Rule 3 Verification',
        objective: 'Guarantee file stays under 150 lines.',
        recommendedSkills: ['code_review']
      }
    ],
    recommendedSkills: ['code_review', 'optimize_codebase'],
    scope: 'global',
    isBuiltin: true,
    updatedAt: Date.now()
  }
];
