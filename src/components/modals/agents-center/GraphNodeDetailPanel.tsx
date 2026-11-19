import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { CodeGraphNode, GraphQueryResult } from '../../../types/code-graph';

interface GraphNodeDetailPanelProps {
  selectedNode: CodeGraphNode | null;
  queryResult: GraphQueryResult | null;
}

export const GraphNodeDetailPanel: React.FC<GraphNodeDetailPanelProps> = ({
  selectedNode,
  queryResult
}) => {
  if (!selectedNode) {
    return (
      <div className="flex-1 surface-card rounded-xl border border-subtle p-3 flex items-center justify-center text-muted">
        Select a symbol to inspect its graph relationships
      </div>
    );
  }

  return (
    <div className="flex-1 surface-card rounded-xl border border-subtle p-3 flex flex-col overflow-y-auto custom-scrollbar gap-3">
      <div className="flex items-center justify-between border-b border-subtle pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase font-bold">
              {selectedNode.type}
            </span>
            <h4 className="text-sm font-bold font-mono text-app-text">{selectedNode.name}</h4>
          </div>
          {selectedNode.filePath && (
            <div className="text-[10.5px] text-muted font-mono mt-0.5">{selectedNode.filePath}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[11px] font-bold text-primary">
            In-Degree Centrality: {selectedNode.centralityScore || 0}
          </div>
          <div className="text-[9.5px] text-emerald-400 flex items-center gap-1 justify-end">
            <CheckCircle2 size={10} /> Indexed in AST
          </div>
        </div>
      </div>

      {queryResult?.retrievalContext && (
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-muted uppercase">
            HippoRAG Multi-Hop Graph Context:
          </div>
          <pre className="p-2.5 rounded-lg bg-black/60 border border-subtle font-mono text-[10.5px] text-app-text whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
            {queryResult.retrievalContext}
          </pre>
        </div>
      )}
    </div>
  );
};
