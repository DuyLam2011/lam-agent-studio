import React from 'react';
import { PanelId } from '../../types/panel';
import { Folder, Code2, Bot, Terminal, Globe, Columns, Maximize2 } from 'lucide-react';
import clsx from 'clsx';

interface CompactPanelTabBarProps {
  activePanels: PanelId[];
  selectedPanel: PanelId;
  onSelectPanel: (panel: PanelId) => void;
  forceMultiColumn: boolean;
  onToggleMultiColumn: () => void;
}

const TAB_META: Record<PanelId, { name: string; icon: React.ReactNode }> = {
  explorer: { name: 'Explorer', icon: <Folder size={12} /> },
  editor: { name: 'Editor', icon: <Code2 size={12} /> },
  agent: { name: 'AI Studio', icon: <Bot size={12} /> },
  'agents-center': { name: 'Agents Center', icon: <Bot size={12} /> },
  terminal: { name: 'Terminal', icon: <Terminal size={12} /> },
  browser: { name: 'Browser', icon: <Globe size={12} /> }
};

export const CompactPanelTabBar: React.FC<CompactPanelTabBarProps> = ({
  activePanels,
  selectedPanel,
  onSelectPanel,
  forceMultiColumn,
  onToggleMultiColumn
}) => {
  return (
    <div className="mx-4 mt-2 mb-1 px-2 py-1.5 surface-panel flex items-center justify-between gap-1 select-none shrink-0 z-20">
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar min-w-0">
        <span className="text-[10px] uppercase font-bold tracking-wider text-app-muted px-1.5 shrink-0 hidden sm:inline">
          Active:
        </span>
        {activePanels.map((id) => {
          const isSelected = id === selectedPanel;
          const meta = TAB_META[id] || { name: id, icon: <Code2 size={12} /> };
          return (
            <button
              key={id}
              onClick={() => onSelectPanel(id)}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0",
                isSelected
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-app-muted hover:text-app-text hover:bg-white/5"
              )}
            >
              {meta.icon}
              <span>{meta.name}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onToggleMultiColumn}
        className={clsx(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-medium border transition-colors shrink-0",
          forceMultiColumn
            ? "bg-primary/20 text-primary border-primary/40 font-bold"
            : "text-app-muted hover:text-app-text border-white/5 hover:bg-white/5"
        )}
        title={forceMultiColumn ? "Switch to Focused Single Panel" : "Switch to Multi-Column Split"}
      >
        {forceMultiColumn ? <Maximize2 size={11} /> : <Columns size={11} />}
        <span className="hidden sm:inline">{forceMultiColumn ? 'Focused' : 'Split'}</span>
      </button>
    </div>
  );
};
