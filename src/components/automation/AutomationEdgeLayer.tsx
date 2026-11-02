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
    const dx = Math.max(50, Math.abs(x2 - x1) * 0.5);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
      <defs>
        <marker
          id="wire-arrow"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
        </marker>
        <marker
          id="wire-arrow-running"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
        </marker>
      </defs>

      {/* Render Established Edges */}
      {edges.map((edge) => {
        const source = nodeMap.get(edge.sourceNodeId);
        const target = nodeMap.get(edge.targetNodeId);
        if (!source || !target) return null;

        // Ports: output port right (+220, y+48), input port left (0, y+48)
        const x1 = source.position.x + 220;
        const y1 = source.position.y + 48;
        const x2 = target.position.x;
        const y2 = target.position.y + 48;

        const isRunning = source.status === 'running' || target.status === 'running';
        const isSuccess = source.status === 'success' && target.status === 'success';
        const strokeColor = isRunning ? '#34d399' : (isSuccess ? '#10b981' : '#38bdf8');

        return (
          <g key={edge.id} className="pointer-events-auto group cursor-pointer" onClick={() => onDeleteEdge(edge.id)}>
            {/* Background wider hit target */}
            <path
              d={renderBezier(x1, y1, x2, y2)}
              fill="none"
              stroke="transparent"
              strokeWidth="16"
            />
            {/* Ambient subtle glow under-layer */}
            <path
              d={renderBezier(x1, y1, x2, y2)}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isRunning ? '5' : '4'}
              strokeOpacity="0.25"
              className={isRunning ? 'animate-pulse' : undefined}
            />
            {/* Main visible line with directional arrow */}
            <path
              d={renderBezier(x1, y1, x2, y2)}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isRunning ? '2.5' : '2'}
              strokeDasharray={isRunning ? '6 4' : undefined}
              markerEnd={isRunning ? 'url(#wire-arrow-running)' : 'url(#wire-arrow)'}
              className={isRunning ? 'animate-pulse' : 'group-hover:stroke-rose-400 group-hover:stroke-[2.5px] transition-colors'}
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
          markerEnd="url(#wire-arrow)"
        />
      )}
    </svg>
  );
};
