import type { AgentRunStatus, AgentStreamEvent } from '../../src/types/agent-stream';

export type SecurityMode = 'turbo' | 'guarded' | 'restricted';
export type ProviderId = 'gemini' | 'openai' | 'ollama' | 'offline' | 'antigravity' | 'codex' | 'claudecode';
export type ReasoningEffort = 'off' | 'low' | 'medium' | 'high';

export interface ToolCallResult {
  id: string;
  name: string;
  args: any;
  status: 'running' | 'success' | 'failed';
  result?: any;
  executionTimeMs?: number;
  autoApproved?: boolean;
  label?: string;
  turn?: number;
}

export interface DiffSnapshot {
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

export interface AgentResponse {
  text: string;
  thinking?: string;
  toolCalls?: ToolCallResult[];
  diffSnapshots?: DiffSnapshot[];
  status?: AgentRunStatus;
  model?: string;
  durationMs?: number;
  runId?: string;
}

export interface HistoryEntry {
  role: string;
  text: string;
  toolSummary?: string;
}

export interface ContextAttachmentInput {
  id?: string;
  name: string;
  path?: string;
  type: string;
  lineRange?: { startLine: number; endLine: number };
  snippet?: string;
}

export interface ActiveRepoScopeInfo {
  name: string;
  root: string;
  tag: string;
  isMultiRepo?: boolean;
  availableRepos?: Array<{ name: string; root: string; tag: string }>;
}

export interface AgentAdvisoryData {
  appliedSkillName: string;
  appliedSkillReason: string;
  recommendedSkills?: Array<{ name: string; reason: string }>;
  activeTools?: string[];
  recommendedComboName: string;
  recommendedComboReason: string;
  advisoryMarkdown?: string;
}

export interface AgentPromptOptions {
  model?: string;
  mode?: string;
  persona?: string;
  communicationTone?: 'caveman' | 'executive' | 'collaborative' | 'academic';
  explanationVerbosity?: 'terse' | 'concise' | 'detailed' | 'exhaustive';
  autonomyLevel?: string;
  securityMode?: SecurityMode;
  apiKey?: string;
  provider?: ProviderId;
  baseUrl?: string;
  activeFilePath?: string;
  workspacePath?: string;
  activeRepo?: ActiveRepoScopeInfo;
  advisory?: AgentAdvisoryData;
  rules?: Array<{ name: string; scope: string; content: string; filePath?: string }>;
  skills?: Array<{ name: string; folderName?: string; scope: string; description: string; content: string }>;
  workflows?: Array<{ name: string; description: string; steps: any[] }>;
  plugins?: Array<{ name: string; description: string; toolsExposed: string[] }>;
  subagents?: Array<{ name: string; role: string; systemPrompt: string }>;
  memories?: Array<{ title: string; category: string; content: string }>;
  contextAttachments?: ContextAttachmentInput[];
  history?: HistoryEntry[];
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  reasoningEffort?: ReasoningEffort;
  maxTurns?: number;
  runId?: string;
  signal?: AbortSignal;
  onEvent?: (event: AgentStreamEvent) => void;
}

export interface ToolExecutionOutcome { status: 'success' | 'failed'; result: any; executionTimeMs: number; }
export interface ModelToolCall { id: string; name: string; args: Record<string, any>; argsError?: string; }
export interface ModelToolResult { id: string; name: string; output: string; failed: boolean; }
export interface ModelTurnResult { text: string; thinking: string; toolCalls: ModelToolCall[]; finishReason?: string; }
export interface ModelStreamHandlers { onText: (delta: string) => void; onThinking: (delta: string) => void; }

export interface ModelSession {
  readonly model: string;
  readonly provider: ProviderId;
  streamTurn(handlers: ModelStreamHandlers, signal: AbortSignal, opts: { allowTools: boolean }): Promise<ModelTurnResult>;
  appendToolResults(results: ModelToolResult[]): void;
  appendUserText(text: string): void;
}

export class AgentCancelledError extends Error {
  constructor() {
    super('Agent run cancelled by user');
    this.name = 'AgentCancelledError';
  }
}
