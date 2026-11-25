import { BROWSER_TOOL_DEFINITIONS } from './browserToolDefinitions';

export interface ToolParam {
  type: string;
  description: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  properties: Record<string, ToolParam>;
  required?: string[];
  readOnly: boolean;
}

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file at path, optionally restricted to a 1-based line range (startLine..endLine).',
    properties: { path: { type: 'string', description: 'Relative path to file' }, startLine: { type: 'number', description: '1-based starting line' }, endLine: { type: 'number', description: '1-based ending line' } },
    required: ['path'],
    readOnly: true
  },
  {
    name: 'patch_file',
    description: 'Replace an exact targetContent string in a file with replacementContent.',
    properties: { path: { type: 'string', description: 'Relative path to file' }, targetContent: { type: 'string', description: 'Exact string to be replaced' }, replacementContent: { type: 'string', description: 'Replacement text' } },
    required: ['path', 'targetContent', 'replacementContent'],
    readOnly: false
  },
  {
    name: 'write_file',
    description: 'Create a new file or fully overwrite a file with the given content.',
    properties: { path: { type: 'string', description: 'File path to write' }, content: { type: 'string', description: 'Full file content' } },
    required: ['path', 'content'],
    readOnly: false
  },
  {
    name: 'run_command',
    description: 'Run a shell command in the workspace (Git Bash, WSL, or PowerShell according to user settings).',
    properties: { command: { type: 'string', description: 'Shell command to execute' } },
    required: ['command'],
    readOnly: false
  },
  {
    name: 'delegate_to_subagent',
    description: 'Delegate a focused task to a specialized subagent persona (e.g. subagent-task-planner, subagent-code-executor, subagent-backend-reviewer, subagent-security-harness, subagent-qa-reviewer, subagent-web-doc-analytic) and receive structured analysis.',
    properties: {
      subagentId: { type: 'string', description: 'Target subagent ID (e.g. subagent-task-planner, subagent-security-harness, subagent-backend-reviewer, subagent-web-doc-analytic)' },
      task: { type: 'string', description: 'Specific task prompt or inspection goal for the subagent' },
      targetScope: { type: 'string', description: 'Optional target files or directories for the subagent to inspect' }
    },
    required: ['subagentId', 'task'],
    readOnly: false
  },
  {
    name: 'query_code_graph',
    description: 'Query the Graphify localized codebase knowledge graph for symbols, callers, callees, definitions, and dependencies without reading whole files.',
    properties: { query: { type: 'string', description: 'Symbol name, file, or architectural concept to inspect' } },
    required: ['query'],
    readOnly: true
  },
  {
    name: 'recall_agent_memory',
    description: 'Associative multi-hop search across graph memory (ADRs, past architectural decisions, temporal conventions).',
    properties: { query: { type: 'string', description: 'Keywords or concept to recall from graph memory' } },
    required: ['query'],
    readOnly: true
  },
  {
    name: 'build_code_graph',
    description: 'Re-index the workspace knowledge graph into .agents/graph/code_graph.json.',
    properties: {},
    readOnly: false
  },
  {
    name: 'git_status',
    description: 'Current git status: branch, modified, staged and untracked files.',
    properties: {},
    readOnly: true
  },
  {
    name: 'git_diff',
    description: 'Git diff of working tree (or staged) changes, optionally limited to one path.',
    properties: { path: { type: 'string', description: 'Optional file path' }, staged: { type: 'boolean', description: 'Inspect staged changes (--staged)' } },
    readOnly: true
  },
  {
    name: 'js',
    description: 'Execute Node.js code in the workspace with access to node:fs/promises and node:path.',
    properties: { code: { type: 'string', description: 'JavaScript/Node.js code to execute' } },
    required: ['code'],
    readOnly: false
  },
  ...BROWSER_TOOL_DEFINITIONS,
  {
    name: 'read_skill',
    description: 'Read the complete instructions and checklists of an available specialized skill.',
    properties: { skillName: { type: 'string', description: 'Name or folder of the skill to read' } },
    required: ['skillName'],
    readOnly: true
  },
  {
    name: 'code_mode_eval',
    description: '⚡ Code Mode (Default): Execute a programmatic JavaScript workflow script that chains and filters tool actions locally. Use this to search, read, filter, or patch files in a single turn without dumping raw intermediate logs into context.',
    properties: { script: { type: 'string', description: 'JavaScript code bundling tools.search(), tools.read(), tools.patch(), etc.' }, actionName: { type: 'string', description: 'Descriptive title for the workflow' } },
    required: ['script'],
    readOnly: false
  },
  {
    name: 'verify_project_invariants',
    description: 'Run the deterministic 4-tier verification harness (Typecheck, Tests, Build, and Rule 4 Modularity Audit).',
    properties: { skipBuild: { type: 'boolean', description: 'Skip production build step' }, testFilter: { type: 'string', description: 'Optional path filter' } },
    readOnly: true
  },
  {
    name: 'verify_ci_cd',
    description: 'Execute the dedicated CI/CD, lint, workflow syntax, and multi-tier verification test suite with composite error diagnostics and self-healing guidance.',
    properties: {
      skipBuild: { type: 'boolean', description: 'Skip production build step' },
      testFilter: { type: 'string', description: 'Optional test script or path filter' },
      maxAttempts: { type: 'number', description: 'Max self-healing loop attempts (default: 1 for single check, up to 3 for loop)' }
    },
    readOnly: true
  },
  {
    name: 'inspect_external_agents',
    description: 'Inspect active external Claude Code, OpenAI Codex, and Google Antigravity UI/CLI sessions on this machine and extract recent commands and working context for Father Agent.',
    properties: {
      maxPerProvider: { type: 'number', description: 'Max recent sessions per external agent provider (default: 4)' }
    },
    readOnly: true
  }
];

export const TOOL_DEFINITIONS = AGENT_TOOLS;
