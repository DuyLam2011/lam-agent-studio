import { PanelId } from '../../types/panel';

export type LayoutBreakpoint = 'compact' | 'medium' | 'wide';

export interface ResponsiveDimensions {
  containerWidth: number;
  containerHeight: number;
}

export const getResponsiveBreakpoint = (width: number): LayoutBreakpoint => {
  if (width < 768) return 'compact';
  if (width < 1180) return 'medium';
  return 'wide';
};

export const getDefaultPanelWidth = (id: PanelId): number => {
  switch (id) {
    case 'agent': return 420;
    case 'explorer': return 260;
    case 'agents-center': return 420;
    case 'browser': return 400;
    case 'terminal': return 340;
    case 'editor': return 560;
    default: return 320;
  }
};

export const calculateClampedSideWidth = (
  requestedWidth: number,
  containerWidth: number,
  totalSidePanelsCount: number,
  minCenterWidth = 280,
  minSideWidth = 180,
  otherSidePanelsAllocatedWidth?: number
): number => {
  if (totalSidePanelsCount <= 0) return requestedWidth;
  if (containerWidth <= 0) return Math.max(minSideWidth, requestedWidth);

  // Total reserved for center panel + resize handles & padding (~40px)
  const overhead = minCenterWidth + (totalSidePanelsCount * 16) + 32;
  const availableForSidePanels = Math.max(minSideWidth * totalSidePanelsCount, containerWidth - overhead);

  let maxAllowed: number;
  if (otherSidePanelsAllocatedWidth !== undefined) {
    maxAllowed = Math.max(minSideWidth, availableForSidePanels - otherSidePanelsAllocatedWidth);
  } else {
    maxAllowed = Math.floor(availableForSidePanels / totalSidePanelsCount);
  }

  // Clamp requested width within [minSideWidth, maxAllowed]
  return Math.max(minSideWidth, Math.min(requestedWidth, maxAllowed));
};

export const calculateClampedBottomHeight = (
  requestedHeight: number,
  containerHeight: number,
  minTopHeight = 200,
  minBottomHeight = 120
): number => {
  if (containerHeight <= 0) return Math.max(minBottomHeight, requestedHeight);
  const maxBottomHeight = Math.max(minBottomHeight, containerHeight - minTopHeight);
  return Math.max(minBottomHeight, Math.min(requestedHeight, maxBottomHeight));
};

export const calculateBalancedWidths = (
  activePanelIds: PanelId[],
  centerId: PanelId,
  storedWidths: Record<PanelId, number>,
  collapsedMap: Record<PanelId, boolean>,
  containerWidth: number
): Record<PanelId, number> => {
  const result: Record<PanelId, number> = { ...storedWidths };
  const sidePanels = activePanelIds.filter(id => id !== centerId && !collapsedMap[id]);
  const collapsedCount = activePanelIds.filter(id => id !== centerId && collapsedMap[id]).length;
  
  // Collapsed rail takes 36px fixed
  const collapsedRailSpace = collapsedCount * 36;
  const effectiveContainerWidth = Math.max(300, containerWidth - collapsedRailSpace);

  if (sidePanels.length === 0) return result;

  const overhead = 280 + (sidePanels.length * 16) + 32;
  const availableForSidePanels = Math.max(180 * sidePanels.length, effectiveContainerWidth - overhead);

  const requested: Record<string, number> = {};
  let totalRequested = 0;
  for (const id of sidePanels) {
    const raw = Math.max(180, storedWidths[id] || getDefaultPanelWidth(id));
    requested[id] = raw;
    totalRequested += raw;
  }

  if (totalRequested <= availableForSidePanels) {
    for (const id of sidePanels) {
      result[id] = requested[id];
    }
  } else {
    // Proportional scaling above minimum base (180px)
    const baseTotal = 180 * sidePanels.length;
    const surplusAvailable = Math.max(0, availableForSidePanels - baseTotal);
    const surplusRequested = Math.max(1, totalRequested - baseTotal);

    for (const id of sidePanels) {
      const panelSurplus = Math.max(0, requested[id] - 180);
      const allocatedSurplus = Math.floor((panelSurplus / surplusRequested) * surplusAvailable);
      let calculated = 180 + allocatedSurplus;
      if (effectiveContainerWidth < 1000 && sidePanels.length >= 2) {
        calculated = Math.min(calculated, Math.floor(effectiveContainerWidth / (sidePanels.length + 1)));
      }
      result[id] = calculated;
    }
  }

  return result;
};
