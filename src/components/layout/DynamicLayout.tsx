import React from 'react';
import { useAgentStore, PanelId } from '../../store/useAgentStore';
import { PanelRenderer } from './PanelRenderer';
import { DynamicResizeHandle } from './DynamicResizeHandle';
import { EmptyLayoutView } from './EmptyLayoutView';
import { CompactPanelTabBar } from './CompactPanelTabBar';
import { CollapsedPanelRail } from './CollapsedPanelRail';
import { useResponsiveLayout } from './useResponsiveLayout';
import { getDefaultPanelWidth } from './layoutResponsiveUtils';
import clsx from 'clsx';

export const DynamicLayout: React.FC = () => {
  const {
    panelOrder, panelVisible, panelWidths, panelHeights, panelDetached,
    panelCollapsed, layoutPreset, terminalDockPosition, setPanelWidth,
    setPanelHeight, togglePanelCollapse
  } = useAgentStore();

  const activePanels = panelOrder.filter(id => panelVisible[id] && !panelDetached[id]);
  const isBottomDock = (terminalDockPosition === 'bottom' && layoutPreset !== 'columns-3') &&
    panelVisible.terminal &&
    !panelDetached.terminal;

  const topPanels = isBottomDock ? activePanels.filter(id => id !== 'terminal') : activePanels;
  const bottomPanel = isBottomDock ? ('terminal' as PanelId) : null;

  const centerId = topPanels.includes('editor')
    ? 'editor'
    : (topPanels.length >= 2 ? topPanels[1] : (topPanels[0] || 'editor'));
  const centerIndex = topPanels.indexOf(centerId);

  const {
    containerRef, isSingleMode, compactActivePanel, setCompactActivePanel,
    forceMultiColumn, setForceMultiColumn, collapsedPanels, balancedWidths,
    clampedBottomHeight
  } = useResponsiveLayout({
    activePanels,
    centerId,
    panelWidths,
    terminalHeight: panelHeights['terminal'] || 260,
    panelCollapsed,
    onToggleCollapse: togglePanelCollapse
  });

  if (activePanels.length === 0) return <EmptyLayoutView />;

  const handleHorizontalResize = (index: number, deltaX: number) => {
    const targetId = index < centerIndex ? topPanels[index] : topPanels[index + 1];
    if (!targetId) return;
    const state = useAgentStore.getState();
    const curW = state.panelWidths[targetId] || getDefaultPanelWidth(targetId);
    const nextW = curW + (index < centerIndex ? deltaX : -deltaX);
    if (nextW < 120) {
      state.setPanelVisible(targetId, false);
      state.setPanelWidth(targetId, getDefaultPanelWidth(targetId));
    } else {
      state.setPanelWidth(targetId, nextW);
    }
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden min-h-0 select-text relative">
      {isSingleMode && (
        <CompactPanelTabBar
          activePanels={activePanels}
          selectedPanel={compactActivePanel}
          onSelectPanel={setCompactActivePanel}
          forceMultiColumn={forceMultiColumn}
          onToggleMultiColumn={() => setForceMultiColumn(!forceMultiColumn)}
        />
      )}

      {isSingleMode ? (
        <div className="flex-1 mx-4 my-2 surface-panel overflow-hidden flex flex-col z-10 transition-all duration-150">
          <PanelRenderer id={compactActivePanel} isCenter={true} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden min-h-0">
          {topPanels.map((id, index) => {
            const isCenter = id === centerId;
            const isCollapsed = !isCenter && !!collapsedPanels[id];
            const panelWidth = balancedWidths[id] || getDefaultPanelWidth(id);

            if (isCollapsed) {
              return (
                <React.Fragment key={id}>
                  <CollapsedPanelRail panelId={id} isFirst={index === 0} onExpand={() => togglePanelCollapse(id)} />
                  {index < topPanels.length - 1 && (
                    <DynamicResizeHandle orientation="vertical" onResize={(deltaX) => handleHorizontalResize(index, deltaX)} onReset={() => togglePanelCollapse(id)} />
                  )}
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={id}>
                <div
                  style={!isCenter ? { width: panelWidth } : undefined}
                  className={clsx(
                    "my-3 surface-panel overflow-hidden flex flex-col z-10",
                    isCenter ? "flex-1 min-w-[260px]" : "shrink-0",
                    index === 0 ? "ml-4 mr-1" : index === topPanels.length - 1 ? "ml-1 mr-4" : "mx-1"
                  )}
                >
                  <PanelRenderer id={id} isCenter={isCenter} />
                </div>
                {index < topPanels.length - 1 && (
                  <DynamicResizeHandle
                    orientation="vertical"
                    onResize={(deltaX) => handleHorizontalResize(index, deltaX)}
                    onReset={() => {
                      const targetId = index < centerIndex ? topPanels[index] : topPanels[index + 1];
                      if (targetId) setPanelWidth(targetId, getDefaultPanelWidth(targetId));
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {!isSingleMode && bottomPanel && (
        <>
          <DynamicResizeHandle
            orientation="horizontal"
            onResize={(deltaY) => {
              const state = useAgentStore.getState();
              const curH = state.panelHeights['terminal'] || 260;
              const nextH = curH - deltaY;
              if (nextH < 80) {
                state.setPanelVisible('terminal', false);
                state.setPanelHeight('terminal', 260);
              } else {
                state.setPanelHeight('terminal', nextH);
              }
            }}
            onReset={() => setPanelHeight('terminal', 260)}
          />
          <div style={{ height: clampedBottomHeight }} className="mx-4 mb-3 surface-panel overflow-hidden flex flex-col z-10 shrink-0">
            <PanelRenderer id={bottomPanel} isCenter={true} />
          </div>
        </>
      )}
    </div>
  );
};
