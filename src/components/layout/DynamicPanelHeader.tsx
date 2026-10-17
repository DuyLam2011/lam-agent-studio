import React from 'react';
import { ChevronLeft, ChevronRight, GripVertical, Folder, Code2, Zap, Bot, Terminal, ExternalLink, X } from 'lucide-react';
import { useAgentStore, PanelId } from '../../store/useAgentStore';
import clsx from 'clsx';

interface DynamicPanelHeaderProps {
  panelId: PanelId;
  children?: React.ReactNode;
}

export const DynamicPanelHeader: React.FC<DynamicPanelHeaderProps> = ({ panelId, children }) => {
  const { panelOrder, movePanel, setPanelOrder, detachPanel, togglePanelVisible } = useAgentStore();
  const currentIndex = panelOrder.indexOf(panelId);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === panelOrder.length - 1;

  const getPanelInfo = () => {
    switch (panelId) {
      case 'explorer':
        return { title: 'Explorer', icon: <Folder size={13} className="text-blue-400" /> };
      case 'editor':
        return { title: 'Editor', icon: <Code2 size={13} className="text-emerald-400" /> };
      case 'agent':
        return { title: 'AI Studio', icon: <Zap size={13} className="text-amber-400" /> };
      case 'agents-center':
        return { title: 'Agents Center', icon: <Bot size={13} className="text-purple-400" /> };
      case 'terminal':
        return { title: 'Terminal', icon: <Terminal size={13} className="text-emerald-400" /> };
    }
  };

  const { title, icon } = getPanelInfo();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', panelId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') as PanelId;
    if (sourceId && sourceId !== panelId) {
      const newOrder = [...panelOrder];
      const fromIdx = newOrder.indexOf(sourceId);
      const toIdx = newOrder.indexOf(panelId);
      if (fromIdx !== -1 && toIdx !== -1) {
        newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, sourceId);
        setPanelOrder(newOrder);
      }
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-white/5 select-none shrink-0 group/panel-header cursor-grab active:cursor-grabbing"
      title="Drag to reorder panel or use arrows"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <GripVertical size={11} className="text-gray-500 opacity-40 group-hover/panel-header:opacity-100 transition-opacity" />
        {icon}
        <span className="text-[11px] font-semibold tracking-wide text-gray-300 uppercase truncate">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {children}

        {/* Move Left / Right Controls */}
        <div className="flex items-center gap-0.5 ml-1 bg-white/5 rounded-md p-0.5 border border-white/5">
          <button
            onClick={() => movePanel(panelId, 'left')}
            disabled={isFirst}
            className={clsx(
              "p-0.5 rounded text-gray-400 transition-colors",
              isFirst ? "opacity-20 cursor-not-allowed" : "hover:text-white hover:bg-white/10"
            )}
            title="Move Panel Left"
          >
            <ChevronLeft size={12} />
          </button>
          <button
            onClick={() => movePanel(panelId, 'right')}
            disabled={isLast}
            className={clsx(
              "p-0.5 rounded text-gray-400 transition-colors",
              isLast ? "opacity-20 cursor-not-allowed" : "hover:text-white hover:bg-white/10"
            )}
            title="Move Panel Right"
          >
            <ChevronRight size={12} />
          </button>
        </div>

        {/* Detach / Pop-out Button */}
        <button
          onClick={() => detachPanel(panelId)}
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Pop out into separate window"
        >
          <ExternalLink size={11} />
        </button>

        {/* Close / Hide Button */}
        <button
          onClick={() => togglePanelVisible(panelId)}
          className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Hide Panel"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};
