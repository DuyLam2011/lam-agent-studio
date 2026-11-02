import React from 'react';
import { ChevronLeft, ChevronRight, GripVertical, Folder, Code2, Bot, Terminal, ExternalLink, X, PanelBottom, Globe, Minus } from 'lucide-react';
import { useAgentStore, PanelId } from '../../store/useAgentStore';
import clsx from 'clsx';

interface DynamicPanelHeaderProps {
  panelId: PanelId;
  children?: React.ReactNode;
  onToggleCollapse?: () => void;
}

const PANEL_META: Record<PanelId, { title: string; icon: React.ReactNode }> = {
  explorer: { title: 'Explorer', icon: <Folder size={12} className="text-primary" /> },
  editor: { title: 'Editor', icon: <Code2 size={12} className="text-primary" /> },
  agent: { title: 'AI Studio', icon: <Bot size={12} className="text-primary" /> },
  'agents-center': { title: 'Agents Center', icon: <Bot size={12} className="text-primary" /> },
  terminal: { title: 'Terminal', icon: <Terminal size={12} className="text-primary" /> },
  browser: { title: 'Browser Preview', icon: <Globe size={12} className="text-primary" /> }
};

export const DynamicPanelHeader: React.FC<DynamicPanelHeaderProps> = ({ panelId, children, onToggleCollapse }) => {
  const {
    panelOrder, movePanel, setPanelOrder, detachPanel, togglePanelVisible,
    terminalDockPosition, setTerminalDockPosition, togglePanelCollapse
  } = useAgentStore();

  const currentIndex = panelOrder.indexOf(panelId);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === panelOrder.length - 1;
  const isDetached = typeof window !== 'undefined' &&
    (window.location.search.includes('detached=true') || window.location.hash.includes('detached=true'));

  const handleClose = () => {
    if (isDetached) {
      // @ts-ignore
      window.lamApi?.panel?.close?.(panelId);
      // @ts-ignore
      window.lamApi?.closeWindow?.();
    } else {
      togglePanelVisible(panelId);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', panelId);
    e.dataTransfer.effectAllowed = 'move';
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

  const { title, icon } = PANEL_META[panelId] || { title: panelId, icon: null };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={handleDrop}
      className="flex items-center justify-between px-2.5 py-1.5 surface-header select-none shrink-0 group/panel-header cursor-grab active:cursor-grabbing gap-1"
      title="Drag to reorder panel or use controls"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <GripVertical size={11} className="text-app-muted opacity-40 group-hover/panel-header:opacity-100 transition-opacity shrink-0" />
        <span className="shrink-0">{icon}</span>
        <span className="text-[11px] font-semibold tracking-wide text-app-text uppercase truncate">{title}</span>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        {children}

        {/* Move Left / Right Controls (hidden on narrow widths for responsive space) */}
        <div className="hidden sm:flex items-center gap-0.5 ml-0.5 bg-black/20 rounded p-0.5 border border-border">
          <button
            onClick={() => movePanel(panelId, 'left')}
            disabled={isFirst}
            className={clsx("p-0.5 rounded text-app-muted transition-colors", isFirst ? "opacity-20 cursor-not-allowed" : "hover:text-app-text hover:bg-white/10")}
            title="Move Panel Left"
          >
            <ChevronLeft size={11} />
          </button>
          <button
            onClick={() => movePanel(panelId, 'right')}
            disabled={isLast}
            className={clsx("p-0.5 rounded text-app-muted transition-colors", isLast ? "opacity-20 cursor-not-allowed" : "hover:text-app-text hover:bg-white/10")}
            title="Move Panel Right"
          >
            <ChevronRight size={11} />
          </button>
        </div>

        {/* Quick Fold / Collapse button */}
        {panelId !== 'editor' && (
          <button
            onClick={() => onToggleCollapse ? onToggleCollapse() : togglePanelCollapse(panelId)}
            className="p-1 rounded text-app-muted hover:text-primary hover:bg-white/10 transition-colors"
            title="Fold panel into compact rail"
          >
            <Minus size={11} />
          </button>
        )}

        {/* Terminal Dock Position Toggle */}
        {panelId === 'terminal' && (
          <button
            onClick={() => setTerminalDockPosition(terminalDockPosition === 'bottom' ? 'column' : 'bottom')}
            className={clsx("p-1 rounded text-xs transition-colors", terminalDockPosition === 'bottom' ? "text-primary bg-primary/10" : "text-app-muted hover:text-app-text hover:bg-white/10")}
            title={terminalDockPosition === 'bottom' ? "Dock to Side Column" : "Dock to Bottom Drawer (VS Code)"}
          >
            <PanelBottom size={11} />
          </button>
        )}

        {/* Detach Button (only in main window) */}
        {!isDetached && (
          <button
            onClick={() => detachPanel(panelId)}
            className="p-1 rounded text-app-muted hover:text-app-text hover:bg-white/10 transition-colors"
            title="Pop out into separate window"
          >
            <ExternalLink size={11} />
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="p-1 rounded text-app-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title={isDetached ? "Close detached window" : "Hide Panel"}
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
};
