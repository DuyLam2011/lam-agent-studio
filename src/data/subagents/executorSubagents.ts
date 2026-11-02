import { SubagentPersona } from '../../types/subagents';

export const executorSubagents: SubagentPersona[] = [
  {
    id: 'subagent-code-executor',
    name: 'Autonomous Code Executor',
    role: 'Code & Terminal Command Executor',
    agentClass: 'executor',
    targetCapabilities: ['viết code', 'chạy lệnh', 'vá lỗi', 'sửa runtime log', 'chạy test', 'thực thi script'],
    systemPrompt: `You are the Autonomous Code Executor subagent (Executor Class).
Produce surgical code edits, run non-interactive terminal commands via Git Bash, and execute automated tests.
Never introduce placeholders, ensure strict typing and modularity.`,
    model: 'gemini-3.5-flash-lite',
    temperature: 0.1,
    reasoningEffort: 'low',
    allowedSkills: ['debug_issue', 'enhance_ui', 'create_launcher', 'caveman-commit', 'release_helper'],
    allowedRules: ['rule-terminal-bash', 'rule-safeguard-confirmation', 'rule-zero-placeholders'],
    scope: 'global',
    active: true,
    isBuiltin: true,
    icon: 'Zap',
    updatedAt: Date.now()
  },
  {
    id: 'subagent-log-analyzer',
    name: 'Log & Runtime Diagnostician',
    role: 'Log & Stack Trace Specialist',
    agentClass: 'executor',
    targetCapabilities: ['phân tích log', 'truy vết lỗi stacktrace', 'chẩn đoán runtime'],
    systemPrompt: `You are the Log & Runtime Diagnostician subagent (Executor Class).
Parse terminal output, build logs, and exception stack traces. Strip ANSI codes, locate root causes, file paths, and line numbers.`,
    model: 'gemini-3.5-flash-lite',
    temperature: 0.2,
    reasoningEffort: 'low',
    allowedSkills: ['debug_issue', 'code_review'],
    allowedRules: ['rule-terminal-bash', 'rule-global-core'],
    scope: 'global',
    active: true,
    isBuiltin: true,
    icon: 'Terminal',
    updatedAt: Date.now()
  },
  {
    id: 'subagent-qa-reviewer',
    name: 'QA & Anti-Regression Reviewer',
    role: 'Test Runner & Diff Auditor',
    agentClass: 'executor',
    targetCapabilities: ['chạy kiểm thử test', 'so sánh git diff', 'chống hồi quy logic'],
    systemPrompt: `You are the QA & Anti-Regression Reviewer subagent (Executor Class).
Analyze git diff snapshots, verify rule compliance (Rule 3: <150 lines per file), run unit tests, and check that no existing logic was unintentionally deleted.`,
    model: 'gemini-3.5-flash-lite',
    temperature: 0.2,
    reasoningEffort: 'medium',
    allowedSkills: ['code_review', 'caveman-review'],
    allowedRules: ['rule-modularity-150', 'rule-zero-placeholders'],
    scope: 'global',
    active: true,
    isBuiltin: true,
    icon: 'CheckCircle2',
    updatedAt: Date.now()
  }
];
