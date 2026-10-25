import React, { useState, useRef } from 'react';
import { AutomationNode, AutomationEdge } from '../../types/automation';
import { AutomationEdgeLayer } from './AutomationEdgeLayer';
import { AutomationNodeCard } from './AutomationNodeCard';

interface CanvasProps {
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodes: (nodes: AutomationNode[]) => void;
  onUpdateEdges: (edges: AutomationEdge[]) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const AutomationCanvas: React.FC<CanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onUpdateNodes,
  onUpdateEdges,
  onDeleteNode
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [connecting, setConnecting] = useState<{ sourceNodeId: string; startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const handleDragNode = (id: string, dx: number, dy: number) => {
    onUpdateNodes(nodes.map(n => n.id === id ? { ...n, position: { x: Math.max(10, n.position.x + dx), y: Math.max(10, n.position.y + dy) } } : n));
  };

  const handleStartConnect = (sourceNodeId: string, startX: number, startY: number) => {
    setConnecting({ sourceNodeId, startX, startY, currentX: startX, currentY: startY });
  };

  const handleEndConnect = (targetNodeId: string) => {
    if (!connecting || connecting.sourceNodeId === targetNodeId) {
      setConnecting(null);
      return;
    }
    // Check if edge already exists
    const exists = edges.some(e => e.sourceNodeId === connecting.sourceNodeId && e.targetNodeId === targetNodeId);
    if (!exists) {
      const newEdge: AutomationEdge = {
        id: `e-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        sourceNodeId: connecting.sourceNodeId,
        targetNodeId
      };
      onUpdateEdges([...edges, newEdge]);
    }
    setConnecting(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!connecting || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setConnecting({ ...connecting, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top });
  };

  const handleMouseUp = () => {
    if (connecting) setConnecting(null);
  };

  const handleDeleteEdge = (edgeId: string) => {
    onUpdateEdges(edges.filter(e => e.id !== edgeId));
  };

  return (
    <div
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => onSelectNode(null)}
      className="flex-1 relative overflow-hidden bg-neutral-950 select-none cursor-default"
      style={{
        backgroundSize: '24px 24px',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1.2px, transparent 1.2px)'
      }}
    >
      {/* SVG Connecting Edges Layer */}
      <AutomationEdgeLayer
        nodes={nodes}
        edges={edges}
        connectingLine={connecting}
        onDeleteEdge={handleDeleteEdge}
      />

      {/* Render Node Cards */}
      {nodes.map((node) => (
        <AutomationNodeCard
          key={node.id}
          node={node}
          isSelected={node.id === selectedNodeId}
          onSelect={() => onSelectNode(node.id)}
          onDelete={() => onDeleteNode(node.id)}
          onDragNode={handleDragNode}
          onStartConnect={handleStartConnect}
          onEndConnect={handleEndConnect}
        />
      ))}
    </div>
  );
};
