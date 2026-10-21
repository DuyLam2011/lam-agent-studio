export type PanelId = 'explorer' | 'editor' | 'agent' | 'agents-center' | 'terminal';

export type TerminalAgentMode = 'autopilot' | 'suggest' | 'monitor';

export type LayoutPreset = 'vscode-dock' | 'columns-3' | 'focus-code';

export interface TerminalAgentConfig {
  assignedAgentId: string;
  agentName: string;
  agentMode: TerminalAgentMode;
  status: 'idle' | 'monitoring' | 'executing' | 'error_detected';
  lastDetectedError?: {
    text: string;
    code?: number;
    suggestion?: string;
  };
  autoRunCommands: boolean;
}

export interface PanelState {
  order: PanelId[];
  visible: Record<PanelId, boolean>;
  widths: Record<PanelId, number>;
  heights: Record<PanelId, number>;
  detached: Record<PanelId, boolean>;
  layoutPreset: LayoutPreset;
}
