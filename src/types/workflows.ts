export type WorkflowTrigger = 'manual' | 'on_prompt' | 'on_save' | 'before_commit';

export interface WorkflowStep {
  id: string;
  name: string;
  role: string;
  instructions: string;
  autoApprove?: boolean;
}

export interface AgentWorkflowItem {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  scope: 'global' | 'workspace' | 'repo';
  targetId?: string;
  active: boolean;
  disabledIn?: string[];
  updatedAt?: number;
}
