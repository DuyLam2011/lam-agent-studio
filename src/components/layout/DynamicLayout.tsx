import React from 'react';
import { useAgentStore, PanelId } from '../../store/useAgentStore';
import { ExplorerPanel } from '../explorer/ExplorerPanel';
import { EditorPanel } from '../editor/EditorPanel';
import AgentPanel from '../agent/AgentPanel';
import { AgentsCenterPanel } from '../panels/AgentsCenterPanel';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { DynamicResizeHandle } from './DynamicResizeHandle';
import { ExternalLink, CornerDownLeft, Sparkles, Folder, Code2, Zap, Bot, Terminal } from 'lucide-react';
import clsx from 'clsx';

export const DynamicLayout: React.FC = () => {
  const {
    panelOrder,
    panelVisible,
    panelWidths,
    panelDetached,
    setPanelWidth,
    redockPanel,
    togglePanelVisible
  } = useAgentStore();

  const activePanels = panelOrder.filter(id => panelVisible[id] || panelDetached[id]);

  const renderPanelComponent = (id: PanelId, isCenter: boolean) => {
    if (panelDetached[id]) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <ExternalLink size={20} className="animate-pulse" />
          </div>
          <div className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
            {id} Panel Detached
          </div>
          <p className="text-[11px] text-gray-400 max-w-[200px]">
            This panel is currently floating in an independent desktop window.
          </p>
          <button
            onClick={() => redockPanel(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-medium transition-all shadow-lg"
          >
            <CornerDownLeft size={13} />
            <span>Re-dock to Workspace</span>
          </button>
        </div>
      );
    }

    switch (id) {
      case 'explorer':
        return <ExplorerPanel isCenter={isCenter} />;
      case 'editor':
        return <EditorPanel isCenter={isCenter} />;
      case 'agent':
        return <AgentPanel isCenter={isCenter} />;
      case 'agents-center':
        return <AgentsCenterPanel isCenter={isCenter} />;
      case 'terminal':
        return <TerminalPanel isCenter={isCenter} />;
    }
  };

  const getMarginClasses = (index: number, total: number) => {
    if (total === 1) return 'mx-4';
    if (index === 0) return 'ml-4 mr-1';
    if (index === total - 1) return 'ml-1 mr-4';
    return 'mx-1';
  };

  if (activePanels.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 select-none">
        <div className="w-12 h-12 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
          <Sparkles size={24} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-200">All Workspace Panels Hidden</h3>
          <p className="text-xs text-gray-500 mt-1">Select a panel below to activate your workspace layout</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {[
            { id: 'explorer' as PanelId, label: 'Explorer', icon: Folder },
            { id: 'editor' as PanelId, label: 'Editor', icon: Code2 },
            { id: 'agent' as PanelId, label: 'AI Studio', icon: Zap },
            { id: 'agents-center' as PanelId, label: 'Agents Center', icon: Bot },
            { id: 'terminal' as PanelId, label: 'Terminal', icon: Terminal },
          ].map(({ id, label, icon: Icon }) => (
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
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden min-h-0 select-text">
      {activePanels.map((id, index) => {
        const isCenter = activePanels.length === 1 || (activePanels.length === 2 && index === 1) || (activePanels.length >= 3 && index === 1);
        const marginClass = getMarginClasses(index, activePanels.length);

        return (
          <React.Fragment key={id}>
            <div
              style={!isCenter ? { width: panelWidths[id] || 320 } : undefined}
              className={clsx(
                "my-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col z-10 transition-all duration-75",
                isCenter ? "flex-1 min-w-[280px]" : "shrink-0",
                marginClass
              )}
            >
              {renderPanelComponent(id, isCenter)}
            </div>

            {index < activePanels.length - 1 && (
              <DynamicResizeHandle
                onResize={(deltaX) => {
                  const currentWidth = panelWidths[id] || 320;
                  setPanelWidth(id, currentWidth + deltaX);
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
