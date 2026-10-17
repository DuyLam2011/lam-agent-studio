export interface SubagentPersona {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  reasoningEffort: 'off' | 'low' | 'medium' | 'high';
  allowedSkills: string[];
  scope: 'global' | 'workspace' | 'repo';
  targetId?: string;
  active: boolean;
  isBuiltin?: boolean;
  icon?: string;
  disabledIn?: string[];
  updatedAt?: number;
}
