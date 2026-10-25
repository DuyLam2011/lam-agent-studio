import React, { useRef } from 'react';
import { Play, Bot, Wrench, GitFork, Bell, Loader2, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { AutomationNode, AutomationCategory } from '../../types/automation';
import { CATEGORY_COLORS } from './automationConstants';
import clsx from 'clsx';

interface NodeCardProps {
  node: AutomationNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDragNode: (id: string, dx: number, dy: number) => void;
  onStartConnect: (nodeId: string, startX: number, startY: number) => void;
  onEndConnect: (nodeId: string) => void;
}

const CATEGORY_ICONS: Record<AutomationCategory, React.ReactNode> = {
  trigger: <Play size={13} className="text-emerald-400" />,
  agent: <Bot size={13} className="text-purple-400" />,
  tool: <Wrench size={13} className="text-cyan-400" />,
  condition: <GitFork size={13} className="text-amber-400" />,
  output: <Bell size={13} className="text-rose-400" />
};

export const AutomationNodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  onSelect,
  onDelete,
  onDragNode,
  onStartConnect,
  onEndConnect
}) => {
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);
  const colorTheme = CATEGORY_COLORS[node.category];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    dragRef.current = { startX: e.clientX, startY: e.clientY };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      dragRef.current = { startX: moveEvent.clientX, startY: moveEvent.clientY };
      onDragNode(node.id, dx, dy);
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{ transform: `translate3d(${node.position.x}px, ${node.position.y}px, 0)` }}
      className={clsx(
        "absolute w-[220px] rounded-2xl select-none z-20 cursor-grab active:cursor-grabbing transition-shadow",
        "surface-panel border shadow-2xl backdrop-blur-xl overflow-hidden group",
        isSelected ? "border-primary ring-2 ring-primary/40 shadow-primary/20" : colorTheme.border
      )}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onMouseDown={handleMouseDown}
    >
      {/* Input Port (Left) */}
      {node.category !== 'trigger' && (
        <div
          onClick={(e) => { e.stopPropagation(); onEndConnect(node.id); }}
          className="absolute -left-2.5 top-[38px] w-5 h-5 rounded-full bg-neutral-900 border-2 border-cyan-400 hover:scale-125 transition-transform flex items-center justify-center cursor-crosshair z-30 shadow-md"
          title="Connect Input Here"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </div>
      )}

      {/* Output Port (Right) */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartConnect(node.id, node.position.x + 220, node.position.y + 44);
        }}
        className="absolute -right-2.5 top-[38px] w-5 h-5 rounded-full bg-neutral-900 border-2 border-primary hover:scale-125 transition-transform flex items-center justify-center cursor-crosshair z-30 shadow-md"
        title="Drag wire to connect output"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      </div>

      {/* Node Header */}
      <div className={clsx("px-3 py-1.5 border-b border-white/5 flex items-center justify-between", colorTheme.header)}>
        <div className="flex items-center gap-2 min-w-0">
          {CATEGORY_ICONS[node.category]}
          <span className="text-[10px] uppercase font-bold tracking-wider text-app-text truncate">{node.category}</span>
        </div>
        <div className="flex items-center gap-1">
          {node.status === 'running' && <Loader2 size={12} className="text-cyan-400 animate-spin" />}
          {node.status === 'success' && <CheckCircle2 size={12} className="text-emerald-400" />}
          {node.status === 'failed' && <AlertTriangle size={12} className="text-rose-400" />}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-rose-400 transition-opacity"
            title="Delete node"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Node Body */}
      <div className="p-2.5 space-y-1">
        <h4 className="text-xs font-semibold text-app-text truncate">{node.name}</h4>
        <p className="text-[10px] text-app-muted truncate">{node.sublabel}</p>
      </div>
    </div>
  );
};
