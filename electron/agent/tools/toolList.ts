export interface ToolParam {
  type: 'string' | 'integer' | 'boolean';
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
    description: 'Read a workspace file. Use startLine/endLine to window large files. Always read a file before editing it.',
    properties: {
      path: { type: 'string', description: 'Relative or absolute file path inside the workspace' },
      startLine: { type: 'integer', description: 'Optional 1-based first line' },
      endLine: { type: 'integer', description: 'Optional 1-based last line (inclusive)' }
    },
    required: ['path'],
    readOnly: true
  },
  {
    name: 'search_files',
    description: 'Search file contents across the workspace (respects .gitignore). Returns "path:line: text" matches. Use it to locate symbols before reading files.',
    properties: {
      query: { type: 'string', description: 'Text or regular expression to search for' },
      isRegex: { type: 'boolean', description: 'Treat query as a JavaScript regular expression' },
      path: { type: 'string', description: 'Optional sub-directory to limit the search' },
      maxResults: { type: 'integer', description: 'Maximum matches to return (default 80)' }
    },
    required: ['query'],
    readOnly: true
  },
  {
    name: 'list_directory',
    description: 'List files and folders of a directory (defaults to the workspace root).',
    properties: { path: { type: 'string', description: 'Directory path, optional' } },
    readOnly: true
  },
  {
    name: 'edit_file',
    description: 'Surgically replace an exact snippet (targetContent) with replacementContent. Prefer this over write_file for existing files.',
    properties: {
      path: { type: 'string', description: 'File path to modify' },
      targetContent: { type: 'string', description: 'Exact existing text to replace, including indentation' },
      replacementContent: { type: 'string', description: 'Replacement text' }
    },
    required: ['path', 'targetContent', 'replacementContent'],
    readOnly: false
  },
  {
    name: 'write_file',
    description: 'Create a new file or fully overwrite a file with the given content.',
    properties: {
      path: { type: 'string', description: 'File path to write' },
      content: { type: 'string', description: 'Full file content' }
    },
    required: ['path', 'content'],
    readOnly: false
  },
  {
    name: 'run_command',
    description: 'Run a shell command in the workspace (Git Bash login shell on Windows when available). Use for builds, tests and type-checks to verify changes.',
    properties: { command: { type: 'string', description: 'Shell command to execute' } },
    required: ['command'],
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
    properties: {
      path: { type: 'string', description: 'Optional file path' },
      staged: { type: 'boolean', description: 'Inspect staged changes (--staged)' }
    },
    readOnly: true
  },
  {
    name: 'js',
    description: 'Execute Node.js code in the workspace with access to node:fs/promises, node:path and node:child_process. Useful for batch file inspection or data transforms.',
    properties: { code: { type: 'string', description: 'JavaScript/Node.js code to execute' } },
    required: ['code'],
    readOnly: false
  },
  {
    name: 'browser_navigate',
    description: 'Navigate browser preview to a local or web URL (e.g. http://localhost:5173).',
    properties: { url: { type: 'string', description: 'Target URL to visit' } },
    required: ['url'],
    readOnly: false
  },
  {
    name: 'browser_inspect_element',
    description: 'Inspect a rendered DOM element in browser preview. Returns tag, selector, text, bounding box, and computed CSS styles.',
    properties: { selector: { type: 'string', description: 'CSS selector (e.g. "button.primary", "#login-form")' } },
    required: ['selector'],
    readOnly: true
  },
  {
    name: 'browser_screenshot',
    description: 'Capture visual screenshot telemetry of the rendered UI preview.',
    properties: {},
    readOnly: true
  },
  {
    name: 'browser_console_logs',
    description: 'Retrieve recent browser console logs, warnings, and runtime errors.',
    properties: {},
    readOnly: true
  },
  {
    name: 'browser_eval',
    description: 'Evaluate JavaScript safely inside the rendered browser page context.',
    properties: { code: { type: 'string', description: 'JavaScript expression to run' } },
    required: ['code'],
    readOnly: false
  },
  {
    name: 'read_skill',
    description: 'Read the complete instructions, workflow directives, and checklists of an available specialized skill (e.g. "security_audit", "code_review", "debug_issue", "optimize_codebase").',
    properties: { skillName: { type: 'string', description: 'Name or folder of the skill to read' } },
    required: ['skillName'],
    readOnly: true
  },
  {
    name: 'verify_project_invariants',
    description: 'Run the deterministic 4-tier verification harness (Static Typecheck, Unit/Regression Test Suite, Production Build, and Rule 4 <150 lines Modularity Audit). Use after implementing code to guarantee zero regressions.',
    properties: {
      skipBuild: { type: 'boolean', description: 'Skip production build step for rapid incremental testing' },
      testFilter: { type: 'string', description: 'Optional path filter for unit tests' }
    },
    readOnly: true
  }
];
