import React, { useState, useRef } from 'react';
import { Focus, Move } from 'lucide-react';
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
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number } | null>(null);
  const [connecting, setConnecting] = useState<{ sourceNodeId: string; startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const handleDragNode = (id: string, dx: number, dy: number) => {
    onUpdateNodes(nodes.map(n => n.id === id ? { ...n, position: { x: Math.max(-500, n.position.x + dx), y: Math.max(-500, n.position.y + dy) } } : n));
  };

  const handleStartConnect = (sourceNodeId: string, startX: number, startY: number) => {
    setConnecting({ sourceNodeId, startX, startY, currentX: startX, currentY: startY });
  };

  const handleEndConnect = (targetNodeId: string) => {
    if (!connecting || connecting.sourceNodeId === targetNodeId) {
      setConnecting(null);
      return;
    }
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

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current && (e.target as HTMLElement).tagName !== 'svg') return;
    onSelectNode(null);
    setIsPanning(true);
    panStartRef.current = { startX: e.clientX, startY: e.clientY, initialPanX: pan.x, initialPanY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
      setPan({ x: panStartRef.current.initialPanX + dx, y: panStartRef.current.initialPanY + dy });
      return;
    }
    if (!connecting || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setConnecting({
      ...connecting,
      currentX: e.clientX - rect.left - pan.x,
      currentY: e.clientY - rect.top - pan.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    panStartRef.current = null;
    if (connecting) setConnecting(null);
  };

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`flex-1 relative overflow-hidden bg-neutral-950 select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        backgroundSize: '24px 24px',
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1.2px, transparent 1.2px)'
      }}
    >
      {/* Transformed Canvas Container */}
      <div style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0)` }} className="w-full h-full absolute inset-0 pointer-events-none">
        <AutomationEdgeLayer
          nodes={nodes}
          edges={edges}
          connectingLine={connecting}
          onDeleteEdge={(edgeId) => onUpdateEdges(edges.filter(e => e.id !== edgeId))}
        />

        <div className="pointer-events-auto">
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
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setPan({ x: 0, y: 0 })}
          className="px-2.5 py-1.5 rounded-xl surface-card hover:bg-white/10 text-app-muted hover:text-app-text text-xs font-mono flex items-center gap-1.5 border border-border shadow-lg transition-colors"
          title="Recenter view (0, 0)"
        >
          <Focus size={13} className="text-cyan-400" />
          <span>Recenter</span>
        </button>
        <div className="px-2.5 py-1.5 rounded-xl surface-card text-[10px] text-app-muted border border-border flex items-center gap-1 shadow-lg">
          <Move size={11} className="text-gray-500" />
          <span>Pan: {Math.round(pan.x)}, {Math.round(pan.y)}</span>
        </div>
      </div>
    </div>
  );
};
