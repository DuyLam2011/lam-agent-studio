import { create } from 'zustand';
import { AgentRule, RuleScope, DetectedRepoRuleFile } from '../types/rules';
import { AgentSkill, DetectedRepoSkillFile } from '../types/skills';
import { AgentWorkflowItem } from '../types/workflows';
import { McpServerPlugin } from '../types/plugins';
import { SubagentPersona } from '../types/subagents';
import { ProjectMemoryItem } from '../types/memory';
import { AgentClassType } from '../types/agent-class';
import { applyTheme, ThemeMode, ThemeStyle } from '../utils/themeManager';
import { saveAppearanceSettings } from '../services/persistence/themePersistenceService';
import { standardBuiltinSubagents } from '../data/defaultSubagents';
import { AvatarStyle } from '../types/avatar';
import type { AgentMessageStatus, AgentTraceItem } from '../types/agent-stream';
import { AgentCombo } from '../types/agent-combo';
import {
  getAllAgentCombos,
  loadRepoComboBindings,
  saveCustomCombos,
  saveRepoComboBindings,
  storeActiveComboId,
  resolveActiveComboForScope
} from '../services/combos/agentComboPersistenceService';
import { auditWorkspaceFolderForCombo, WorkspaceComboAuditResult } from '../services/combos/workspaceComboAuditorService';
import { resolveWorkspaceRepoInfo } from '../services/workspace/workspaceRepoResolver';
import { AgentPermissionsSettings } from '../types/settings-center';
import {
  DEFAULT_AGENT_PERMISSIONS,
  loadAgentPermissions,
  saveAgentPermissions
} from '../services/persistence/agentPermissionsService';
import { ToolDecisionState } from '../services/decision-center/decisionCenterTypes';
import { evaluateToolDecision } from '../services/decision-center/decisionCenterService';
import { AgentProfileConfig } from '../types/agent-profile';
import { loadAllAgentProfiles, persistAgentProfiles } from '../services/agent-profile/agentProfileStorageService';
import { createDefaultFatherAgentProfile, createDefaultSubagentProfile } from '../services/agent-profile/agentProfileDefaults';

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
  repoPath?: string;
}

interface ActiveRule {
  id: string;
  content: string;
}

interface AgentWorkflow {
  status: 'idle' | 'running' | 'error';
  currentTask: string | null;
}

export interface ActiveFile {
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
  label?: string;
  turn?: number;
  isSensitive?: boolean;
  diffId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  text: string;
  thinking?: string;
  toolCalls?: ToolCallItem[];
  toolCall?: { name: string; args: any; result?: string };
  timestamp?: number;
  agentRole?: string;
  agentId?: string;
  diffSnapshots?: AgentFileDiffSnapshot[];
  status?: AgentMessageStatus;
  runId?: string;
  /** Ordered reasoning/tool timeline captured while the reply streamed. */
  trace?: AgentTraceItem[];
  model?: string;
  durationMs?: number;
  error?: string;
  activeSkills?: string[];
  appliedRules?: string[];
  classMismatchWarning?: string;
}

export interface ContextAttachment {
  id: string;
  name: string;
  path: string;
  relativePath?: string;
  rootPath?: string;
  workspaceRepoTag?: string;
  type: 'file' | 'folder' | 'diff' | 'rule' | 'snippet' | 'diagnostics' | 'dom_element' | 'browser';
  tokenEstimate: number;
  pinned?: boolean;
  lineRange?: { startLine: number; endLine: number };
  snippet?: string;
}

export interface AgentFileDiffSnapshot {
  id: string;
  filePath: string;
  relativePath: string;
  action: 'modified' | 'created';
  originalContent: string;
  newContent: string;
  linesAdded: number;
  linesRemoved: number;
  timestamp: number;
}

