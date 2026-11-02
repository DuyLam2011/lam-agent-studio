import { SkillTemplate } from '../../types/skill-studio';

export const SKILL_TEMPLATES: SkillTemplate[] = [
  {
    id: 'tpl-code-review',
    title: 'Code Review & Modularity Guard',
    category: 'code-quality',
    description: 'Enforces Rule 4 (<150 lines/file), strict TypeScript types, and clean modular boundaries.',
    defaultFolderName: 'code_review_guard',
    tags: ['review', 'modularity', 'typescript'],
    templateContent: `---
name: code_review_guard
description: Review code changes for Rule 4 (<150 lines/file), TypeScript strict typing, and modularity. Trigger on "review code", "audit diff", or "/review".
---

# Code Review & Modularity Guard

## Inputs
- **Target Files**: Modified files or directory scope.
- **Ruleset**: Strictly <150 lines per file, 0 placeholders, 100% strict TypeScript.

## Workflow
1. Map modified files and measure line counts with 'wc -l'.
2. Scan for 'any' types, unhandled exceptions, and monolithic blocks.
3. Formulate atomic surgical patches using 'edit_file' to decompose large files.
4. Verify compilation with 'npx tsc --noEmit'.
`
  },
  {
    id: 'tpl-test-generator',
    title: 'Vitest Unit Test Suite Generator',
    category: 'testing',
    description: 'Generates robust test cases for pure functions, async services, and error handling branches.',
    defaultFolderName: 'unit_test_generator',
    tags: ['testing', 'vitest', 'coverage'],
    templateContent: `---
name: unit_test_generator
description: Generate comprehensive Vitest unit tests for TypeScript services. Trigger on "write tests", "test this function", or "/test".
---

# Vitest Unit Test Generator

## Inputs
- **Source File**: The TypeScript file requiring test coverage.
- **Coverage Goal**: 100% boundary conditions & error cases.

## Workflow
1. Inspect exported functions, signatures, and expected side effects.
2. Create test file under 'scripts/' or 'tests/' directory.
3. Write isolated test cases covering: happy path, null/undefined inputs, exception handling.
4. Execute via 'npx tsx scripts/test_*.ts' and confirm exit code 0.
`
  },
  {
    id: 'tpl-security-audit',
    title: 'OWASP Security Sentinel',
    category: 'security',
    description: 'Scans for unsanitized inputs, secrets leakage, path traversal, and IDOR vulnerabilities.',
    defaultFolderName: 'owasp_security_sentinel',
    tags: ['security', 'owasp', 'audit'],
    templateContent: `---
name: owasp_security_sentinel
description: Scan repository for OWASP Top 10 vulnerabilities, leaked API tokens, and unsafe shell execution. Trigger on "security audit", "check vulnerabilities", or "/security".
---

# OWASP Security Sentinel

## Inputs
- **Scope**: Active workspace files, .env files, and IPC handlers.

## Workflow
1. Scan for hardcoded credentials, JWT secrets, or sensitive tokens.
2. Check file path inputs for directory traversal (e.g. '../').
3. Validate child_process and terminal commands against shell injection.
4. Output structured Security Audit Verdict: [CLEAN] or [VULNERABILITY DETECTED].
`
  },
  {
    id: 'tpl-architecture-refactor',
    title: 'Monolith Decomposition & Architecture Refactor',
    category: 'architecture',
    description: 'Splits monolithic files into modular sub-modules, hooks, and decoupled utility services.',
    defaultFolderName: 'monolith_refactor',
    tags: ['refactor', 'architecture', 'clean-code'],
    templateContent: `---
name: monolith_refactor
description: Decompose monolithic files into clean submodules adhering to Single Responsibility Principle. Trigger on "split file", "refactor monolith", or "/refactor".
---

# Monolith Decomposition

## Inputs
- **Monolith File Path**: File exceeding 150 lines or mixing multiple responsibilities.

## Workflow
1. Analyze responsibilities: State management, UI rendering, Data transformations.
2. Extract sub-components into dedicated subfolders (e.g. 'components/modals/xyz/').
3. Preserve backwards-compatible exports via barrel export 'index.ts'.
4. Confirm zero regressions with 'npx tsc --noEmit' and 'npm run build:vite'.
`
  }
];
