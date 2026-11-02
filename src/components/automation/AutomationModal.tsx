import React, { useState } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import { AutomationToolbar } from './AutomationToolbar';
import { AutomationCanvas } from './AutomationCanvas';
import { NodeConfigInspector } from './NodeConfigInspector';
import { PRESET_PIPELINES } from './automationConstants';
import { AutomationNode, AutomationCategory, AutomationPipeline } from '../../types/automation';
import { executePipelineGraph } from './automationExecutor';

export const AutomationModal: React.FC = () => {
  const { isAutomationModalOpen, setAutomationModalOpen, addToast } = useAgentStore();
  const [pipeline, setPipeline] = useState<AutomationPipeline>(PRESET_PIPELINES[0]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (!isAutomationModalOpen) return null;

  const selectedNode = pipeline.nodes.find(n => n.id === selectedNodeId) || null;

  const handleUpdateNodes = (newNodes: AutomationNode[]) => {
    setPipeline(prev => ({ ...prev, nodes: newNodes }));
  };

  const handleAddNode = (category: AutomationCategory, name: string, sublabel: string, config: any) => {
    const newNode: AutomationNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      category,
      name,
      sublabel,
      position: { x: 250 + Math.random() * 80, y: 180 + Math.random() * 80 },
      config,
      status: 'idle'
    };
    setPipeline(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setSelectedNodeId(newNode.id);
    addToast(`Added ${name} node`, 'info');
  };

  const handleDeleteNode = (id: string) => {
    setPipeline(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== id),
      edges: prev.edges.filter(e => e.sourceNodeId !== id && e.targetNodeId !== id)
    }));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const handleRunPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);
    await executePipelineGraph(pipeline.nodes, pipeline.edges, {
      onUpdateNode: (nodeId, status, result) => {
        setPipeline(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, status, lastResult: result } : n)
        }));
      },
      addToast
    });
    setIsRunning(false);
  };

  return (
    <div className="fixed top-10 inset-x-0 bottom-0 z-40 flex flex-col bg-neutral-950/95 backdrop-blur-2xl animate-in fade-in duration-150 overflow-hidden border-t border-border shadow-2xl">
      {/* Top Controls Toolbar */}
      <AutomationToolbar
        pipeline={pipeline}
        isRunning={isRunning}
        onRunPipeline={handleRunPipeline}
        onAddNode={handleAddNode}
        onSelectTemplate={(tpl) => { setPipeline(tpl); setSelectedNodeId(null); addToast(`Loaded template: ${tpl.name}`, 'info'); }}
        onClear={() => { setPipeline(prev => ({ ...prev, nodes: [], edges: [] })); setSelectedNodeId(null); }}
        onClose={() => setAutomationModalOpen(false)}
      />

      {/* Main Studio Work Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <AutomationCanvas
          nodes={pipeline.nodes}
          edges={pipeline.edges}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onUpdateNodes={handleUpdateNodes}
          onUpdateEdges={(edges) => setPipeline(prev => ({ ...prev, edges }))}
          onDeleteNode={handleDeleteNode}
        />

        {/* Selected Node Parameter Config Inspector Drawer */}
        {selectedNode && (
          <NodeConfigInspector
            node={selectedNode}
            onUpdateConfig={(id, patch) => {
              setPipeline(prev => ({
                ...prev,
                nodes: prev.nodes.map(n => n.id === id ? { ...n, ...patch } : n)
              }));
            }}
            onDeleteNode={handleDeleteNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
};