export type VibecodingMode = 'vibe' | 'chat' | 'plan' | 'review';
export type AutonomyLevel = 'full-auto' | 'ask-dangerous' | 'ask-all';
export type ReasoningEffort = 'off' | 'low' | 'medium' | 'high';
export type ContextPruningStrategy = 'auto-sliding' | 'caveman' | 'summarize';
import { PanelId, TerminalAgentConfig, TerminalAgentMode, LayoutPreset } from '../types/panel';
import { loadInitialPanelLayout, persistPanelLayout, PersistedLayoutState } from '../services/persistence/layoutPersistenceService';
import { loadActiveSkillIds, saveActiveSkillIds } from '../services/persistence/skillsPersistenceService';
import { CommunicationTone, ExplanationVerbosity } from '../types/engine-style';
export type { PanelId, TerminalAgentConfig, TerminalAgentMode, LayoutPreset };
export type { CommunicationTone, ExplanationVerbosity };
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
  persona: 'architect' | 'vibecoder' | 'purist' | 'security' | string;
  communicationTone?: CommunicationTone;
  explanationVerbosity?: ExplanationVerbosity;
  streamResponse: boolean;
  autoInjectGitDiff: boolean;
  autoInjectDiagnostics: boolean;
  customApiKey?: string;
  provider?: 'gemini' | 'openai' | 'ollama' | 'offline' | 'anthropic' | 'deepseek' | string;
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
  googleAccount: {
    connected: boolean;
    engine: 'antigravity';
    email: string;
    name: string;
    models: Array<{ id: string; name: string }>;
    binaryPath: string;
    lastChecked?: number;
    error?: string;
  } | null;
  setGoogleAccount: (account: any) => void;
  syncGoogleStatus: () => Promise<any>;
  connectGoogleAccount: () => Promise<boolean>;
  disconnectGoogleAccount: () => Promise<void>;
  codexAccount: {
    connected: boolean;
    engine: 'codex';
    authMode: 'chatgpt' | 'api_key' | 'none';
    email?: string;
    name?: string;
    planType?: string;
    models: Array<{ id: string; name: string }>;
    binaryPath: string;
    lastChecked?: number;
    error?: string;
  } | null;
  setCodexAccount: (account: any) => void;
  syncCodexStatus: () => Promise<any>;
  connectCodexAccount: () => Promise<boolean>;
  disconnectCodexAccount: () => Promise<void>;
  claudeAccount: {
    connected: boolean;
    engine: 'claudecode';
    subscriptionType: string;
    rateLimitTier: string;
    organizationUuid?: string;
    authMethod: 'official_cli' | 'none';
    models: Array<{ id: string; name: string; badge: string }>;
    runtimeType: 'native_cli' | 'npx';
    complianceCompliant: true;
    lastChecked?: number;
    error?: string;
  } | null;
  setClaudeAccount: (account: any) => void;
  syncClaudeStatus: () => Promise<any>;
  connectClaudeAccount: () => Promise<boolean>;
  disconnectClaudeAccount: () => Promise<void>;
  isAccountModalOpen: boolean;
  isCloneModalOpen: boolean;
  isConfigModalOpen: boolean;
  isOllamaModalOpen: boolean;
  isCreateAgentModalOpen: boolean;
  createAgentInitialContext?: { repoPath?: string; filePath?: string; autoRunReview?: boolean } | null;
  openCreateAgentModal: (ctx?: { repoPath?: string; filePath?: string; autoRunReview?: boolean }) => void;
  closeCreateAgentModal: () => void;
  liveModels: Array<{ id: string; name: string; displayName: string; provider: string; description?: string; contextWindow?: number }>;
  isFetchingLiveModels: boolean;
  fetchLiveModels: (provider?: string, apiKey?: string) => Promise<void>;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  openContextMenu: (options: ContextMenuOptions) => void;
  closeContextMenu: () => void;
  setAccountModalOpen: (open: boolean) => void;
  setCloneModalOpen: (open: boolean) => void;
  setOllamaModalOpen: (open: boolean) => void;
  setConfigModalOpen: (open: boolean) => void;
  themeMode: ThemeMode;
  themeStyle: ThemeStyle;
  accentColor: string;
  isThemeModalOpen: boolean;
  isSettingCenterModalOpen: boolean;
  setSettingCenterModalOpen: (open: boolean) => void;
  agentPermissions: AgentPermissionsSettings;
  updateAgentPermissions: (patch: Partial<AgentPermissionsSettings>) => void;
  resetAgentPermissions: () => void;
  isBenchmarkModalOpen: boolean;
  setBenchmarkModalOpen: (open: boolean) => void;
  isAutomationModalOpen: boolean;
  setAutomationModalOpen: (open: boolean) => void;
  isSwarmModalOpen: boolean;
  setSwarmModalOpen: (open: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeStyle: (style: ThemeStyle) => void;
  setAccentColor: (color: string) => void;
  setThemeModalOpen: (open: boolean) => void;
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
  setActiveWorkspace: (workspaceId: string | null) => void;
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
  pendingChatPrompt: string | null;
  setPendingChatPrompt: (prompt: string | null) => void;
  chatInputDraft: string | null;
  setChatInputDraft: (draft: string | null) => void;
  toolDecisionState: ToolDecisionState | null;
  setToolDecisionState: (state: ToolDecisionState | null) => void;
  evaluateAndSetToolDecision: (prompt: string) => ToolDecisionState;
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

  editorSelection: { text: string; startLine: number; endLine: number; filePath?: string } | null;
  setEditorSelection: (sel: { text: string; startLine: number; endLine: number; filePath?: string } | null) => void;
  isAddContextModalOpen: boolean;
  setAddContextModalOpen: (open: boolean) => void;
  isSkillSelectorModalOpen: boolean;
  setSkillSelectorModalOpen: (open: boolean) => void;
  activeSkillIdsForChat: string[];
  toggleSkillForChat: (skillName: string) => void;
  setActiveSkillIdsForChat: (skills: string[]) => void;
  activeAgentClass: AgentClassType | 'auto';
  setActiveAgentClass: (cls: AgentClassType | 'auto') => void;
  activeRepoPath: string | null;
  setActiveRepoPath: (repoPath: string | null) => void;
  isDiffReviewModalOpen: boolean;
  setDiffReviewModalOpen: (open: boolean) => void;
  pendingAgentDiffs: AgentFileDiffSnapshot[];
  addAgentDiffSnapshot: (snap: AgentFileDiffSnapshot) => void;
  clearAgentDiffSnapshots: () => void;
  revertAgentDiff: (diffId: string) => Promise<boolean>;
  revertAllAgentDiffs: (diffIds?: string[]) => Promise<boolean>;
  avatarStyle: AvatarStyle;
  setAvatarStyle: (style: AvatarStyle) => void;

  globalConfig: ConfigItem[];
  workspaceConfigs: Record<string, Record<string, boolean>>; // workspaceId -> { configId: isActive }
  toggleGlobalConfig: (id: string, active: boolean) => void;
  toggleWorkspaceConfig: (workspaceId: string, configId: string, active: boolean) => void;

  panelOrder: PanelId[];
  panelVisible: Record<PanelId, boolean>;
  panelWidths: Record<PanelId, number>;
  panelHeights: Record<PanelId, number>;
  panelDetached: Record<PanelId, boolean>;
  panelCollapsed: Record<PanelId, boolean>;
  layoutPreset: LayoutPreset;
  setLayoutPreset: (preset: LayoutPreset) => void;
  terminalDockPosition: 'bottom' | 'column';
  setTerminalDockPosition: (pos: 'bottom' | 'column') => void;
  movePanel: (panelId: PanelId, direction: 'left' | 'right') => void;
  setPanelOrder: (newOrder: PanelId[]) => void;
  togglePanelVisible: (panelId: PanelId) => void;
  togglePanelCollapse: (panelId: PanelId) => void;
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
  agentsCenterTab: 'rules' | 'skills' | 'workflows' | 'plugins' | 'subagents' | 'combos' | 'memory';
  setAgentsCenterTab: (tab: 'rules' | 'skills' | 'workflows' | 'plugins' | 'subagents' | 'combos' | 'memory') => void;
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
  assigningSubagent: SubagentPersona | null;
  setAssigningSubagent: (subagent: SubagentPersona | null) => void;
  addSubagent: (subagent: SubagentPersona) => void;
  updateSubagent: (id: string, patch: Partial<SubagentPersona>) => void;
  deleteSubagent: (id: string) => void;
  toggleSubagentActive: (id: string, active: boolean, targetScopeId?: string) => void;
  getActiveSubagentsForContext: (workspaceId?: string, repoPath?: string) => SubagentPersona[];

  agentProfiles: Record<string, AgentProfileConfig>;
  tuningAgentProfile: AgentProfileConfig | null;
  setTuningAgentProfile: (profile: AgentProfileConfig | null) => void;
  updateAgentProfile: (agentId: string, patch: Partial<AgentProfileConfig>) => void;
  getAgentProfile: (agentId: string) => AgentProfileConfig;

  agentCombos: AgentCombo[];
  activeComboId: string;
  repoComboBindings: Record<string, string>;
  isComboFlowEnabled: boolean;
  isComboModalOpen: boolean;
  isCreateComboModalOpen: boolean;
  editingCombo: AgentCombo | null;
  setComboModalOpen: (open: boolean) => void;
  setCreateComboModalOpen: (open: boolean, editing?: AgentCombo | null) => void;
  toggleComboFlowEnabled: (enabled?: boolean) => void;
  setActiveCombo: (comboId: string, scopeKey?: string) => void;
  bindComboToScope: (scopeKey: string, comboId: string) => void;
  saveAgentCombo: (combo: AgentCombo) => void;
  deleteAgentCombo: (comboId: string) => void;
  getActiveCombo: () => AgentCombo;
  auditWorkspaceForCombo: (workspaceId?: string, repoPath?: string) => Promise<WorkspaceComboAuditResult>;

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

const defaultSubagents: SubagentPersona[] = standardBuiltinSubagents;

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

const initialLayout = loadInitialPanelLayout();
const extractFolderPath = (f: any): string => (typeof f === 'string' ? f : (f?.folderPath || f?.path || '')).trim();

export const useAgentStore = create<AgentState>((set, get) => ({
  systemContext: { cwd: '/', workspaces: [], activeWorkspaceId: null, expandedFolders: {}, fileTree: [], refreshCounter: 0, showHiddenFiles: false, editingWorkspaceId: null },
  activeRules: [],
  agentSkills: defaultBuiltinSkills,
  detectedRepoSkills: [],
  agentWorkflows: defaultWorkflows,
  mcpPlugins: defaultPlugins,
  subagentPersonas: defaultSubagents,
  assigningSubagent: null,
  agentProfiles: loadAllAgentProfiles(defaultSubagents),
  tuningAgentProfile: null,
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
  googleAccount: null,
  codexAccount: null,
  claudeAccount: null,
  isAccountModalOpen: false,
  isCloneModalOpen: false,
  isConfigModalOpen: false,
  isOllamaModalOpen: false,
  themeMode: (typeof localStorage !== 'undefined' ? (localStorage.getItem('lam_theme_mode') as ThemeMode) : null) || 'dark',
  themeStyle: (typeof localStorage !== 'undefined' ? (localStorage.getItem('lam_theme_style') as ThemeStyle) : null) || 'glassmorphism',
  accentColor: (typeof localStorage !== 'undefined' ? localStorage.getItem('lam_accent_color') : null) || '#3b82f6',
  isThemeModalOpen: false,
  isSettingCenterModalOpen: false,
  agentPermissions: loadAgentPermissions(),
  isBenchmarkModalOpen: false,
  isAutomationModalOpen: false,
  isSwarmModalOpen: false,
  isCreateAgentModalOpen: false,
  createAgentInitialContext: null,
  liveModels: [],
  isFetchingLiveModels: false,
  isAgentsCenterOpen: false,
  agentsCenterTab: 'rules',
  agentCombos: getAllAgentCombos(),
  activeComboId: resolveActiveComboForScope().id,
  repoComboBindings: loadRepoComboBindings(),
  isComboFlowEnabled: typeof localStorage !== 'undefined' ? localStorage.getItem('lam_combo_flow_enabled') !== 'false' : true,
  isComboModalOpen: false,
  isCreateComboModalOpen: false,
  editingCombo: null,
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
  panelOrder: initialLayout.panelOrder,
  panelVisible: initialLayout.panelVisible,
  panelWidths: initialLayout.panelWidths,
  panelHeights: initialLayout.panelHeights,
  panelDetached: initialLayout.panelDetached,
  panelCollapsed: initialLayout.panelCollapsed || { explorer: false, editor: false, terminal: false, agent: false, 'agents-center': false, browser: false },
  layoutPreset: initialLayout.layoutPreset,
  terminalDockPosition: initialLayout.terminalDockPosition,
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
  pendingChatPrompt: null,
  setPendingChatPrompt: (pendingChatPrompt) => set({ pendingChatPrompt }),
  chatInputDraft: null,
  setChatInputDraft: (chatInputDraft) => set({ chatInputDraft }),
  toolDecisionState: null,
  setToolDecisionState: (toolDecisionState) => set({ toolDecisionState }),
  evaluateAndSetToolDecision: (prompt: string) => {
    const activeFile = get().activeFile?.path;
    const decision = evaluateToolDecision(prompt, { activeFile });
    set({ toolDecisionState: decision });
    return decision;
  },
  contextAttachments: [],
  editorSelection: null,
  setEditorSelection: (editorSelection) => set({ editorSelection }),
  isAddContextModalOpen: false,
  setAddContextModalOpen: (isAddContextModalOpen) => set({ isAddContextModalOpen }),
  isSkillSelectorModalOpen: false,
  setSkillSelectorModalOpen: (isSkillSelectorModalOpen) => set({ isSkillSelectorModalOpen }),
  activeSkillIdsForChat: loadActiveSkillIds(null),
  activeRepoPath: null,
  setActiveRepoPath: (activeRepoPath) => set({ activeRepoPath }),
  toggleSkillForChat: (skillName) => set((state) => {
    const targetSkill = state.agentSkills.find(
      (s) => s.name === skillName || s.id === skillName || s.folderName === skillName
    );
    const identifiers = targetSkill
      ? ([targetSkill.name, targetSkill.id, targetSkill.folderName].filter(Boolean) as string[])
      : [skillName];

    const isCurrentlyActive = identifiers.some((id) => state.activeSkillIdsForChat.includes(id));
    const activeSkillIdsForChat = isCurrentlyActive
      ? state.activeSkillIdsForChat.filter((s) => !identifiers.includes(s))
      : Array.from(new Set([...state.activeSkillIdsForChat, skillName]));

    saveActiveSkillIds(state.systemContext.activeWorkspaceId, activeSkillIdsForChat);
    return { activeSkillIdsForChat };
  }),
  setActiveSkillIdsForChat: (activeSkillIdsForChat) => set((state) => {
    saveActiveSkillIds(state.systemContext.activeWorkspaceId, activeSkillIdsForChat);
    return { activeSkillIdsForChat };
  }),
  activeAgentClass: 'auto',
  setActiveAgentClass: (activeAgentClass) => set({ activeAgentClass }),
  isDiffReviewModalOpen: false,
  setDiffReviewModalOpen: (isDiffReviewModalOpen) => set({ isDiffReviewModalOpen }),
  pendingAgentDiffs: [],
  addAgentDiffSnapshot: (snap) => set((state) => {
    // Preserve first originalContent if file was already modified earlier in the batch
    const existing = state.pendingAgentDiffs.find(d => d.filePath === snap.filePath);
    const effectiveSnap: AgentFileDiffSnapshot = existing
      ? { ...snap, originalContent: existing.originalContent }
      : snap;

    const updatedTabs = state.openTabs.map(t => {
      const match = t.path === effectiveSnap.filePath ||
        (effectiveSnap.relativePath && (t.path.endsWith(effectiveSnap.relativePath) || effectiveSnap.filePath.endsWith(t.path)));
      if (match) {
        return { ...t, content: effectiveSnap.newContent };
      }
      return t;
    });

    const isCurrentActive = state.activeFile && (
      state.activeFile.path === effectiveSnap.filePath ||
      (effectiveSnap.relativePath && (state.activeFile.path.endsWith(effectiveSnap.relativePath) || effectiveSnap.filePath.endsWith(state.activeFile.path)))
    );

    const updatedActive = isCurrentActive && state.activeFile
      ? { ...state.activeFile, content: effectiveSnap.newContent }
      : state.activeFile;

    return {
      pendingAgentDiffs: [effectiveSnap, ...state.pendingAgentDiffs.filter(d => d.filePath !== effectiveSnap.filePath)],
      openTabs: updatedTabs,
      activeFile: updatedActive
    };
  }),
  clearAgentDiffSnapshots: () => set({ pendingAgentDiffs: [] }),
  revertAgentDiff: async (diffId) => {
    const diff = get().pendingAgentDiffs.find(d => d.id === diffId);
    if (!diff) return false;
    try {
      const saveFn = window.lamApi?.fs?.saveFile || (window.lamApi as any)?.file?.saveFile;
      if (saveFn) {
        const res = await saveFn(diff.filePath, diff.originalContent);
        if (res && res.success === false) {
          throw new Error(res.error || 'Failed to save file');
        }
      }

      // Sync openTabs in editor
      const updatedTabs = get().openTabs.map(t => {
        const match = t.path === diff.filePath ||
          (diff.relativePath && (t.path.endsWith(diff.relativePath) || diff.filePath.endsWith(t.path)));
        return match ? { ...t, content: diff.originalContent } : t;
      });

      // Sync activeFile in editor
      const isCurrentActive = get().activeFile && (
        get().activeFile!.path === diff.filePath ||
        (diff.relativePath && (get().activeFile!.path.endsWith(diff.relativePath) || diff.filePath.endsWith(get().activeFile!.path)))
      );
      const updatedActive = isCurrentActive && get().activeFile
        ? { ...get().activeFile!, content: diff.originalContent }
        : get().activeFile;

      set(state => ({
        pendingAgentDiffs: state.pendingAgentDiffs.filter(d => d.id !== diffId),
        openTabs: updatedTabs,
        activeFile: updatedActive
      }));

      get().addToast(`Reverted ${diff.relativePath} to original state`, 'success');
      return true;
    } catch (err: any) {
      get().addToast(`Failed to revert: ${err.message}`, 'error');
      return false;
    }
  },
  revertAllAgentDiffs: async (diffIds?: string[]) => {
    const state = get();
    const targets = diffIds && diffIds.length > 0
      ? state.pendingAgentDiffs.filter(d => diffIds.includes(d.id))
      : state.pendingAgentDiffs;
    if (targets.length === 0) return false;

    let successCount = 0;
    const saveFn = window.lamApi?.fs?.saveFile || (window.lamApi as any)?.file?.saveFile;

    for (const diff of targets) {
      try {
        if (saveFn) {
          await saveFn(diff.filePath, diff.originalContent);
        }
        successCount++;
      } catch (err: any) {
        console.error(`Failed to revert ${diff.filePath}:`, err);
      }
    }

    const targetIds = new Set(targets.map(d => d.id));

    const updatedTabs = state.openTabs.map(t => {
      const matchDiff = targets.find(d =>
        d.filePath === t.path ||
        (d.relativePath && (t.path.endsWith(d.relativePath) || d.filePath.endsWith(t.path)))
      );
      return matchDiff ? { ...t, content: matchDiff.originalContent } : t;
    });

    const isCurrentActive = state.activeFile && targets.some(d =>
      d.filePath === state.activeFile!.path ||
      (d.relativePath && (state.activeFile!.path.endsWith(d.relativePath) || d.filePath.endsWith(state.activeFile!.path)))
    );
    const activeDiff = isCurrentActive
      ? targets.find(d => d.filePath === state.activeFile!.path || (d.relativePath && (state.activeFile!.path.endsWith(d.relativePath) || d.filePath.endsWith(state.activeFile!.path))))
      : null;
    const updatedActive = activeDiff && state.activeFile
      ? { ...state.activeFile, content: activeDiff.originalContent }
      : state.activeFile;

    set(prev => ({
      pendingAgentDiffs: prev.pendingAgentDiffs.filter(d => !targetIds.has(d.id)),
      openTabs: updatedTabs,
      activeFile: updatedActive
    }));

    if (successCount > 0) {
      get().addToast(`Successfully reverted ${successCount} file${successCount > 1 ? 's' : ''}`, 'success');
      return true;
    } else {
      get().addToast('Failed to revert files', 'error');
      return false;
    }
  },
  avatarStyle: (typeof localStorage !== 'undefined' ? (localStorage.getItem('lam_agent_avatar_style') as AvatarStyle) : null) || 'pixel',
  setAvatarStyle: (avatarStyle) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lam_agent_avatar_style', avatarStyle);
    }
    set({ avatarStyle });
  },
  engineSettings: {
    selectedModel: 'gemini-3.5-flash-lite',
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
    communicationTone: 'executive',
    explanationVerbosity: 'concise',
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
    persistPanelLayout({ panelOrder: order });
    return { panelOrder: order };
  }),

  setPanelOrder: (newOrder) => {
    persistPanelLayout({ panelOrder: newOrder });
    set({ panelOrder: newOrder });
  },

  togglePanelVisible: (panelId) => {
    const state = get();
    if (state.panelDetached[panelId]) {
      // @ts-ignore
      window.lamApi?.panel?.close?.(panelId);
      const nextDetached = { ...state.panelDetached, [panelId]: false };
      const nextVisible = { ...state.panelVisible, [panelId]: false };
      persistPanelLayout({ panelDetached: nextDetached, panelVisible: nextVisible });
      set({ panelDetached: nextDetached, panelVisible: nextVisible });
      state.addToast(`Closed detached ${panelId} window`, 'info');
      return;
    }

    const isCurrentlyVisible = !!state.panelVisible[panelId];
    const nextVisible = { ...state.panelVisible, [panelId]: !isCurrentlyVisible };
    persistPanelLayout({ panelVisible: nextVisible });
    set({ panelVisible: nextVisible });
  },

  togglePanelCollapse: (panelId) => {
    const nextCollapsed = { ...get().panelCollapsed, [panelId]: !get().panelCollapsed[panelId] };
    persistPanelLayout({ panelCollapsed: nextCollapsed });
    set({ panelCollapsed: nextCollapsed });
  },

  setPanelVisible: (panelId, visible) => {
    const state = get();
    if (!visible && state.panelDetached[panelId]) {
      // @ts-ignore
      window.lamApi?.panel?.close?.(panelId);
      const nextDetached = { ...state.panelDetached, [panelId]: false };
      const nextVisible = { ...state.panelVisible, [panelId]: false };
      persistPanelLayout({ panelDetached: nextDetached, panelVisible: nextVisible });
      set({ panelDetached: nextDetached, panelVisible: nextVisible });
      return;
    }
    if (visible) {
      const activeInMain = state.panelOrder.filter(id => id !== panelId && state.panelVisible[id] && !state.panelDetached[id]);
      if (activeInMain.length >= 3) {
        state.detachPanel(panelId);
        state.addToast(`Workspace limit (3 panels): Opened ${panelId} in a new window.`, 'info');
        return;
      }
    }
    const nextVisible = { ...state.panelVisible, [panelId]: visible };
    persistPanelLayout({ panelVisible: nextVisible });
    set({ panelVisible: nextVisible });
  },

  setLayoutPreset: (preset) => {
    const state = get();
    let nextLayout: Partial<PersistedLayoutState> = {};
    if (preset === 'vscode-dock') {
      nextLayout = {
        layoutPreset: 'vscode-dock',
        terminalDockPosition: 'bottom',
        panelVisible: { explorer: true, editor: true, terminal: true, agent: false, 'agents-center': false, browser: false },
        panelDetached: { explorer: false, editor: false, terminal: false, agent: false, 'agents-center': false, browser: false }
      };
      state.addToast('Layout: VS Code Dock (Terminal at bottom)', 'info');
    } else if (preset === 'columns-3') {
      nextLayout = {
        layoutPreset: 'columns-3',
        terminalDockPosition: 'column',
        panelVisible: { explorer: true, editor: true, agent: true, terminal: false, 'agents-center': false, browser: false },
        panelDetached: { explorer: false, editor: false, agent: false, terminal: false, 'agents-center': false, browser: false }
      };
      state.addToast('Layout: 3 Columns (Explorer, Editor, AI Studio)', 'info');
    } else if (preset === 'focus-code') {
      nextLayout = {
        layoutPreset: 'focus-code',
        terminalDockPosition: 'bottom',
        panelVisible: { explorer: false, editor: true, terminal: true, agent: false, 'agents-center': false, browser: false },
        panelDetached: { explorer: false, editor: false, terminal: false, agent: false, 'agents-center': false, browser: false }
      };
      state.addToast('Layout: Focus Code (Editor + Terminal)', 'info');
    } else if (preset === 'custom') {
      nextLayout = {
        layoutPreset: 'custom'
      };
      state.addToast('Layout: Tự do (Custom Freeform unlocked)', 'info');
    }
    persistPanelLayout(nextLayout);
    set(nextLayout);
  },

  setTerminalDockPosition: (pos) => {
    persistPanelLayout({ terminalDockPosition: pos });
    set({ terminalDockPosition: pos });
  },

  setPanelWidth: (panelId, width) => {
    const nextWidths = { ...get().panelWidths, [panelId]: Math.max(120, Math.min(1600, width)) };
    persistPanelLayout({ panelWidths: nextWidths, layoutPreset: 'custom' });
    set({ panelWidths: nextWidths, layoutPreset: 'custom' });
  },

  setPanelHeight: (panelId, height) => {
    const nextHeights = { ...get().panelHeights, [panelId]: Math.max(80, Math.min(800, height)) };
    persistPanelLayout({ panelHeights: nextHeights, layoutPreset: 'custom' });
    set({ panelHeights: nextHeights, layoutPreset: 'custom' });
  },

  setPanelDetached: (panelId, detached) => {
    const nextDetached = { ...get().panelDetached, [panelId]: detached };
    const nextVisible = { ...get().panelVisible, [panelId]: !detached };
    persistPanelLayout({ panelDetached: nextDetached, panelVisible: nextVisible });
    set({ panelDetached: nextDetached, panelVisible: nextVisible });
  },

  detachPanel: (panelId) => {
    // @ts-ignore
    window.lamApi?.panel?.detach(panelId);
    const nextDetached = { ...get().panelDetached, [panelId]: true };
    const nextVisible = { ...get().panelVisible, [panelId]: false };
    persistPanelLayout({ panelDetached: nextDetached, panelVisible: nextVisible });
    set({ panelDetached: nextDetached, panelVisible: nextVisible });
  },

  redockPanel: (panelId) => {
    // @ts-ignore
    window.lamApi?.panel?.redock(panelId);
    const nextDetached = { ...get().panelDetached, [panelId]: false };
    const nextVisible = { ...get().panelVisible, [panelId]: true };
    persistPanelLayout({ panelDetached: nextDetached, panelVisible: nextVisible });
    set({ panelDetached: nextDetached, panelVisible: nextVisible });
  },

  resetPanelLayout: () => {
    const defaultOrder: PanelId[] = ['explorer', 'editor', 'terminal', 'agent', 'agents-center', 'browser'];
    const resetState = {
      panelOrder: defaultOrder,
      layoutPreset: 'vscode-dock' as LayoutPreset,
      terminalDockPosition: 'bottom' as const,
      panelVisible: { explorer: true, editor: true, terminal: true, agent: false, 'agents-center': false, browser: false },
      panelWidths: { explorer: 260, editor: 560, terminal: 360, agent: 340, 'agents-center': 440, browser: 440 },
      panelHeights: { explorer: 300, editor: 300, terminal: 260, agent: 300, 'agents-center': 300, browser: 300 },
      panelDetached: { explorer: false, editor: false, terminal: false, agent: false, 'agents-center': false, browser: false },
      panelCollapsed: { explorer: false, editor: false, terminal: false, agent: false, 'agents-center': false, browser: false }
    };
    persistPanelLayout(resetState);
    set(resetState);
  },

  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  updateChatMessage: (id, patch) => set((state) => ({
    chatMessages: state.chatMessages.map(m => m.id === id ? { ...m, ...patch } : m)
  })),
  clearChatMessages: () => set({ chatMessages: [] }),
  addContextAttachment: (attachment) => set((state) => {
    const isDuplicate = state.contextAttachments.some((a) => {
      if (a.id === attachment.id) return true;
      if (attachment.type === 'snippet' || a.type === 'snippet') {
        return a.path === attachment.path && a.name === attachment.name;
      }
      return a.path === attachment.path;
    });
    if (isDuplicate) {
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
  setOllamaModalOpen: (open: boolean) => set({ isOllamaModalOpen: open }),
  setThemeModalOpen: (open: boolean) => set({ isThemeModalOpen: open }),
  setSettingCenterModalOpen: (open: boolean) => set({ isSettingCenterModalOpen: open }),
  updateAgentPermissions: (patch: Partial<AgentPermissionsSettings>) => {
    const current = get().agentPermissions;
    const updated: AgentPermissionsSettings = {
      terminal: { ...current.terminal, ...(patch.terminal || {}) },
      browser: { ...current.browser, ...(patch.browser || {}) },
      sandbox: { ...current.sandbox, ...(patch.sandbox || {}) },
    };
    set({ agentPermissions: updated });
    void saveAgentPermissions(updated);
  },
  resetAgentPermissions: () => {
    set({ agentPermissions: DEFAULT_AGENT_PERMISSIONS });
    void saveAgentPermissions(DEFAULT_AGENT_PERMISSIONS);
  },
  setBenchmarkModalOpen: (open: boolean) => set({ isBenchmarkModalOpen: open }),
  setAutomationModalOpen: (open: boolean) => set({ isAutomationModalOpen: open }),
  setSwarmModalOpen: (open: boolean) => set({ isSwarmModalOpen: open }),
  setThemeMode: (mode) => {
    const { themeStyle, accentColor } = get();
    applyTheme(mode, themeStyle, accentColor);
    set({ themeMode: mode });
    void saveAppearanceSettings(mode, themeStyle, accentColor);
  },
  setThemeStyle: (style) => {
    const { themeMode, accentColor } = get();
    applyTheme(themeMode, style, accentColor);
    set({ themeStyle: style });
    void saveAppearanceSettings(themeMode, style, accentColor);
  },
  setAccentColor: (color) => {
    const { themeMode, themeStyle } = get();
    applyTheme(themeMode, themeStyle, color);
    set({ accentColor: color });
    void saveAppearanceSettings(themeMode, themeStyle, color);
  },
  openCreateAgentModal: (ctx) => set({ isCreateAgentModalOpen: true, createAgentInitialContext: ctx || null }),
  closeCreateAgentModal: () => set({ isCreateAgentModalOpen: false, createAgentInitialContext: null }),
  fetchLiveModels: async (customProvider, customKey) => {
    const state = get();
    const provider = (customProvider || state.engineSettings.provider || 'gemini') as any;
    const apiKey = customKey || state.engineSettings.customApiKey || '';
    if (provider !== 'antigravity' && provider !== 'codex' && provider !== 'claudecode' && !apiKey.trim()) return;

    set({ isFetchingLiveModels: true });
    try {
      if (provider === 'antigravity') {
        // @ts-ignore
        const status = await window.lamApi?.google?.getStatus?.();
        if (status?.models?.length > 0) {
          set({
            liveModels: status.models.map((m: any) => ({
              id: m.id,
              name: m.name,
              displayName: m.name,
              provider: 'Google Antigravity',
              description: 'Pro Tier Engine'
            }))
          });
          return;
        }
      }
      if (provider === 'codex') {
        // @ts-ignore
        const status = await window.lamApi?.codex?.getStatus?.();
        if (status?.models?.length > 0) {
          set({
            liveModels: status.models.map((m: any) => ({
              id: m.id,
              name: m.name,
              displayName: m.name,
              provider: 'OpenAI Codex',
              description: 'ChatGPT Plan Quota'
            }))
          });
          return;
        }
      }
      if (provider === 'claudecode') {
        // @ts-ignore
        const status = await window.lamApi?.claude?.getStatus?.();
        if (status?.models?.length > 0) {
          set({
            liveModels: status.models.map((m: any) => ({
              id: m.id,
              name: m.name,
              displayName: m.name,
              provider: 'Anthropic Claude Code',
              description: 'Official CLI Quota'
            }))
          });
          return;
        }
      }
      // @ts-ignore
      const res = await window.lamApi?.cloud?.getModels?.(provider, apiKey, state.engineSettings.baseUrl);
      if (res?.success && Array.isArray(res.models) && res.models.length > 0) {
        set({ liveModels: res.models });
      }
    } catch {
      // ignore
    } finally {
      set({ isFetchingLiveModels: false });
    }
  },
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
    const foldersToScan = new Set<string>();
    if (state.systemContext.cwd && state.systemContext.cwd !== '/') {
      foldersToScan.add(state.systemContext.cwd);
    }
    for (const ws of state.systemContext.workspaces) {
      for (const rawFolder of (ws.folders || [])) {
        const folder = extractFolderPath(rawFolder);
        if (folder) foldersToScan.add(folder);
      }
    }

    for (const folder of foldersToScan) {
      const normFolder = folder.replace(/\\/g, '/').toLowerCase();
      const matchedWs = state.systemContext.workspaces.find(w =>
        (w.folders || []).some(f => extractFolderPath(f).replace(/\\/g, '/').toLowerCase() === normFolder)
      );
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
                workspaceId: matchedWs?.id || '',
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
    const scannedFolders = new Set<string>();
    const foldersToScan = new Set<string>();
    if (state.systemContext.cwd && state.systemContext.cwd !== '/') {
      foldersToScan.add(state.systemContext.cwd);
    }
    for (const ws of state.systemContext.workspaces) {
      for (const rawFolder of (ws.folders || [])) {
        const folder = extractFolderPath(rawFolder);
        if (folder) foldersToScan.add(folder);
      }
    }

    for (const folder of foldersToScan) {
      const normFolder = extractFolderPath(folder).replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '');
      if (scannedFolders.has(normFolder)) continue;
      scannedFolders.add(normFolder);
      const matchedWs = state.systemContext.workspaces.find(w =>
        (w.folders || []).some(f => extractFolderPath(f).replace(/\\/g, '/').toLowerCase() === normFolder)
      );

      try {
        // @ts-ignore
        const res = await window.lamApi?.skills?.scanRepoSkills?.(folder);
          if (res?.success && Array.isArray(res.data)) {
            for (const item of res.data) {
              const normFilePath = (item.filePath || '').replace(/\\/g, '/').toLowerCase();
              const skillId = `repo-skill-${normFolder}-${item.folderName}`.replace(/[\\/:]/g, '-');

              if (!detected.some(d => (d.filePath || '').replace(/\\/g, '/').toLowerCase() === normFilePath)) {
                detected.push({
                  name: item.name,
                  folderName: item.folderName,
                  description: item.description,
                  filePath: item.filePath,
                  content: item.content,
                  size: item.size,
                  repoPath: folder,
                  workspaceId: matchedWs?.id || '',
                });
              }

              const inNew = newSkills.some(s => s.id === skillId || (s.filePath && s.filePath.replace(/\\/g, '/').toLowerCase() === normFilePath));
              if (!inNew) {
                newSkills.push({
                  id: skillId,
                  name: item.name,
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

    set((curr) => {
      const normScannedList = Array.from(scannedFolders);
      const retainedSkills = curr.agentSkills.filter(s => {
        if (s.scope !== 'repo') return true;
        if (!s.targetId) return true;
        const sTarget = s.targetId.replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '');
        return !normScannedList.includes(sTarget);
      });
      return {
        detectedRepoSkills: detected,
        agentSkills: [...retainedSkills, ...newSkills]
      };
    });
  },
  getActiveSkillsForContext: (workspaceId?: string, repoPath?: string): AgentSkill[] => {
    const state = get();
    const rawRepo = extractFolderPath(repoPath);
    const normRepo = rawRepo ? rawRepo.replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '') : '';
    return state.agentSkills.filter((skill: AgentSkill) => {
      if (skill.scope === 'global') {
        if (!skill.active) return false;
        if (workspaceId && skill.disabledIn?.includes(workspaceId)) return false;
        if (normRepo && skill.disabledIn?.some(d => extractFolderPath(d).replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '') === normRepo)) return false;
        return true;
      }
      if (skill.scope === 'workspace') return workspaceId ? skill.targetId === workspaceId : false;
      if (skill.scope === 'repo') {
        if (!normRepo || !skill.targetId) return false;
        return extractFolderPath(skill.targetId).replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '') === normRepo;
      }
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
  setAssigningSubagent: (assigningSubagent: SubagentPersona | null) => set({ assigningSubagent }),
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

  setTuningAgentProfile: (tuningAgentProfile: AgentProfileConfig | null) => set({ tuningAgentProfile }),
  updateAgentProfile: (agentId: string, patch: Partial<AgentProfileConfig>) => {
    const state = get();
    const existing = state.agentProfiles[agentId] || (agentId === 'father-agent' ? createDefaultFatherAgentProfile() : null);
    if (!existing) return;
    const updated = { ...existing, ...patch, updatedAt: Date.now() };
    const nextProfiles = { ...state.agentProfiles, [agentId]: updated };
    persistAgentProfiles(nextProfiles);
    set({ agentProfiles: nextProfiles });
  },
  getAgentProfile: (agentId: string): AgentProfileConfig => {
    const state = get();
    return state.agentProfiles[agentId] || (agentId === 'father-agent'
      ? createDefaultFatherAgentProfile()
      : createDefaultSubagentProfile({ id: agentId, name: 'Subagent', role: 'Specialist' }));
  },

  setComboModalOpen: (open: boolean) => set({ isComboModalOpen: open }),
  setCreateComboModalOpen: (open: boolean, editing: AgentCombo | null = null) => set({ isCreateComboModalOpen: open, editingCombo: editing }),
  toggleComboFlowEnabled: (enabled?: boolean) => {
    const next = enabled !== undefined ? enabled : !get().isComboFlowEnabled;
    try {
      localStorage.setItem('lam_combo_flow_enabled', String(next));
    } catch {}
    set({ isComboFlowEnabled: next });
  },
  setActiveCombo: (comboId: string, scopeKey?: string) => {
    storeActiveComboId(comboId);
    if (scopeKey) {
      const bindings = { ...get().repoComboBindings, [scopeKey]: comboId };
      saveRepoComboBindings(bindings);
      set({ activeComboId: comboId, repoComboBindings: bindings });
    } else {
      set({ activeComboId: comboId });
    }
  },
  bindComboToScope: (scopeKey: string, comboId: string) => {
    const bindings = { ...get().repoComboBindings, [scopeKey]: comboId };
    saveRepoComboBindings(bindings);
    set({ repoComboBindings: bindings });
  },
  saveAgentCombo: (combo: AgentCombo) => {
    const current = get().agentCombos;
    const exists = current.some((c) => c.id === combo.id);
    const updated = exists
      ? current.map((c) => (c.id === combo.id ? { ...combo, updatedAt: Date.now() } : c))
      : [combo, ...current];
    saveCustomCombos(updated);
    set({ agentCombos: updated });
  },
  deleteAgentCombo: (comboId: string) => {
    const updated = get().agentCombos.filter((c) => c.id !== comboId);
    saveCustomCombos(updated);
    set({ agentCombos: updated });
  },
  getActiveCombo: (): AgentCombo => {
    const { agentCombos, repoComboBindings, systemContext } = get();
    const activeWs = systemContext.workspaces.find((w) => w.id === systemContext.activeWorkspaceId);
    const repoPath = activeWs?.folders?.[0];
    return resolveActiveComboForScope(repoPath, activeWs?.id, agentCombos, repoComboBindings);
  },
  auditWorkspaceForCombo: async (workspaceId?: string, repoPath?: string): Promise<WorkspaceComboAuditResult> => {
    const state = get();
    const activeWs = workspaceId ? state.systemContext.workspaces.find(w => w.id === workspaceId) : state.systemContext.workspaces.find(w => w.id === state.systemContext.activeWorkspaceId);
    const targetPath = repoPath || activeWs?.folders?.[0] || state.systemContext.cwd;
    const result = await auditWorkspaceFolderForCombo(targetPath, state.agentCombos);
    const repoInfo = resolveWorkspaceRepoInfo(targetPath, state.systemContext.workspaces, activeWs?.id, state.systemContext.cwd);
    state.setActiveCombo(result.recommendedComboId, repoInfo.formattedTag);
    state.bindComboToScope(repoInfo.formattedTag, result.recommendedComboId);
    if (targetPath) state.bindComboToScope(targetPath, result.recommendedComboId);
    state.addToast(`⚡ Gợi ý Combo: Đã chọn [${result.recommendedComboName}] (${(result.confidence * 100).toFixed(0)}%)`, 'success');
    return result;
  },

  addMemory: (memory: ProjectMemoryItem) => set((state) => {
    const projectMemories = [memory, ...state.projectMemories];
    const ws = state.systemContext.workspaces.find(w => w.id === state.systemContext.activeWorkspaceId);
    // @ts-ignore
    window.lamApi?.storage?.saveMemories?.(projectMemories, ws?.folders?.[0]);
    return { projectMemories };
  }),
  updateMemory: (id: string, patch: Partial<ProjectMemoryItem>) => set((state) => {
    const projectMemories = state.projectMemories.map((m: ProjectMemoryItem) => m.id === id ? { ...m, ...patch, updatedAt: Date.now() } : m);
    const ws = state.systemContext.workspaces.find(w => w.id === state.systemContext.activeWorkspaceId);
    // @ts-ignore
    window.lamApi?.storage?.saveMemories?.(projectMemories, ws?.folders?.[0]);
    return { projectMemories };
  }),
  deleteMemory: (id: string) => set((state) => {
    const projectMemories = state.projectMemories.filter((m: ProjectMemoryItem) => m.id !== id);
    const ws = state.systemContext.workspaces.find(w => w.id === state.systemContext.activeWorkspaceId);
    // @ts-ignore
    window.lamApi?.storage?.saveMemories?.(projectMemories, ws?.folders?.[0]);
    return { projectMemories };
  }),
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
  setGoogleAccount: (account) => set({ googleAccount: account }),
  syncGoogleStatus: async () => {
    try {
      // @ts-ignore
      const status = await window.lamApi?.google?.getStatus?.();
      if (status) {
        set({ googleAccount: status });
        if (status.connected && (get().engineSettings.provider === 'antigravity' || !get().engineSettings.customApiKey)) {
          get().updateEngineSettings({
            provider: 'antigravity',
            selectedModel: get().engineSettings.selectedModel || status.models?.[0]?.id || 'gemini-3.8-flash-high'
          });
        }
        return status;
      }
    } catch (e) {
      console.error('Failed to sync Google status:', e);
    }
    return null;
  },
  connectGoogleAccount: async () => {
    try {
      // @ts-ignore
      const res = await window.lamApi?.google?.login?.();
      if (res?.success && res?.status) {
        set({ googleAccount: res.status });
        get().updateEngineSettings({
          provider: 'antigravity',
          selectedModel: res.status.models?.[0]?.id || 'gemini-3.8-flash-high'
        });
        // @ts-ignore
        window.lamApi?.settingsAPI?.saveSettings?.({ aiProvider: 'antigravity' });
        get().addToast('Google Antigravity Session Connected Successfully', 'success');
        return true;
      } else {
        get().addToast(`Google Login Failed: ${res?.error || 'Unknown error'}`, 'error');
        return false;
      }
    } catch (e: any) {
      get().addToast(`Google Login Error: ${e.message}`, 'error');
      return false;
    }
  },
  disconnectGoogleAccount: async () => {
    try {
      // @ts-ignore
      await window.lamApi?.google?.disconnect?.();
      set({ googleAccount: null });
      if (get().engineSettings.provider === 'antigravity') {
        get().updateEngineSettings({ provider: 'gemini', selectedModel: 'gemini-3.5-flash-lite' });
        // @ts-ignore
        window.lamApi?.settingsAPI?.saveSettings?.({ aiProvider: 'gemini' });
      }
      get().addToast('Google Antigravity Disconnected', 'info');
    } catch (e) {
      console.error('Failed to disconnect Google Antigravity:', e);
    }
  },
  setCodexAccount: (account) => set({ codexAccount: account }),
  syncCodexStatus: async () => {
    try {
      // @ts-ignore
      const status = await window.lamApi?.codex?.getStatus?.();
      if (status) {
        set({ codexAccount: status });
        if (status.connected && get().engineSettings.provider === 'codex') {
          get().updateEngineSettings({
            provider: 'codex',
            selectedModel: get().engineSettings.selectedModel || status.models?.[0]?.id || 'gpt-6.1-sol'
          });
        }
        return status;
      }
    } catch (e) {
      console.error('Failed to sync Codex status:', e);
    }
    return null;
  },
  connectCodexAccount: async () => {
    try {
      // @ts-ignore
      const res = await window.lamApi?.codex?.login?.();
      if (res?.success && res?.status) {
        set({ codexAccount: res.status });
        get().updateEngineSettings({
          provider: 'codex',
          selectedModel: res.status.models?.[0]?.id || 'gpt-6.1-sol'
        });
        // @ts-ignore
        window.lamApi?.settingsAPI?.saveSettings?.({ aiProvider: 'codex' });
        get().addToast('ChatGPT Plan (Codex Engine) Connected Successfully', 'success');
        return true;
      } else {
        get().addToast(`Codex Login Failed: ${res?.error || 'Unknown error'}`, 'error');
        return false;
      }
    } catch (e: any) {
      get().addToast(`Codex Login Error: ${e.message}`, 'error');
      return false;
    }
  },
  disconnectCodexAccount: async () => {
    try {
      // @ts-ignore
      await window.lamApi?.codex?.disconnect?.();
      set({ codexAccount: null });
      if (get().engineSettings.provider === 'codex') {
        get().updateEngineSettings({ provider: 'gemini', selectedModel: 'gemini-3.5-flash-lite' });
        // @ts-ignore
        window.lamApi?.settingsAPI?.saveSettings?.({ aiProvider: 'gemini' });
      }
      get().addToast('Codex Engine Disconnected', 'info');
    } catch (e) {
      console.error('Failed to disconnect Codex:', e);
    }
  },
  setClaudeAccount: (account) => set({ claudeAccount: account }),
  syncClaudeStatus: async () => {
    try {
      // @ts-ignore
      const status = await window.lamApi?.claude?.getStatus?.();
      if (status) {
        set({ claudeAccount: status });
        if (status.connected && get().engineSettings.provider === 'claudecode') {
          get().updateEngineSettings({
            provider: 'claudecode',
            selectedModel: get().engineSettings.selectedModel || status.models?.[0]?.id || 'claude-3-7-sonnet'
          });
        }
        return status;
      }
    } catch (e) {
      console.error('Failed to sync Claude Code status:', e);
    }
    return null;
  },
  connectClaudeAccount: async () => {
    try {
      // @ts-ignore
      const res = await window.lamApi?.claude?.login?.();
      if (res?.success && res?.status) {
        set({ claudeAccount: res.status });
        get().updateEngineSettings({
          provider: 'claudecode',
          selectedModel: res.status.models?.[0]?.id || 'claude-3-7-sonnet'
        });
        // @ts-ignore
        window.lamApi?.settingsAPI?.saveSettings?.({ aiProvider: 'claudecode' });
        get().addToast('Claude Code Official Session Connected', 'success');
        return true;
      } else {
        get().addToast(`Claude Login Notice: ${res?.error || 'Auth initiated'}`, 'info');
        return false;
      }
    } catch (e: any) {
      get().addToast(`Claude Code Error: ${e.message}`, 'error');
      return false;
    }
  },
  disconnectClaudeAccount: async () => {
    try {
      // @ts-ignore
      await window.lamApi?.claude?.disconnect?.();
      set({ claudeAccount: null });
      if (get().engineSettings.provider === 'claudecode') {
        get().updateEngineSettings({ provider: 'gemini', selectedModel: 'gemini-3.5-flash-lite' });
        // @ts-ignore
        window.lamApi?.settingsAPI?.saveSettings?.({ aiProvider: 'gemini' });
      }
      get().addToast('Claude Code Session Disconnected', 'info');
    } catch (e) {
      console.error('Failed to disconnect Claude Code:', e);
    }
  },
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
  
  loadSettings: (settings) => {
    const aiApiKey = settings.aiApiKey;
    const provider = settings.aiProvider || 'gemini';
    const effectiveModel = settings.aiModel || 'gemini-3.5-flash-lite';
    const themeMode = (settings.themeMode || settings.theme || (typeof localStorage !== 'undefined' ? localStorage.getItem('lam_theme_mode') : null) || 'dark') as ThemeMode;
    const themeStyle = (settings.themeStyle || (typeof localStorage !== 'undefined' ? localStorage.getItem('lam_theme_style') : null) || 'glassmorphism') as ThemeStyle;
    const accentColor = settings.accentColor || (typeof localStorage !== 'undefined' ? localStorage.getItem('lam_accent_color') : null) || '#3b82f6';

    applyTheme(themeMode, themeStyle, accentColor);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lam_theme_mode', themeMode);
        localStorage.setItem('lam_theme_style', themeStyle);
        localStorage.setItem('lam_accent_color', accentColor);
      }
    } catch {}
    void saveAppearanceSettings(themeMode, themeStyle, accentColor);

    set((state) => ({
      themeMode,
      themeStyle,
      accentColor,
      systemContext: {
        ...state.systemContext,
        workspaces: (settings.workspaces || []).map((w: any) => ({
          ...w,
          folders: Array.isArray(w.folders)
            ? w.folders.map(extractFolderPath).filter(Boolean)
            : []
        })),
        activeWorkspaceId: settings.activeWorkspaceId || null,
      },
      activeSkillIdsForChat: loadActiveSkillIds(settings.activeWorkspaceId || null),
      githubToken: settings.githubToken || null,
      panelOrder: settings.panelOrder || state.panelOrder,
      panelVisible: settings.panelVisible ? { ...state.panelVisible, ...settings.panelVisible } : state.panelVisible,
      panelWidths: settings.panelWidths ? { ...state.panelWidths, ...settings.panelWidths } : state.panelWidths,
      panelHeights: settings.panelHeights ? { ...state.panelHeights, ...settings.panelHeights } : state.panelHeights,
      panelDetached: settings.panelDetached ? { ...state.panelDetached, ...settings.panelDetached } : state.panelDetached,
      terminalDockPosition: settings.terminalDockPosition || state.terminalDockPosition,
      layoutPreset: settings.layoutPreset || state.layoutPreset,
      agentPermissions: settings.agentPermissions
        ? {
            terminal: { ...DEFAULT_AGENT_PERMISSIONS.terminal, ...(settings.agentPermissions.terminal || {}) },
            browser: { ...DEFAULT_AGENT_PERMISSIONS.browser, ...(settings.agentPermissions.browser || {}) },
            sandbox: { ...DEFAULT_AGENT_PERMISSIONS.sandbox, ...(settings.agentPermissions.sandbox || {}) },
          }
        : get().agentPermissions,
      engineSettings: {
        ...state.engineSettings,
        customApiKey: aiApiKey || state.engineSettings.customApiKey,
        provider: provider || state.engineSettings.provider,
        selectedModel: effectiveModel,
        baseUrl: settings.aiBaseUrl || state.engineSettings.baseUrl,
      }
    }));
    if (aiApiKey) {
      get().fetchLiveModels(provider, aiApiKey);
    }
    void get().syncGoogleStatus();
    void get().syncCodexStatus();
    void get().syncClaudeStatus();
    const activeWs = (settings.workspaces || []).find((w: any) => w.id === settings.activeWorkspaceId) || settings.workspaces?.[0];
    // @ts-ignore
    window.lamApi?.storage?.loadMemories?.(activeWs?.folders?.[0]).then((res: any) => {
      if (res && (res.global?.length > 0 || res.workspace?.length > 0)) {
        const merged = [...(res.workspace || []), ...(res.global || [])];
        if (merged.length > 0) set({ projectMemories: merged });
      }
    }).catch(console.error);
  },

  setActiveWorkspace: (workspaceId) => set((state) => {
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings({ activeWorkspaceId: workspaceId });
    return {
      systemContext: {
        ...state.systemContext,
        activeWorkspaceId: workspaceId
      },
      activeSkillIdsForChat: loadActiveSkillIds(workspaceId)
    };
  }),

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
    const rawPath = extractFolderPath(folderPath);
    if (!rawPath) return state;
    const workspaces = state.systemContext.workspaces.map(ws => {
      if (ws.id === workspaceId) {
        const cleanFolders = (ws.folders || []).map(extractFolderPath).filter(Boolean);
        return { ...ws, folders: [...new Set([...cleanFolders, rawPath])] };
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
