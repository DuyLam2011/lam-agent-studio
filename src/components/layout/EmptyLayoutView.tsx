import React from 'react';
import { PanelId, useAgentStore } from '../../store/useAgentStore';
import { Sparkles, Folder, Code2, Zap, Bot, Terminal } from 'lucide-react';

export const EmptyLayoutView: React.FC = () => {
  const { togglePanelVisible, setLayoutPreset } = useAgentStore();

  const panels = [
    { id: 'explorer' as PanelId, label: 'Explorer', icon: Folder },
    { id: 'editor' as PanelId, label: 'Editor', icon: Code2 },
    { id: 'agent' as PanelId, label: 'AI Studio', icon: Zap },
    { id: 'agents-center' as PanelId, label: 'Agents Center', icon: Bot },
    { id: 'terminal' as PanelId, label: 'Terminal', icon: Terminal },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 select-none">
      <div className="w-12 h-12 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
        <Sparkles size={24} className="text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-200">All Workspace Panels Hidden</h3>
        <p className="text-xs text-gray-500 mt-1">Select a panel or apply a layout preset below</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        {panels.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => togglePanelVisible(id)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 hover:text-white transition-all"
          >
            <Icon size={14} className="text-primary" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
        <button
          onClick={() => setLayoutPreset('vscode-dock')}
          className="px-3 py-1 text-xs rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 font-medium"
        >
          Load VS Code Layout
        </button>
        <button
          onClick={() => setLayoutPreset('columns-3')}
          className="px-3 py-1 text-xs rounded-lg bg-white/5 text-gray-300 hover:text-white border border-white/10 font-medium"
        >
          Load 3 Columns
        </button>
      </div>
    </div>
  );
};
