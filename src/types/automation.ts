export type AutomationCategory = 'trigger' | 'agent' | 'tool' | 'condition' | 'output';

export interface AutomationNode {
  id: string;
  category: AutomationCategory;
  name: string;
  sublabel: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'failed';
  lastResult?: any;
}

export interface AutomationEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  animated?: boolean;
}

export interface AutomationPipeline {
  id: string;
  name: string;
  description: string;
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  updatedAt: number;
}
