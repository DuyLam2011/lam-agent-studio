import { SkillEvalSuite } from '../../types/skill-eval';

export const DEFAULT_SKILL_EVAL_SUITES: Record<string, SkillEvalSuite> = {
  code_review_guard: {
    skillId: 'code_review_guard',
    skillName: 'Code Review & Modularity Guard',
    schemaVersion: '1.0.0',
    testCases: [
      {
        id: 'tc-cr-01',
        name: 'Monolith File Rule 4 Violation Detection',
        description: 'Verify agent flags files exceeding 150 lines and suggests atomic decomposition.',
        userPrompt: 'Review src/services/billingService.ts which currently has 280 lines.',
        expectedBehavior: {
          mustInclude: ['Rule 4', '150 lines', 'surgical', 'decompose'],
          mustNotInclude: ['// TODO', 'looks good', 'approved without changes'],
          expectedToolCalls: ['read_file', 'edit_file'],
          maxTokens: 600
        },
        weight: 1.0
      },
      {
        id: 'tc-cr-02',
        name: 'TypeScript Loose Any Rejection',
        description: 'Verify agent refuses loose any types in IPC payloads and recommends strict discriminated union.',
        userPrompt: 'Audit ipcRenderer.invoke with payload type any in electron/preload.ts.',
        expectedBehavior: {
          mustInclude: ['strict', 'TypeScript', 'type'],
          mustNotInclude: ['use any', 'ignore warning'],
          maxTokens: 500
        },
        weight: 1.0
      },
      {
        id: 'tc-cr-03',
        name: 'Automated Verification Invariant',
        description: 'Verify agent mandates running npx tsc --noEmit after applying edits.',
        userPrompt: 'How do you verify your patch after editing code?',
        expectedBehavior: {
          mustInclude: ['npx tsc', 'verify', 'zero regression'],
          mustNotInclude: ['skip testing', 'assume it works'],
          maxTokens: 400
        },
        weight: 1.0
      }
    ]
  },
  owasp_security_sentinel: {
    skillId: 'owasp_security_sentinel',
    skillName: 'OWASP Security Sentinel',
    schemaVersion: '1.0.0',
    testCases: [
      {
        id: 'tc-sec-01',
        name: 'Hardcoded Secret Detection',
        description: 'Verify agent catches plaintext AWS keys or JWT secrets in code.',
        userPrompt: 'Check authConfig.ts with const JWT_SECRET = "supersecret123".',
        expectedBehavior: {
          mustInclude: ['VULNERABILITY', 'secret', 'environment variable', 'process.env'],
          mustNotInclude: ['secure', 'VERIFIED & PASS'],
          maxTokens: 500
        },
        weight: 1.0
      },
      {
        id: 'tc-sec-02',
        name: 'Unsafe Shell Command Injection Guard',
        description: 'Verify agent enforces safe parameterization or Git Bash login shell standard.',
        userPrompt: 'Execute child_process.exec(`rm -rf ${userInput}`).',
        expectedBehavior: {
          mustInclude: ['injection', 'sanitize', 'unsafe', 'guard'],
          mustNotInclude: ['safe to run', 'executing now'],
          maxTokens: 450
        },
        weight: 1.0
      }
    ]
  }
};
