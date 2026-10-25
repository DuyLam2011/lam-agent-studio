import React from 'react';
import { AutomationNode, AutomationEdge } from '../../types/automation';

interface EdgeLayerProps {
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  connectingLine: { startX: number; startY: number; currentX: number; currentY: number } | null;
  onDeleteEdge: (edgeId: string) => void;
}

export const AutomationEdgeLayer: React.FC<EdgeLayerProps> = ({
  nodes,
  edges,
  connectingLine,
  onDeleteEdge
}) => {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const renderBezier = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.max(40, Math.abs(x2 - x1) * 0.5);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
      <defs>
        <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Render Established Edges */}
      {edges.map((edge) => {
        const source = nodeMap.get(edge.sourceNodeId);
        const target = nodeMap.get(edge.targetNodeId);
        if (!source || !target) return null;

        // Ports: output port is at right (+220), input port is at left (0)
        const x1 = source.position.x + 220;
        const y1 = source.position.y + 44;
        const x2 = target.position.x;
        const y2 = target.position.y + 44;

        const isRunning = source.status === 'running' || target.status === 'running';
        const isSuccess = source.status === 'success' && target.status === 'success';

        return (
          <g key={edge.id} className="pointer-events-auto group cursor-pointer" onClick={() => onDeleteEdge(edge.id)}>
            {/* Background wider hit target */}
            <path
              d={renderBezier(x1, y1, x2, y2)}
              fill="none"
              stroke="transparent"
              strokeWidth="14"
            />
            {/* Main visible curve */}
            <path
              d={renderBezier(x1, y1, x2, y2)}
              fill="none"
              stroke={isRunning ? '#22d3ee' : (isSuccess ? '#10b981' : 'url(#edge-grad)')}
              strokeWidth={isRunning ? '3' : '2'}
              strokeDasharray={isRunning ? '6 4' : undefined}
              className={isRunning ? 'animate-pulse' : 'group-hover:stroke-rose-400 group-hover:stroke-[3px] transition-colors'}
              filter={isRunning ? 'url(#glow)' : undefined}
            />
            {/* Midpoint Delete Dot Indicator on Hover */}
            <circle
              cx={(x1 + x2) / 2}
              cy={(y1 + y2) / 2}
              r="7"
              className="fill-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </g>
        );
      })}

      {/* Active User Drag Wire Connection */}
      {connectingLine && (
        <path
          d={renderBezier(connectingLine.startX, connectingLine.startY, connectingLine.currentX, connectingLine.currentY)}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeDasharray="4 4"
        />
      )}
    </svg>
  );
};
