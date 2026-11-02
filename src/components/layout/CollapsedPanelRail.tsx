import React from 'react';
import { PanelId } from '../../types/panel';
import { Folder, Code2, Bot, Terminal, Globe, ChevronRight, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

interface CollapsedPanelRailProps {
  panelId: PanelId;
  isFirst: boolean;
  onExpand: () => void;
}

const RAIL_META: Record<PanelId, { name: string; icon: React.ReactNode }> = {
  explorer: { name: 'Explorer', icon: <Folder size={13} className="text-primary" /> },
  editor: { name: 'Editor', icon: <Code2 size={13} className="text-primary" /> },
  agent: { name: 'AI Studio', icon: <Bot size={13} className="text-primary" /> },
  'agents-center': { name: 'Agents Center', icon: <Bot size={13} className="text-primary" /> },
  terminal: { name: 'Terminal', icon: <Terminal size={13} className="text-primary" /> },
  browser: { name: 'Browser', icon: <Globe size={13} className="text-primary" /> }
};

export const CollapsedPanelRail: React.FC<CollapsedPanelRailProps> = ({
  panelId,
  isFirst,
  onExpand
}) => {
  const meta = RAIL_META[panelId] || { name: panelId, icon: <Code2 size={13} /> };

  return (
    <div
      onClick={onExpand}
      className={clsx(
        "w-9 my-3 surface-panel overflow-hidden flex flex-col items-center py-3 z-10 shrink-0",
        "cursor-pointer hover:border-primary/50 transition-all duration-150 group/rail select-none",
        isFirst ? "ml-4 mr-1" : "mx-1"
      )}
      title={`Click to expand ${meta.name} panel`}
    >
      <div className="p-1 rounded-md text-app-muted group-hover/rail:text-primary transition-colors mb-2">
        {meta.icon}
      </div>

      <div className="flex-1 flex items-center justify-center py-2 overflow-hidden">
        <span
          className="text-[10px] font-semibold tracking-wider text-app-muted uppercase group-hover/rail:text-app-text whitespace-nowrap"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {meta.name}
        </span>
      </div>

      <div className="p-1 rounded text-app-muted group-hover/rail:text-primary transition-transform group-hover/rail:scale-110">
        {isFirst ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </div>
    </div>
  );
};
