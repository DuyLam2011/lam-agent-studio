export interface PromptPattern {
  id: string;
  label: string;
  description: string;
  icon: string;
  template: string;
  suggestedSubagent?: string;
  estimatedTokens: number;
}

export interface SubagentRecommendation {
  id: string;
  name: string;
  tag: string;
  role: string;
  reason: string;
  confidence: number;
}

export interface ContextOptimizationAction {
  id: string;
  title: string;
  description: string;
  estimatedSavingsTokens: number;
  percentageSavings: number;
  actionType: 'attach_git' | 'use_active_file_only' | 'enable_concise_mode' | 'clear_bulky_attachments' | 'window_active_file';
}

export interface TokenEstimationReport {
  promptTokens: number;
  attachmentTokens: number;
  systemContextTokens: number;
  totalTokens: number;
  potentialSavingsTokens: number;
  potentialSavingsPercent: number;
  recommendedActions: ContextOptimizationAction[];
  recommendedSubagents: SubagentRecommendation[];
}

export const PROMPT_PATTERNS: PromptPattern[] = [
  {
    id: 'security_audit',
    label: 'Security Audit',
    icon: 'Shield',
    description: 'OWASP Top 10, sanitization & secrets scan',
    template: 'Scan active file and recent git changes for OWASP Top 10 vulnerabilities, unsanitized inputs, and secrets leaks. Output structured verdict and exact patch remediation.',
    suggestedSubagent: 'subagent-security-harness',
    estimatedTokens: 35
  },
  {
    id: 'code_review',
    label: 'Code Review',
    icon: 'CheckCircle2',
    description: 'Architecture & Rule 3 modularity (<150 lines)',
    template: '@backend-reviewer Review git repository changes for correctness, error handling, and Rule 3 compliance (<150 lines/file). Formulate surgical patches for Father Agent.',
    suggestedSubagent: 'subagent-backend-reviewer',
    estimatedTokens: 38
  },
  {
    id: 'surgical_patch',
    label: 'Surgical Patch',
    icon: 'FileCode',
    description: 'Apply targeted bugfix via edit_file',
    template: 'Fix the issue by applying surgical edit_file changes. Preserve existing docstrings and comments, ensure 100% strict TypeScript types, and avoid modifying unrelated code.',
    suggestedSubagent: 'lead-architect',
    estimatedTokens: 32
  },
  {
    id: 'runtime_diagnosis',
    label: 'Log Diagnosis',
    icon: 'Terminal',
    description: 'Root cause analysis from logs & errors',
    template: '@log-analyzer Parse terminal logs and stack trace to identify root cause and exact failure line. Provide compact 3-bullet diagnosis for Father Agent.',
    suggestedSubagent: 'subagent-log-analyzer',
    estimatedTokens: 34
  },
  {
    id: 'ui_inspection',
    label: 'UI & Design Audit',
    icon: 'Palette',
    description: 'Responsive, WCAG contrast & token compliance',
    template: '@ui-inspector Inspect component markup and Tailwind styles for WCAG contrast, responsive layout bounds, and clean dark/light mode surface tokens.',
    suggestedSubagent: 'subagent-ui-inspector',
    estimatedTokens: 32
  },
  {
    id: 'concise_exec',
    label: 'Concise Mode',
    icon: 'Zap',
    description: 'Save ~60% tokens with direct action',
    template: 'Execute with maximum token efficiency: minimal conversational explanation, prioritize immediate code edits via edit_file or write_file, verify clean compilation.',
    suggestedSubagent: 'lead-architect',
    estimatedTokens: 28
  },
  {
    id: 'browser_inspect',
    label: 'Browser & DOM Audit',
    icon: 'Globe',
    description: 'Inspect live rendered UI & extract DOM elements',
    template: '@browser-inspector Navigate to dev server, inspect rendered DOM hierarchy, check console logs for errors, and report UI layout defects to Father Agent.',
    suggestedSubagent: 'subagent-browser-inspector',
    estimatedTokens: 35
  }
];
