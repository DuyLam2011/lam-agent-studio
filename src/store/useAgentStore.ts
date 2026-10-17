import { create } from 'zustand';
import { AgentRule, RuleScope, DetectedRepoRuleFile } from '../types/rules';
import { AgentSkill, DetectedRepoSkillFile } from '../types/skills';
import { AgentWorkflowItem } from '../types/workflows';
import { McpServerPlugin } from '../types/plugins';
import { SubagentPersona } from '../types/subagents';
import { ProjectMemoryItem } from '../types/memory';

export interface FileNode {
  name: string;
  isDirectory: boolean;
  path?: string;
  isWorkspace?: boolean;
  isIgnored?: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface SavedWorkspace {
  id: string;
  name: string;
  folders: string[];
}

interface SystemContext {
  cwd: string;
  workspaces: SavedWorkspace[];
  activeWorkspaceId: string | null;
  expandedFolders: Record<string, boolean>;
  fileTree: FileNode[]; // Top level files
  refreshCounter: number;
  showHiddenFiles?: boolean;
  editingWorkspaceId?: string | null;
}

export interface ContextMenuOptions {
  x: number;
  y: number;
  type: 'workspace' | 'repo' | 'folder' | 'file' | 'git_repo' | 'git_file';
  path: string;
  workspaceId: string;
  name: string;
}

interface ActiveRule {
  id: string;
  content: string;
}

interface AgentWorkflow {
  status: 'idle' | 'running' | 'error';
  currentTask: string | null;
}

interface ActiveFile {
  path: string;
  content: string;
  name?: string;
  isDirectory?: boolean;
  originalContent?: string;
  isDiff?: boolean;
  line?: number;
  searchQuery?: string;
  isPreview?: boolean;
}

export interface ToolCallItem {
  id: string;
  name: string;
  args: any;
  status: 'running' | 'success' | 'failed';
  result?: string;
  executionTimeMs?: number;
  autoApproved?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  text: string;
  thinking?: string;
  toolCalls?: ToolCallItem[];
  toolCall?: { name: string; args: any; result?: string };
  timestamp?: number;
}

export interface ContextAttachment {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder' | 'diff' | 'rule' | 'diagnostics';
  tokenEstimate: number;
  pinned?: boolean;
}

export type VibecodingMode = 'vibe' | 'chat' | 'plan' | 'review';
export type AutonomyLevel = 'full-auto' | 'ask-dangerous' | 'ask-all';
export type ReasoningEffort = 'off' | 'low' | 'medium' | 'high';
export type ContextPruningStrategy = 'auto-sliding' | 'caveman' | 'summarize';
import { PanelId, TerminalAgentConfig, TerminalAgentMode } from '../types/panel';
export type { PanelId, TerminalAgentConfig, TerminalAgentMode };
export { useRulesetStore } from './useRulesetStore';
export { useContextStore } from './useContextStore';

export interface EngineSettings {
  selectedModel: string;
  mode: VibecodingMode;
  temperature: number;
  maxTokens: number;
  reasoningEffort: ReasoningEffort;
  autonomyLevel: AutonomyLevel;
  pruningStrategy: ContextPruningStrategy;
  persona: 'architect' | 'vibecoder' | 'purist' | 'security';
  streamResponse: boolean;
  autoInjectGitDiff: boolean;
  autoInjectDiagnostics: boolean;
  customApiKey?: string;
  provider?: 'gemini' | 'openai' | 'ollama' | 'offline';
  baseUrl?: string;
}

export interface ConfigItem {
  id: string;
  name: string;
  description: string;
  active: boolean;
  type: 'skill' | 'plugin' | 'rule';
  icon?: string;
  disabled?: boolean;
}

interface AgentState {
  systemContext: SystemContext;
  activeRules: ActiveRule[];
  workflow: AgentWorkflow;
  wsStatus: string;
  activeFile: ActiveFile | null;
  gitStatuses: Record<string, string>; // Maps absolute file paths to 'M' | 'A' | 'U' | 'D'
  contextMenu: ContextMenuOptions | null;
  activeSidebarTab: 'explorer' | 'search' | 'git';
  searchTarget: string | null;
  searchQuery: string;
  searchFileQuery: string;
  gitTarget: string | null;
  githubToken: string | null;
  githubUser: { avatar_url: string, login: string } | null;
  isAccountModalOpen: boolean;
  isCloneModalOpen: boolean;
  isConfigModalOpen: boolean;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  openContextMenu: (options: ContextMenuOptions) => void;
  closeContextMenu: () => void;
  setAccountModalOpen: (open: boolean) => void;
  setCloneModalOpen: (open: boolean) => void;
  setConfigModalOpen: (open: boolean) => void;
  setGithubToken: (token: string | null) => void;
  setGithubUser: (user: { avatar_url: string, login: string } | null) => void;
  triggerRefresh: () => void;
  toggleHiddenFiles: () => void;
  setEditingWorkspaceId: (id: string | null) => void;
  setActiveSidebarTab: (tab: 'explorer' | 'search' | 'git') => void;
  setSearchTarget: (target: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchFileQuery: (query: string) => void;
  setGitTarget: (target: string | null) => void;
  setGitStatuses: (statuses: Record<string, string>) => void;
  setSystemContext: (context: SystemContext) => void;
  loadSettings: (settings: any) => void;
  createWorkspace: (name: string) => void;
  renameWorkspace: (workspaceId: string, name: string) => void;
  deleteWorkspace: (workspaceId: string) => void;
  addFolderToWorkspace: (workspaceId: string, folderPath: string) => void;
  toggleFolder: (path: string, expanded: boolean) => void;
  openTabs: ActiveFile[];
  activeTabIndex: number;
  openFile: (file: ActiveFile, forceNewTab?: boolean) => void;
  closeTab: (index: number) => void;
  setActiveTabIndex: (index: number) => void;
  pinTab: (index: number) => void;
  setActiveFile: (file: ActiveFile | null) => void;
  setActiveRules: (rules: ActiveRule[]) => void;
  setWorkflowStatus: (status: AgentWorkflow['status'], task?: string) => void;
  setWsStatus: (status: string) => void;

  rightPanelTab: 'chat' | 'context' | 'skills' | 'engine';
  chatMessages: ChatMessage[];
  contextAttachments: ContextAttachment[];
  engineSettings: EngineSettings;
  setRightPanelTab: (tab: 'chat' | 'context' | 'skills' | 'engine') => void;
  addChatMessage: (msg: ChatMessage) => void;
  updateChatMessage: (id: string, patch: Partial<ChatMessage>) => void;
  clearChatMessages: () => void;
  addContextAttachment: (attachment: ContextAttachment) => void;
  removeContextAttachment: (id: string) => void;
  clearContextAttachments: () => void;
  togglePinAttachment: (id: string) => void;
  updateEngineSettings: (settings: Partial<EngineSettings>) => void;
  aiAddContextPayload: (path: string) => void;
  aiSetSkillActive: (skillName: string, active: boolean) => void;
  aiNavigate: (target: string) => void;

  globalConfig: ConfigItem[];
  workspaceConfigs: Record<string, Record<string, boolean>>; // workspaceId -> { configId: isActive }
  toggleGlobalConfig: (id: string, active: boolean) => void;
  toggleWorkspaceConfig: (workspaceId: string, configId: string, active: boolean) => void;

  panelOrder: PanelId[];
  panelVisible: Record<PanelId, boolean>;
  panelWidths: Record<PanelId, number>;
  panelHeights: Record<PanelId, number>;
  panelDetached: Record<PanelId, boolean>;
  movePanel: (panelId: PanelId, direction: 'left' | 'right') => void;
  setPanelOrder: (newOrder: PanelId[]) => void;
  togglePanelVisible: (panelId: PanelId) => void;
  setPanelVisible: (panelId: PanelId, visible: boolean) => void;
  setPanelWidth: (panelId: PanelId, width: number) => void;
  setPanelHeight: (panelId: PanelId, height: number) => void;
  setPanelDetached: (panelId: PanelId, detached: boolean) => void;
  detachPanel: (panelId: PanelId) => void;
  redockPanel: (panelId: PanelId) => void;
  resetPanelLayout: () => void;

  terminalAgentConfig: TerminalAgentConfig;
  setTerminalAgent: (config: Partial<TerminalAgentConfig>) => void;

  isAgentsCenterOpen: boolean;
  setAgentsCenterOpen: (open: boolean) => void;
  agentsCenterTab: 'rules' | 'skills' | 'workflows' | 'plugins' | 'subagents' | 'memory';
  setAgentsCenterTab: (tab: 'rules' | 'skills' | 'workflows' | 'plugins' | 'subagents' | 'memory') => void;
  isImportModalOpen: boolean;
  setImportModalOpen: (open: boolean) => void;
  currentRuleScope: RuleScope;
  setCurrentRuleScope: (scope: RuleScope) => void;
  agentRules: AgentRule[];
  detectedRepoRules: DetectedRepoRuleFile[];
  addRule: (rule: AgentRule) => void;
  updateRule: (id: string, patch: Partial<AgentRule>) => void;
  deleteRule: (id: string) => void;
  toggleRuleActive: (id: string, active: boolean, targetScopeId?: string) => void;
  scanAllWorkspaceRules: () => Promise<void>;
  getActiveRulesForContext: (workspaceId?: string, repoPath?: string) => AgentRule[];
  agentSkills: AgentSkill[];
  detectedRepoSkills: DetectedRepoSkillFile[];
  addSkill: (skill: AgentSkill) => void;
  updateSkill: (id: string, patch: Partial<AgentSkill>) => void;
  deleteSkill: (id: string) => void;
  toggleSkillActive: (id: string, active: boolean, targetScopeId?: string) => void;
  scanAllWorkspaceSkills: () => Promise<void>;
  getActiveSkillsForContext: (workspaceId?: string, repoPath?: string) => AgentSkill[];

  agentWorkflows: AgentWorkflowItem[];
  addWorkflow: (wf: AgentWorkflowItem) => void;
  updateWorkflow: (id: string, patch: Partial<AgentWorkflowItem>) => void;
  deleteWorkflow: (id: string) => void;
  toggleWorkflowActive: (id: string, active: boolean, targetScopeId?: string) => void;
  getActiveWorkflowsForContext: (workspaceId?: string, repoPath?: string) => AgentWorkflowItem[];

  mcpPlugins: McpServerPlugin[];
  addPlugin: (plugin: McpServerPlugin) => void;
  updatePlugin: (id: string, patch: Partial<McpServerPlugin>) => void;
  deletePlugin: (id: string) => void;
  togglePluginActive: (id: string, active: boolean, targetScopeId?: string) => void;
  getActivePluginsForContext: (workspaceId?: string, repoPath?: string) => McpServerPlugin[];

  subagentPersonas: SubagentPersona[];
  addSubagent: (subagent: SubagentPersona) => void;
  updateSubagent: (id: string, patch: Partial<SubagentPersona>) => void;
  deleteSubagent: (id: string) => void;
  toggleSubagentActive: (id: string, active: boolean, targetScopeId?: string) => void;
  getActiveSubagentsForContext: (workspaceId?: string, repoPath?: string) => SubagentPersona[];

  projectMemories: ProjectMemoryItem[];
  addMemory: (memory: ProjectMemoryItem) => void;
  updateMemory: (id: string, patch: Partial<ProjectMemoryItem>) => void;
  deleteMemory: (id: string) => void;
  toggleMemoryPinned: (id: string, pinned: boolean, targetScopeId?: string) => void;
  getActiveMemoriesForContext: (workspaceId?: string, repoPath?: string) => ProjectMemoryItem[];
}

const defaultBuiltinSkills: AgentSkill[] = [
  {
    id: 'skill-code-review',
    name: 'Senior Code Review',
    folderName: 'code_review',
    description: 'Comprehensive code review covering OWASP security, logic correctness, performance, and maintainability.',
    content: `# Code Review Checklist\n\n## 1. Logic & Functionality\nVerify edge cases, error handling, and business requirements.\n\n## 2. Security (OWASP)\nCheck for injection, raw SQL, unvalidated inputs, secrets leaks.\n\n## 3. Modularity\nEnsure files remain under 150 lines and functions are small and focused.\n`,
    scope: 'global',
    source: 'builtin',
    active: true,
    category: 'code-quality',
    icon: 'code',
    updatedAt: Date.now()
  },
  {
    id: 'skill-debug-issue',
    name: 'Scientific Debugging',
    folderName: 'debug_issue',
    description: 'Strict scientific debugging protocol (The Iron Law). Never guess; systematically test hypotheses.',
    content: `# Scientific Debugging Protocol\n\n1. Reproduce the bug reliably.\n2. Formulate explicit hypotheses for the root cause.\n3. Verify against logs, stack traces, and test executions.\n4. Apply minimal atomic fix and verify zero regression.\n`,
    scope: 'global',
    source: 'builtin',
    active: true,
    category: 'workflow',
    icon: 'database',
    updatedAt: Date.now()
  },
  {
    id: 'skill-terminal-bash',
    name: 'Terminal Bash Execution',
    folderName: 'terminal_bash',
    description: 'Execute terminal shell commands strictly via Git Bash login shell for clean process termination.',
    content: `# Terminal & Shell Execution Standard\n- ALWAYS use \`& "C:\\Program Files\\Git\\bin\\bash.exe" -l -c "<command>"\` for terminal execution on Windows.\n- Ensure non-interactive, atomic completion.\n`,
    scope: 'global',
    source: 'builtin',
    active: true,
    category: 'devops',
    icon: 'terminal',
    updatedAt: Date.now()
  },
  {
    id: 'skill-enhance-ui',
    name: 'Glassmorphism UI Architect',
    folderName: 'enhance_ui',
    description: 'Systematic UI upgrades adhering to glassmorphism, translucency, rounded-2xl geometry and Tailwind CSS.',
    content: `# Glassmorphism UI Directives\n- Use \`bg-white/5\` or \`bg-black/20\`, \`backdrop-blur-xl\`, \`border-white/10\`.\n- Rounded geometry: \`rounded-2xl\` for cards, \`rounded-lg\` for buttons.\n- Strictly no sharp corners or solid opaque grey boxes.\n`,
    scope: 'global',
    source: 'builtin',
    active: true,
    category: 'architecture',
    icon: 'wrench',
    updatedAt: Date.now()
  },
  {
    id: 'skill-security-audit',
    name: 'OWASP Security Audit',
    folderName: 'security_audit',
    description: 'Scans codebase for secrets leaks, prototype pollution, path traversal, and authentication boundaries.',
    content: `# Security Audit Guidelines\n- Verify .env usage and secret scrubbing.\n- Protect IPC channels against malicious arguments.\n- Ensure contextIsolation: true and nodeIntegration: false in Electron.\n`,
    scope: 'global',
    source: 'builtin',
    active: true,
    category: 'security',
    icon: 'github',
    updatedAt: Date.now()
  }
];

const defaultWorkflows: AgentWorkflowItem[] = [
  {
    id: 'wf-feature-delivery',
    name: 'Autonomous Feature Delivery',
    description: 'End-to-end development cycle: Spec Analysis -> Architectural Plan -> Atomic Code -> Security Review -> Commit.',
    trigger: 'manual',
    scope: 'global',
    active: true,
    updatedAt: Date.now(),
    steps: [
      { id: 's1', name: 'Specification & Plan', role: 'Architect', instructions: 'Analyze requirements, check constraints, create atomic implementation plan.', autoApprove: true },
      { id: 's2', name: 'Code Implementation', role: 'Builder', instructions: 'Implement modules following <150 lines rule and strict TypeScript.', autoApprove: true },
      { id: 's3', name: 'Security & Quality Audit', role: 'Security Sentinel', instructions: 'Run OWASP scan and verify zero secrets committed.', autoApprove: true },
      { id: 's4', name: 'Verification & Test Run', role: 'QA Engineer', instructions: 'Execute test suites via Git Bash login shell.', autoApprove: true },
    ]
  },
  {
    id: 'wf-scientific-bugfix',
    name: 'Scientific Bugfix Pipeline',
    description: 'Structured debugging pipeline adhering to The Iron Law: Reproduce -> Hypothesis -> Trace -> Minimal Patch -> Regression Guard.',
    trigger: 'manual',
    scope: 'global',
    active: true,
    updatedAt: Date.now(),
    steps: [
      { id: 's1', name: 'Bug Reproduction', role: 'Debugger', instructions: 'Isolate failing test case or reproduction script.', autoApprove: true },
      { id: 's2', name: 'Root Cause Hypothesis', role: 'Architect', instructions: 'Formulate explicit hypothesis before making any code modifications.', autoApprove: true },
      { id: 's3', name: 'Atomic Fix & Verification', role: 'Builder', instructions: 'Apply smallest viable fix and verify all checks pass.', autoApprove: true }
    ]
  }
];

const defaultPlugins: McpServerPlugin[] = [
  {
    id: 'plugin-mcp-fs',
    name: 'MCP Local Filesystem Bridge',
    description: 'Model Context Protocol server granting standardized tool calls for directory inspection and atomic file writes.',
    type: 'mcp',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
    toolsExposed: ['read_file', 'write_file', 'list_directory', 'directory_tree'],
    status: 'connected',
    scope: 'global',
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'plugin-mcp-git',
    name: 'MCP Git Integration Bridge',
    description: 'Enables autonomous branch exploration, staged diff reviews, and conventional commit generation.',
    type: 'mcp',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git'],
    toolsExposed: ['git_status', 'git_diff', 'git_commit', 'git_log'],
    status: 'connected',
    scope: 'global',
    active: true,
    updatedAt: Date.now()
  }
];

const defaultSubagents: SubagentPersona[] = [
  {
    id: 'sa-principal-architect',
    name: 'Principal Software Architect',
    role: 'Architect',
    systemPrompt: 'You are the Principal Architect. Enforce strict modularity (<150 lines per file), clean architecture, and type safety.',
    model: 'gemini-1.5-pro-latest',
    temperature: 0.2,
    reasoningEffort: 'high',
    allowedSkills: ['code_review', 'enhance_ui'],
    scope: 'global',
    active: true,
    isBuiltin: true,
    icon: 'compass',
    updatedAt: Date.now()
  },
  {
    id: 'sa-precision-builder',
    name: 'Precision Vibecoder',
    role: 'Builder',
    systemPrompt: 'You are an elite full-stack developer. Write elegant, idiomatic TypeScript with zero placeholders and complete functional blocks.',
    model: 'gemini-1.5-flash-latest',
    temperature: 0.3,
    reasoningEffort: 'medium',
    allowedSkills: ['terminal_bash', 'code_review'],
    scope: 'global',
    active: true,
    isBuiltin: true,
    icon: 'zap',
    updatedAt: Date.now()
  },
  {
    id: 'sa-security-sentinel',
    name: 'Security & OWASP Sentinel',
    role: 'Security Sentinel',
    systemPrompt: 'You are an application security specialist. Scan for OWASP Top 10 vulnerabilities, verify auth boundaries, and protect IPC channels.',
    model: 'gemini-1.5-pro-latest',
    temperature: 0.1,
    reasoningEffort: 'high',
    allowedSkills: ['security_audit'],
    scope: 'global',
    active: true,
    isBuiltin: true,
    icon: 'shield',
    updatedAt: Date.now()
  }
];

const defaultMemories: ProjectMemoryItem[] = [
  {
    id: 'mem-modularity-law',
    title: 'Component Modularity Limit (<150 Lines)',
    category: 'architecture',
    content: 'Rule 3: All React components and module files must strictly remain under 150 lines. Split large files into focused sub-modules.',
    scope: 'global',
    pinned: true,
    updatedAt: Date.now()
  },
  {
    id: 'mem-terminal-std',
    title: 'Windows Git Bash Execution Standard',
    category: 'convention',
    content: 'All terminal commands on Windows MUST execute via `& "C:\\Program Files\\Git\\bin\\bash.exe" -l -c "<command>"`. Never use plain cmd /c.',
    scope: 'global',
    pinned: true,
    updatedAt: Date.now()
  },
  {
    id: 'mem-glassmorphism',
    title: 'Glassmorphism Aesthetic Rules',
    category: 'convention',
    content: 'UI surfaces use translucent backdrops (`bg-white/5` or `bg-black/20`), heavy blurs (`backdrop-blur-xl`), and rounded geometry (`rounded-2xl`).',
    scope: 'global',
    pinned: true,
    updatedAt: Date.now()
  }
];

export const useAgentStore = create<AgentState>((set, get) => ({
  systemContext: { cwd: '/', workspaces: [], activeWorkspaceId: null, expandedFolders: {}, fileTree: [], refreshCounter: 0, showHiddenFiles: false, editingWorkspaceId: null },
  activeRules: [],
  agentSkills: defaultBuiltinSkills,
  detectedRepoSkills: [],
  agentWorkflows: defaultWorkflows,
  mcpPlugins: defaultPlugins,
  subagentPersonas: defaultSubagents,
  projectMemories: defaultMemories,
  isImportModalOpen: false,
  workflow: { status: 'idle', currentTask: null },
  wsStatus: 'disconnected',
  activeFile: null,
  openTabs: [],
  activeTabIndex: -1,
  gitStatuses: {},
  contextMenu: null,
  activeSidebarTab: 'explorer',
  searchTarget: null,
  searchQuery: '',
  searchFileQuery: '',
  gitTarget: null,
  githubToken: null,
  githubUser: null,
  isAccountModalOpen: false,
  isCloneModalOpen: false,
  isConfigModalOpen: false,
  isAgentsCenterOpen: false,
  agentsCenterTab: 'rules',
  currentRuleScope: { type: 'global' },
  detectedRepoRules: [],
  agentRules: [
    {
      id: 'rule-global-core',
      name: 'Global System Architecture',
      description: 'Strict TypeScript typing, modularity constraint (<150 lines), zero placeholder rule',
      content: `# SYSTEM ARCHITECT SPECIFICATIONS\n- Strict TypeScript Strict Mode throughout.\n- Modularity: Keep components under 150 lines.\n- Security: IPC isolation, no arbitrary exec from UI.\n- No placeholders or stub code.`,
      scope: 'global',
      source: 'custom',
      active: true,
      updatedAt: Date.now(),
    },
    {
      id: 'rule-global-security',
      name: 'OWASP Security & Sanitization',
      description: 'Input escaping, secure child process execution, token protection',
      content: `# SECURITY & OWASP PROTOCOL\n- All inputs passed to bash or git must be escaped.\n- Never reveal API keys or GitHub tokens in logs.\n- Graceful error recovery on all IPC channels.`,
      scope: 'global',
      source: 'custom',
      active: true,
      updatedAt: Date.now(),
    }
  ],
  toasts: [],
  panelOrder: ((): PanelId[] => {
    try {
      const saved = localStorage.getItem('lam_panel_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
      }
    } catch {}
    return ['explorer', 'editor', 'agent', 'agents-center', 'terminal'];
  })(),
  panelVisible: { explorer: true, editor: true, agent: true, 'agents-center': false, terminal: false },
  panelWidths: { explorer: 260, editor: 560, agent: 340, 'agents-center': 440, terminal: 360 },
  panelHeights: { explorer: 300, editor: 300, agent: 300, 'agents-center': 300, terminal: 260 },
  panelDetached: { explorer: false, editor: false, agent: false, 'agents-center': false, terminal: false },
  terminalAgentConfig: {
    assignedAgentId: 'terminal-devops',
    agentName: 'DevOps Automator',
    agentMode: 'monitor',
    status: 'monitoring',
    autoRunCommands: false
  },
  setTerminalAgent: (config) => set((state) => ({
    terminalAgentConfig: { ...state.terminalAgentConfig, ...config }
  })),
  rightPanelTab: 'chat',
  chatMessages: [],
  contextAttachments: [],
  engineSettings: {
    selectedModel: 'gemini-2.0-flash',
    mode: 'vibe',
    provider: 'gemini',
    customApiKey: '',
    baseUrl: 'http://localhost:11434/v1',
    temperature: 0.2,
    maxTokens: 8192,
    reasoningEffort: 'high',
    autonomyLevel: 'full-auto',
    pruningStrategy: 'auto-sliding',
    persona: 'vibecoder',
    streamResponse: true,
    autoInjectGitDiff: true,
    autoInjectDiagnostics: true,
  },
  globalConfig: [
    { id: 'rule-gemini', name: 'GEMINI.md', description: 'System specifications & Vibecoding Rules', active: true, type: 'rule', icon: 'file' },
    { id: 'skill-terminal', name: 'Terminal Access', description: 'Execute bash commands and auto-heal builds', active: true, type: 'skill', icon: 'terminal' },
    { id: 'skill-file', name: 'Smart File Mutation', description: 'Surgical diff replacement and code authoring', active: true, type: 'skill', icon: 'code' },
    { id: 'skill-git', name: 'Automated Git Flow', description: 'Auto-stage, smart commits and branching', active: true, type: 'skill', icon: 'git' },
    { id: 'skill-search', name: 'Semantic Workspace Search', description: 'Deep symbol and codebase lookup', active: true, type: 'skill', icon: 'search' },
    { id: 'skill-diagnostics', name: 'Error Auto-Fixer', description: 'Real-time compiler & lint diagnostics repair', active: true, type: 'skill', icon: 'code' },
    { id: 'skill-subagent', name: 'Cavecrew Subagents', description: 'Specialized background worker agent swarm', active: true, type: 'skill', icon: 'terminal' },
    { id: 'plugin-github', name: 'GitHub Integration', description: 'Manage PRs, issues and remote sync', active: false, type: 'plugin', icon: 'github' },
  ],
  workspaceConfigs: {},
  
  toggleGlobalConfig: (id, active) => set((state) => ({
    globalConfig: state.globalConfig.map(item => item.id === id ? { ...item, active } : item)
  })),

  toggleWorkspaceConfig: (workspaceId, configId, active) => set((state) => {
    const wsConfig = state.workspaceConfigs[workspaceId] || {};
    return {
      workspaceConfigs: {
        ...state.workspaceConfigs,
        [workspaceId]: {
          ...wsConfig,
          [configId]: active
        }
      }
    };
  }),

  movePanel: (panelId, direction) => set((state) => {
    const order = [...state.panelOrder];
    const index = order.indexOf(panelId);
    if (index === -1) return state;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return state;
    const temp = order[index];
    order[index] = order[targetIndex];
    order[targetIndex] = temp;
    try {
      localStorage.setItem('lam_panel_order', JSON.stringify(order));
    } catch {}
    return { panelOrder: order };
  }),

  setPanelOrder: (newOrder) => {
    try {
      localStorage.setItem('lam_panel_order', JSON.stringify(newOrder));
    } catch {}
    set({ panelOrder: newOrder });
  },

  togglePanelVisible: (panelId) => set((state) => ({
    panelVisible: { ...state.panelVisible, [panelId]: !state.panelVisible[panelId] }
  })),

  setPanelVisible: (panelId, visible) => set((state) => ({
    panelVisible: { ...state.panelVisible, [panelId]: visible }
  })),

  setPanelWidth: (panelId, width) => set((state) => ({
    panelWidths: { ...state.panelWidths, [panelId]: Math.max(180, Math.min(1200, width)) }
  })),

  setPanelHeight: (panelId, height) => set((state) => ({
    panelHeights: { ...state.panelHeights, [panelId]: Math.max(120, Math.min(800, height)) }
  })),

  setPanelDetached: (panelId, detached) => set((state) => ({
    panelDetached: { ...state.panelDetached, [panelId]: detached },
    panelVisible: { ...state.panelVisible, [panelId]: !detached }
  })),

  detachPanel: (panelId) => {
    // @ts-ignore
    window.lamApi?.panel?.detach(panelId);
    set((state) => ({
      panelDetached: { ...state.panelDetached, [panelId]: true },
      panelVisible: { ...state.panelVisible, [panelId]: false }
    }));
  },

  redockPanel: (panelId) => {
    // @ts-ignore
    window.lamApi?.panel?.redock(panelId);
    set((state) => ({
      panelDetached: { ...state.panelDetached, [panelId]: false },
      panelVisible: { ...state.panelVisible, [panelId]: true }
    }));
  },

  resetPanelLayout: () => {
    const defaultOrder: PanelId[] = ['explorer', 'editor', 'agent', 'agents-center', 'terminal'];
    try {
      localStorage.setItem('lam_panel_order', JSON.stringify(defaultOrder));
    } catch {}
    set({
      panelOrder: defaultOrder,
      panelVisible: { explorer: true, editor: true, agent: true, 'agents-center': false, terminal: false },
      panelWidths: { explorer: 260, editor: 560, agent: 340, 'agents-center': 440, terminal: 360 },
      panelHeights: { explorer: 300, editor: 300, agent: 300, 'agents-center': 300, terminal: 260 },
      panelDetached: { explorer: false, editor: false, agent: false, 'agents-center': false, terminal: false }
    });
  },

  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  updateChatMessage: (id, patch) => set((state) => ({
    chatMessages: state.chatMessages.map(m => m.id === id ? { ...m, ...patch } : m)
  })),
  clearChatMessages: () => set({ chatMessages: [] }),
  addContextAttachment: (attachment) => set((state) => {
    if (state.contextAttachments.some(a => a.path === attachment.path)) {
      return state;
    }
    return { contextAttachments: [...state.contextAttachments, attachment] };
  }),
  removeContextAttachment: (id) => set((state) => ({
    contextAttachments: state.contextAttachments.filter(a => a.id !== id)
  })),
  clearContextAttachments: () => set({ contextAttachments: [] }),
  togglePinAttachment: (id) => set((state) => ({
    contextAttachments: state.contextAttachments.map(a => 
      a.id === id ? { ...a, pinned: !a.pinned } : a
    )
  })),
  updateEngineSettings: (settings) => set((state) => ({
    engineSettings: { ...state.engineSettings, ...settings }
  })),
  aiAddContextPayload: (path) => {
    const id = Math.random().toString(36).substring(7);
    const fileName = path.split(/[/\\]/).pop() || path;
    const attachment: ContextAttachment = {
      id,
      name: fileName,
      path,
      type: 'file',
      tokenEstimate: Math.max(120, Math.floor(Math.random() * 450) + 150),
      pinned: true
    };
    get().addContextAttachment(attachment);
    get().addToast(`Added to AI context: ${fileName}`, 'success');
  },
  aiSetSkillActive: (skillName, active) => {
    get().addToast(`AI Set skill ${skillName} to ${active}`, 'success');
    const state = get();
    const item = state.globalConfig.find((c: ConfigItem) => c.name.toLowerCase().includes(skillName.toLowerCase()));
    if (item) {
      state.toggleGlobalConfig(item.id, active);
    }
  },
  aiNavigate: (target) => {
    get().addToast(`AI Navigating to ${target}`, 'info');
    if (target === 'explorer' || target === 'search' || target === 'git') {
      get().setActiveSidebarTab(target);
    }
  },

  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    // Auto-remove after 4 seconds
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  openContextMenu: (options) => set({ contextMenu: options }),
  closeContextMenu: () => set({ contextMenu: null }),
  setAccountModalOpen: (open: boolean) => set({ isAccountModalOpen: open }),
  setCloneModalOpen: (open: boolean) => set({ isCloneModalOpen: open }),
  setConfigModalOpen: (open: boolean) => set({ isConfigModalOpen: open, isAgentsCenterOpen: open }),
  setAgentsCenterOpen: (open: boolean) => set({ isAgentsCenterOpen: open, isConfigModalOpen: open }),
  setAgentsCenterTab: (tab) => set({ agentsCenterTab: tab }),
  setCurrentRuleScope: (scope) => set({ currentRuleScope: scope }),
  addRule: (rule) => set((state) => ({ agentRules: [rule, ...state.agentRules] })),
  updateRule: (id, patch) => set((state) => ({
    agentRules: state.agentRules.map(r => r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r)
  })),
  deleteRule: (id) => set((state) => ({
    agentRules: state.agentRules.filter(r => r.id !== id)
  })),
  toggleRuleActive: (id, active, targetScopeId) => set((state) => ({
    agentRules: state.agentRules.map(r => {
      if (r.id !== id) return r;
      if (targetScopeId && r.scope === 'global') {
        const cur = r.disabledIn || [];
        const next = active ? cur.filter(t => t !== targetScopeId) : (cur.includes(targetScopeId) ? cur : [...cur, targetScopeId]);
        return { ...r, disabledIn: next };
      }
      return { ...r, active };
    })
  })),
  scanAllWorkspaceRules: async () => {
    const state = useAgentStore.getState();
    const detected: DetectedRepoRuleFile[] = [];
    const newRules: AgentRule[] = [];

    for (const ws of state.systemContext.workspaces) {
      for (const folder of ws.folders) {
        try {
          // @ts-ignore
          const res = await window.lamApi?.rules?.scanRepoRules(folder);
          if (res?.success && Array.isArray(res.data)) {
            for (const item of res.data) {
              const detectedItem: DetectedRepoRuleFile = {
                name: item.name,
                filePath: item.filePath,
                content: item.content,
                size: item.size,
                repoPath: folder,
                workspaceId: ws.id,
              };
              detected.push(detectedItem);

              const ruleId = `repo-rule-${folder}-${item.name}`.replace(/[\\/:]/g, '-');
              const existing = state.agentRules.find((r: AgentRule) => r.id === ruleId || r.filePath === item.filePath);
              if (!existing) {
                newRules.push({
                  id: ruleId,
                  name: `${item.name} (${folder.split(/[/\\]/).pop() || folder})`,
                  description: `Detected rule file: ${item.name}`,
                  content: item.content,
                  scope: 'repo',
                  targetId: folder,
                  source: 'file',
                  filePath: item.filePath,
                  active: true,
                  updatedAt: Date.now(),
                });
              }
            }
          }
        } catch (e) {
          console.error("Failed to scan repo rules for", folder, e);
        }
      }
    }

    set((curr) => ({
      detectedRepoRules: detected,
      agentRules: [...curr.agentRules, ...newRules]
    }));
  },
  getActiveRulesForContext: (workspaceId?: string, repoPath?: string): AgentRule[] => {
    const state = get();
    return state.agentRules.filter((rule: AgentRule) => {
      if (rule.scope === 'global') {
        if (!rule.active) return false;
        if (workspaceId && rule.disabledIn?.includes(workspaceId)) return false;
        if (repoPath && rule.disabledIn?.includes(repoPath)) return false;
        return true;
      }
      if (rule.scope === 'workspace') return workspaceId ? rule.targetId === workspaceId : false;
      if (rule.scope === 'repo') return repoPath ? rule.targetId === repoPath : false;
      return false;
    });
  },
  addSkill: (skill: AgentSkill) => set((state) => ({ agentSkills: [skill, ...state.agentSkills] })),
  updateSkill: (id: string, patch: Partial<AgentSkill>) => set((state) => ({
    agentSkills: state.agentSkills.map((s: AgentSkill) => s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s)
  })),
  deleteSkill: (id: string) => set((state) => ({
    agentSkills: state.agentSkills.filter((s: AgentSkill) => s.id !== id)
  })),
  toggleSkillActive: (id: string, active: boolean, targetScopeId?: string) => set((state) => ({
    agentSkills: state.agentSkills.map((s: AgentSkill) => {
      if (s.id !== id) return s;
      if (targetScopeId && s.scope === 'global') {
        const cur = s.disabledIn || [];
        const next = active ? cur.filter(t => t !== targetScopeId) : (cur.includes(targetScopeId) ? cur : [...cur, targetScopeId]);
        return { ...s, disabledIn: next };
      }
      return { ...s, active };
    })
  })),
  scanAllWorkspaceSkills: async () => {
    const state = get();
    const detected: DetectedRepoSkillFile[] = [];
    const newSkills: AgentSkill[] = [];

    for (const ws of state.systemContext.workspaces) {
      for (const folder of ws.folders) {
        try {
          // @ts-ignore
          const res = await window.lamApi?.skills?.scanRepoSkills?.(folder);
          if (res?.success && Array.isArray(res.data)) {
            for (const item of res.data) {
              const detectedItem: DetectedRepoSkillFile = {
                name: item.name,
                folderName: item.folderName,
                description: item.description,
                filePath: item.filePath,
                content: item.content,
                size: item.size,
                repoPath: folder,
                workspaceId: ws.id,
              };
              detected.push(detectedItem);

              const skillId = `repo-skill-${folder}-${item.folderName}`.replace(/[\\/:]/g, '-');
              const existing = state.agentSkills.find((s: AgentSkill) => s.id === skillId || s.filePath === item.filePath);
              if (!existing) {
                newSkills.push({
                  id: skillId,
                  name: `${item.name} (${folder.split(/[/\\]/).pop() || folder})`,
                  folderName: item.folderName,
                  description: item.description,
                  content: item.content,
                  scope: 'repo',
                  targetId: folder,
                  source: 'file',
                  filePath: item.filePath,
                  active: true,
                  updatedAt: Date.now(),
                });
              }
            }
          }
        } catch (e) {
          console.error("Failed to scan repo skills for", folder, e);
        }
      }
    }

    set((curr) => ({
      detectedRepoSkills: detected,
      agentSkills: [...curr.agentSkills, ...newSkills]
    }));
  },
  getActiveSkillsForContext: (workspaceId?: string, repoPath?: string): AgentSkill[] => {
    const state = get();
    return state.agentSkills.filter((skill: AgentSkill) => {
      if (skill.scope === 'global') {
        if (!skill.active) return false;
        if (workspaceId && skill.disabledIn?.includes(workspaceId)) return false;
        if (repoPath && skill.disabledIn?.includes(repoPath)) return false;
        return true;
      }
      if (skill.scope === 'workspace') return workspaceId ? skill.targetId === workspaceId : false;
      if (skill.scope === 'repo') return repoPath ? skill.targetId === repoPath : false;
      return false;
    });
  },
  setImportModalOpen: (open: boolean) => set({ isImportModalOpen: open }),

  addWorkflow: (wf: AgentWorkflowItem) => set((state) => ({ agentWorkflows: [wf, ...state.agentWorkflows] })),
  updateWorkflow: (id: string, patch: Partial<AgentWorkflowItem>) => set((state) => ({
    agentWorkflows: state.agentWorkflows.map((w: AgentWorkflowItem) => w.id === id ? { ...w, ...patch, updatedAt: Date.now() } : w)
  })),
  deleteWorkflow: (id: string) => set((state) => ({
    agentWorkflows: state.agentWorkflows.filter((w: AgentWorkflowItem) => w.id !== id)
  })),
  toggleWorkflowActive: (id: string, active: boolean, targetScopeId?: string) => set((state) => ({
    agentWorkflows: state.agentWorkflows.map((w: AgentWorkflowItem) => {
      if (w.id !== id) return w;
      if (targetScopeId && w.scope === 'global') {
        const cur = w.disabledIn || [];
        const next = active ? cur.filter(t => t !== targetScopeId) : (cur.includes(targetScopeId) ? cur : [...cur, targetScopeId]);
        return { ...w, disabledIn: next };
      }
      return { ...w, active };
    })
  })),
  getActiveWorkflowsForContext: (workspaceId?: string, repoPath?: string): AgentWorkflowItem[] => {
    const state = get();
    return state.agentWorkflows.filter((w: AgentWorkflowItem) => {
      if (w.scope === 'global') {
        if (!w.active) return false;
        if (workspaceId && w.disabledIn?.includes(workspaceId)) return false;
        if (repoPath && w.disabledIn?.includes(repoPath)) return false;
        return true;
      }
      if (w.scope === 'workspace') return workspaceId ? w.targetId === workspaceId : false;
      if (w.scope === 'repo') return repoPath ? w.targetId === repoPath : false;
      return false;
    });
  },

  addPlugin: (plugin: McpServerPlugin) => set((state) => ({ mcpPlugins: [plugin, ...state.mcpPlugins] })),
  updatePlugin: (id: string, patch: Partial<McpServerPlugin>) => set((state) => ({
    mcpPlugins: state.mcpPlugins.map((p: McpServerPlugin) => p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)
  })),
  deletePlugin: (id: string) => set((state) => ({
    mcpPlugins: state.mcpPlugins.filter((p: McpServerPlugin) => p.id !== id)
  })),
  togglePluginActive: (id: string, active: boolean, targetScopeId?: string) => set((state) => ({
    mcpPlugins: state.mcpPlugins.map((p: McpServerPlugin) => {
      if (p.id !== id) return p;
      if (targetScopeId && p.scope === 'global') {
        const cur = p.disabledIn || [];
        const next = active ? cur.filter(t => t !== targetScopeId) : (cur.includes(targetScopeId) ? cur : [...cur, targetScopeId]);
        return { ...p, disabledIn: next };
      }
      return { ...p, active };
    })
  })),
  getActivePluginsForContext: (workspaceId?: string, repoPath?: string): McpServerPlugin[] => {
    const state = get();
    return state.mcpPlugins.filter((p: McpServerPlugin) => {
      if (p.scope === 'global') {
        if (!p.active) return false;
        if (workspaceId && p.disabledIn?.includes(workspaceId)) return false;
        if (repoPath && p.disabledIn?.includes(repoPath)) return false;
        return true;
      }
      if (p.scope === 'workspace') return workspaceId ? p.targetId === workspaceId : false;
      if (p.scope === 'repo') return repoPath ? p.targetId === repoPath : false;
      return false;
    });
  },

  addSubagent: (subagent: SubagentPersona) => set((state) => ({ subagentPersonas: [subagent, ...state.subagentPersonas] })),
  updateSubagent: (id: string, patch: Partial<SubagentPersona>) => set((state) => ({
    subagentPersonas: state.subagentPersonas.map((s: SubagentPersona) => s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s)
  })),
  deleteSubagent: (id: string) => set((state) => ({
    subagentPersonas: state.subagentPersonas.filter((s: SubagentPersona) => s.id !== id)
  })),
  toggleSubagentActive: (id: string, active: boolean, targetScopeId?: string) => set((state) => ({
    subagentPersonas: state.subagentPersonas.map((s: SubagentPersona) => {
      if (s.id !== id) return s;
      if (targetScopeId && s.scope === 'global') {
        const cur = s.disabledIn || [];
        const next = active ? cur.filter(t => t !== targetScopeId) : (cur.includes(targetScopeId) ? cur : [...cur, targetScopeId]);
        return { ...s, disabledIn: next };
      }
      return { ...s, active };
    })
  })),
  getActiveSubagentsForContext: (workspaceId?: string, repoPath?: string): SubagentPersona[] => {
    const state = get();
    return state.subagentPersonas.filter((s: SubagentPersona) => {
      if (s.scope === 'global') {
        if (!s.active) return false;
        if (workspaceId && s.disabledIn?.includes(workspaceId)) return false;
        if (repoPath && s.disabledIn?.includes(repoPath)) return false;
        return true;
      }
      if (s.scope === 'workspace') return workspaceId ? s.targetId === workspaceId : false;
      if (s.scope === 'repo') return repoPath ? s.targetId === repoPath : false;
      return false;
    });
  },

  addMemory: (memory: ProjectMemoryItem) => set((state) => ({ projectMemories: [memory, ...state.projectMemories] })),
  updateMemory: (id: string, patch: Partial<ProjectMemoryItem>) => set((state) => ({
    projectMemories: state.projectMemories.map((m: ProjectMemoryItem) => m.id === id ? { ...m, ...patch, updatedAt: Date.now() } : m)
  })),
  deleteMemory: (id: string) => set((state) => ({
    projectMemories: state.projectMemories.filter((m: ProjectMemoryItem) => m.id !== id)
  })),
  toggleMemoryPinned: (id: string, pinned: boolean, targetScopeId?: string) => set((state) => ({
    projectMemories: state.projectMemories.map((m: ProjectMemoryItem) => {
      if (m.id !== id) return m;
      if (targetScopeId && m.scope === 'global') {
        const cur = m.disabledIn || [];
        const next = pinned ? cur.filter(t => t !== targetScopeId) : (cur.includes(targetScopeId) ? cur : [...cur, targetScopeId]);
        return { ...m, disabledIn: next };
      }
      return { ...m, pinned };
    })
  })),
  getActiveMemoriesForContext: (workspaceId?: string, repoPath?: string): ProjectMemoryItem[] => {
    const state = get();
    return state.projectMemories.filter((m: ProjectMemoryItem) => {
      if (m.scope === 'global') {
        if (!m.pinned) return false;
        if (workspaceId && m.disabledIn?.includes(workspaceId)) return false;
        if (repoPath && m.disabledIn?.includes(repoPath)) return false;
        return true;
      }
      if (m.scope === 'workspace') return workspaceId ? m.targetId === workspaceId : false;
      if (m.scope === 'repo') return repoPath ? m.targetId === repoPath : false;
      return false;
    });
  },
  setGithubToken: (token: string | null) => {
    set({ githubToken: token });
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings({ githubToken: token });
  },
  setGithubUser: (user) => set({ githubUser: user }),
  triggerRefresh: () => set((state) => ({ systemContext: { ...state.systemContext, refreshCounter: state.systemContext.refreshCounter + 1 } })),
  toggleHiddenFiles: () => set((state) => {
    const showHiddenFiles = !state.systemContext.showHiddenFiles;
    const newContext = { ...state.systemContext, showHiddenFiles };
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings({ showHiddenFiles });
    return { systemContext: newContext };
  }),
  setEditingWorkspaceId: (id) => set((state) => ({ systemContext: { ...state.systemContext, editingWorkspaceId: id } })),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  setSearchTarget: (target) => set({ searchTarget: target }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchFileQuery: (query) => set({ searchFileQuery: query }),
  setGitTarget: (target) => set({ gitTarget: target }),
  setGitStatuses: (statuses) => set({ gitStatuses: statuses }),
  
  setSystemContext: (context) => set({ systemContext: context }),
  
  loadSettings: (settings) => set((state) => ({
    systemContext: {
      ...state.systemContext,
      workspaces: settings.workspaces || [],
      activeWorkspaceId: settings.activeWorkspaceId || null,
    },
    githubToken: settings.githubToken || null,
    panelOrder: settings.panelOrder || state.panelOrder,
    engineSettings: {
      ...state.engineSettings,
      customApiKey: settings.aiApiKey || state.engineSettings.customApiKey,
      provider: settings.aiProvider || state.engineSettings.provider,
      selectedModel: settings.aiModel || state.engineSettings.selectedModel,
      baseUrl: settings.aiBaseUrl || state.engineSettings.baseUrl,
    }
  })),

  createWorkspace: (name) => set((state) => {
    const newWs = { id: Date.now().toString(), name, folders: [] };
    const workspaces = [...state.systemContext.workspaces, newWs];
    
    // @ts-ignore - persist to backend
    window.lamApi?.settingsAPI?.saveSettings({ workspaces, activeWorkspaceId: newWs.id });
    
    return {
      systemContext: {
        ...state.systemContext,
        workspaces,
        activeWorkspaceId: newWs.id,
      }
    };
  }),

  renameWorkspace: (workspaceId, name) => set((state) => {
    const workspaces = state.systemContext.workspaces.map(ws => 
      ws.id === workspaceId ? { ...ws, name } : ws
    );
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings({ workspaces });
    return { systemContext: { ...state.systemContext, workspaces } };
  }),

  deleteWorkspace: (workspaceId) => set((state) => {
    const workspaces = state.systemContext.workspaces.filter(ws => ws.id !== workspaceId);
    let activeWorkspaceId = state.systemContext.activeWorkspaceId;
    if (activeWorkspaceId === workspaceId) {
      activeWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null;
    }
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings({ workspaces, activeWorkspaceId });
    return { systemContext: { ...state.systemContext, workspaces, activeWorkspaceId } };
  }),

  addFolderToWorkspace: (workspaceId, folderPath) => set((state) => {
    const workspaces = state.systemContext.workspaces.map(ws => {
      if (ws.id === workspaceId) {
        return { ...ws, folders: [...new Set([...ws.folders, folderPath])] };
      }
      return ws;
    });
    
    // @ts-ignore - persist to backend
    window.lamApi?.settingsAPI?.saveSettings({ workspaces });
    
    return {
      systemContext: { ...state.systemContext, workspaces }
    };
  }),
  toggleFolder: (path, expanded) => set((state) => ({ 
    systemContext: { ...state.systemContext, expandedFolders: { ...state.systemContext.expandedFolders, [path]: expanded } } 
  })),
  openFile: (file, forceNewTab = false) => set((state) => {
    // If already open, switch to it
    const existingIndex = state.openTabs.findIndex(t => t.path === file.path);
    if (existingIndex >= 0) {
      const updatedTabs = [...state.openTabs];
      updatedTabs[existingIndex] = { ...updatedTabs[existingIndex], ...file, isPreview: forceNewTab ? false : updatedTabs[existingIndex].isPreview };
      return { openTabs: updatedTabs, activeTabIndex: existingIndex, activeFile: updatedTabs[existingIndex] };
    }

    const newFile = { ...file, isPreview: !forceNewTab };
    let newTabs = [...state.openTabs];
    let newIndex = state.activeTabIndex;

    if (!forceNewTab) {
      const previewIndex = newTabs.findIndex(t => t.isPreview);
      if (previewIndex >= 0) {
        newTabs[previewIndex] = newFile;
        newIndex = previewIndex;
      } else {
        newTabs.push(newFile);
        newIndex = newTabs.length - 1;
      }
    } else {
      newTabs.push(newFile);
      newIndex = newTabs.length - 1;
    }

    return { openTabs: newTabs, activeTabIndex: newIndex, activeFile: newFile };
  }),
  closeTab: (index) => set((state) => {
    const newTabs = [...state.openTabs];
    newTabs.splice(index, 1);
    let newIndex = state.activeTabIndex;
    if (index === state.activeTabIndex) {
      newIndex = Math.max(0, index - 1);
    } else if (index < state.activeTabIndex) {
      newIndex--;
    }
    const newActiveFile = newTabs.length > 0 ? newTabs[newIndex] : null;
    return { openTabs: newTabs, activeTabIndex: newIndex, activeFile: newActiveFile };
  }),
  setActiveTabIndex: (index) => set((state) => ({
    activeTabIndex: index,
    activeFile: state.openTabs[index] || null
  })),
  pinTab: (index) => set((state) => {
    const newTabs = [...state.openTabs];
    if (newTabs[index]) {
      newTabs[index] = { ...newTabs[index], isPreview: false };
      return { openTabs: newTabs, activeFile: state.activeTabIndex === index ? newTabs[index] : state.activeFile };
    }
    return {};
  }),
  setActiveFile: (file) => {
    if (file === null) {
      set({ openTabs: [], activeTabIndex: -1, activeFile: null });
    } else {
      useAgentStore.getState().openFile(file, false);
    }
  },
  setActiveRules: (rules) => set({ activeRules: rules }),
  setWorkflowStatus: (status, task) => 
    set((state) => ({ workflow: { status, currentTask: task !== undefined ? task : state.workflow.currentTask } })),
  setWsStatus: (status) => set({ wsStatus: status }),
}));
