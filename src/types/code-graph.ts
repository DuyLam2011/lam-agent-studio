import { ProjectMemoryItem } from './memory';

export type GraphNodeType = 'file' | 'function' | 'class' | 'interface' | 'endpoint' | 'memory' | 'module';
export type GraphEdgeType = 'imports' | 'calls' | 'defines' | 'extends' | 'implements' | 'targets_symbol' | 'targets_file' | 'supersedes' | 'caused_by';

export interface CodeGraphNode {
  id: string;
  name: string;
  type: GraphNodeType;
  filePath?: string;
  line?: number;
  description?: string;
  centralityScore?: number;
  metadata?: Record<string, any>;
}

export interface CodeGraphEdge {
  source: string;
  target: string;
  type: GraphEdgeType;
  weight?: number;
  context?: string;
}

export interface CodeGraphStats {
  totalFiles: number;
  totalSymbols: number;
  totalMemories: number;
  totalEdges: number;
  indexedAt: number;
}

export interface CodeGraphData {
  nodes: Record<string, CodeGraphNode>;
  edges: CodeGraphEdge[];
  stats: CodeGraphStats;
}

export interface GraphQueryResult {
  query: string;
  matchedNodes: CodeGraphNode[];
  subgraphNodes: CodeGraphNode[];
  subgraphEdges: CodeGraphEdge[];
  linkedMemories: ProjectMemoryItem[];
  retrievalContext: string;
  tokensSaved: {
    rawTokensEstimate: number;
    graphTokensEstimate: number;
    savedPercentage: number;
  };
}
