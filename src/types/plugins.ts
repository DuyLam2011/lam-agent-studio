export type PluginType = 'mcp' | 'tool_plugin' | 'lsp';

export interface McpServerPlugin {
  id: string;
  name: string;
  description: string;
  type: PluginType;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  toolsExposed: string[];
  status: 'connected' | 'disconnected' | 'error';
  scope: 'global' | 'workspace' | 'repo';
  targetId?: string;
  active: boolean;
  disabledIn?: string[];
  updatedAt?: number;
}
