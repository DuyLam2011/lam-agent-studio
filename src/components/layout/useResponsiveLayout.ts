import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PanelId } from '../../types/panel';
import {
  getResponsiveBreakpoint,
  calculateBalancedWidths,
  calculateClampedBottomHeight,
  LayoutBreakpoint
} from './layoutResponsiveUtils';

interface UseResponsiveLayoutOptions {
  activePanels: PanelId[];
  centerId: PanelId;
  panelWidths: Record<PanelId, number>;
  terminalHeight: number;
  panelCollapsed?: Record<PanelId, boolean>;
  onToggleCollapse?: (id: PanelId) => void;
}

export const useResponsiveLayout = ({
  activePanels,
  centerId,
  panelWidths,
  terminalHeight,
  panelCollapsed: externalCollapsed,
  onToggleCollapse: externalToggleCollapse
}: UseResponsiveLayoutOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const [compactActivePanel, setCompactActivePanel] = useState<PanelId>(centerId);
  const [forceMultiColumn, setForceMultiColumn] = useState<boolean>(false);
  const [localCollapsed, setLocalCollapsed] = useState<Record<PanelId, boolean>>({
    explorer: false,
    editor: false,
    agent: false,
    'agents-center': false,
    terminal: false,
    browser: false
  });

  const collapsedPanels = externalCollapsed || localCollapsed;

  // Observe container dimensions for fluid responsiveness
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect) {
        setDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height)
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const breakpoint: LayoutBreakpoint = useMemo(
    () => getResponsiveBreakpoint(dimensions.width),
    [dimensions.width]
  );

  const isCompact = breakpoint === 'compact';
  const isSingleMode = isCompact && !forceMultiColumn;

  // Auto-align compact active panel if current active panel becomes hidden
  useEffect(() => {
    if (!activePanels.includes(compactActivePanel)) {
      setCompactActivePanel(activePanels.includes(centerId) ? centerId : (activePanels[0] || 'editor'));
    }
  }, [activePanels, centerId, compactActivePanel]);

  const togglePanelCollapse = useCallback((id: PanelId) => {
    if (externalToggleCollapse) {
      externalToggleCollapse(id);
    } else {
      setLocalCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
    }
  }, [externalToggleCollapse]);

  const balancedWidths = useMemo(() => {
    return calculateBalancedWidths(
      activePanels,
      centerId,
      panelWidths,
      collapsedPanels,
      dimensions.width
    );
  }, [activePanels, centerId, panelWidths, collapsedPanels, dimensions.width]);

  const clampedBottomHeight = useMemo(() => {
    return calculateClampedBottomHeight(terminalHeight, dimensions.height);
  }, [terminalHeight, dimensions.height]);

  return {
    containerRef,
    dimensions,
    breakpoint,
    isCompact,
    isSingleMode,
    compactActivePanel,
    setCompactActivePanel,
    forceMultiColumn,
    setForceMultiColumn,
    collapsedPanels,
    togglePanelCollapse,
    balancedWidths,
    clampedBottomHeight
  };
};
