export type AgentActivityStatus = 
  | 'idle' 
  | 'analyzing_terminal' 
  | 'reviewing_git' 
  | 'thinking' 
  | 'executing' 
  | 'completed' 
  | 'error';

export interface AgentThinkingEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'reasoning' | 'action' | 'finding' | 'error';
}

export interface AgentFindingItem {
  id: string;
  category: 'summary' | 'security' | 'performance' | 'quality' | 'bug';
  title: string;
  description: string;
  severity?: 'info' | 'low' | 'medium' | 'high';
  suggestion?: string;
  diffSnippet?: string;
}

export interface AgentActivityTask {
  id: string;
  type: 'git_review' | 'terminal_monitor' | 'code_analysis' | 'general';
  agentId: string;
  agentName: string;
  agentRole: string;
  title: string;
  status: AgentActivityStatus;
  startTime: number;
  endTime?: number;
  targetRepo?: string;
  targetFile?: string;
  thinkingStream: AgentThinkingEntry[];
  findings: AgentFindingItem[];
  summary: string;
  rawOutput?: string;
  terminalBuffer?: string;
}
