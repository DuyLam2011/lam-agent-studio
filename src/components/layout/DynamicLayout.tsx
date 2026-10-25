import React from 'react';
import { useAgentStore, PanelId } from '../../store/useAgentStore';
import { ExplorerPanel } from '../explorer/ExplorerPanel';
import { EditorPanel } from '../editor/EditorPanel';
import AgentPanel from '../agent/AgentPanel';
import { AgentsCenterPanel } from '../panels/AgentsCenterPanel';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { DynamicResizeHandle } from './DynamicResizeHandle';
import { EmptyLayoutView } from './EmptyLayoutView';
import clsx from 'clsx';

export const DynamicLayout: React.FC = () => {
  const {
    panelOrder,
    panelVisible,
    panelWidths,
    panelHeights,
    panelDetached,
    layoutPreset,
    terminalDockPosition,
    setPanelWidth,
    setPanelHeight
  } = useAgentStore();

  // Only panels that are visible AND NOT detached belong to the main window
  const activePanels = panelOrder.filter(id => panelVisible[id] && !panelDetached[id]);
  const isBottomDock = layoutPreset === 'vscode-dock' &&
    terminalDockPosition === 'bottom' &&
    panelVisible.terminal &&
    !panelDetached.terminal;

  const topPanels = isBottomDock ? activePanels.filter(id => id !== 'terminal') : activePanels;
  const bottomPanel = isBottomDock ? ('terminal' as PanelId) : null;

  const centerId = topPanels.includes('editor')
    ? 'editor'
    : (topPanels.length >= 2 ? topPanels[1] : topPanels[0]);
  const centerIndex = topPanels.indexOf(centerId);

  const renderPanel = (id: PanelId, isCenter: boolean) => {
    switch (id) {
      case 'explorer': return <ExplorerPanel isCenter={isCenter} />;
      case 'editor': return <EditorPanel isCenter={isCenter} />;
      case 'agent': return <AgentPanel isCenter={isCenter} />;
      case 'agents-center': return <AgentsCenterPanel isCenter={isCenter} />;
      case 'terminal': return <TerminalPanel isCenter={isCenter} />;
    }
  };

  if (activePanels.length === 0) return <EmptyLayoutView />;

  const getDefaultWidth = (id: PanelId) => {
    if (id === 'agent') return 440;
    if (id === 'explorer') return 280;
    return 320;
  };

  const handleHorizontalResize = (index: number, deltaX: number) => {
    if (index < centerIndex) {
      const targetId = topPanels[index];
      const curW = useAgentStore.getState().panelWidths[targetId] || getDefaultWidth(targetId);
      setPanelWidth(targetId, curW + deltaX);
    } else {
      const targetId = topPanels[index + 1];
      if (targetId) {
        const curW = useAgentStore.getState().panelWidths[targetId] || getDefaultWidth(targetId);
        setPanelWidth(targetId, curW - deltaX);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 select-text">
      {/* Top / Column Panels Area */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {topPanels.map((id, index) => {
          const isCenter = id === centerId;
          const panelWidth = panelWidths[id] || getDefaultWidth(id);
          return (
            <React.Fragment key={id}>
              <div
                style={!isCenter ? { width: panelWidth } : undefined}
                className={clsx(
                  "my-3 surface-panel overflow-hidden flex flex-col z-10 transition-all duration-75",
                  isCenter ? "flex-1 min-w-[280px]" : "shrink-0",
                  index === 0 ? "ml-4 mr-1" : index === topPanels.length - 1 ? "ml-1 mr-4" : "mx-1"
                )}
              >
                {renderPanel(id, isCenter)}
              </div>

              {index < topPanels.length - 1 && (
                <DynamicResizeHandle
                  orientation="vertical"
                  onResize={(deltaX) => handleHorizontalResize(index, deltaX)}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* VS Code-style Bottom Drawer */}
      {bottomPanel && (
        <>
          <DynamicResizeHandle
            orientation="horizontal"
            onResize={(deltaY) => {
              const curH = useAgentStore.getState().panelHeights['terminal'] || 260;
              setPanelHeight('terminal', curH - deltaY);
            }}
          />
          <div
            style={{ height: panelHeights['terminal'] || 260 }}
            className="mx-4 mb-3 surface-panel overflow-hidden flex flex-col z-10 shrink-0 transition-all duration-75"
          >
            {renderPanel(bottomPanel, true)}
          </div>
        </>
      )}
    </div>
  );
};
