import { PanelId, LayoutPreset } from '../../types/panel';

export interface PersistedLayoutState {
  panelOrder: PanelId[];
  panelVisible: Record<PanelId, boolean>;
  panelWidths: Record<PanelId, number>;
  panelHeights: Record<PanelId, number>;
  panelDetached: Record<PanelId, boolean>;
  panelCollapsed?: Record<PanelId, boolean>;
  terminalDockPosition: 'bottom' | 'column';
  layoutPreset: LayoutPreset;
}

const DEFAULT_ORDER: PanelId[] = ['explorer', 'editor', 'agent', 'agents-center', 'terminal', 'browser'];
const DEFAULT_VISIBLE: Record<PanelId, boolean> = { explorer: true, editor: true, terminal: true, agent: false, 'agents-center': false, browser: false };
const DEFAULT_WIDTHS: Record<PanelId, number> = { explorer: 260, editor: 560, agent: 340, 'agents-center': 440, terminal: 360, browser: 440 };
const DEFAULT_HEIGHTS: Record<PanelId, number> = { explorer: 300, editor: 300, agent: 300, 'agents-center': 300, terminal: 260, browser: 300 };
const DEFAULT_DETACHED: Record<PanelId, boolean> = { explorer: false, editor: false, agent: false, 'agents-center': false, terminal: false, browser: false };
const DEFAULT_COLLAPSED: Record<PanelId, boolean> = { explorer: false, editor: false, agent: false, 'agents-center': false, terminal: false, browser: false };

export const loadInitialPanelLayout = (): PersistedLayoutState => {
  let panelOrder = [...DEFAULT_ORDER];
  let panelVisible = { ...DEFAULT_VISIBLE };
  let panelWidths = { ...DEFAULT_WIDTHS };
  let panelHeights = { ...DEFAULT_HEIGHTS };
  let panelDetached = { ...DEFAULT_DETACHED };
  let panelCollapsed = { ...DEFAULT_COLLAPSED };
  let terminalDockPosition: 'bottom' | 'column' = 'bottom';
  let layoutPreset: LayoutPreset = 'vscode-dock';

  if (typeof localStorage !== 'undefined') {
    try {
      const savedVisible = localStorage.getItem('lam_panel_visible');
      if (savedVisible) {
        const parsed = JSON.parse(savedVisible);
        if (parsed && typeof parsed === 'object') {
          panelVisible = { ...panelVisible, ...parsed };
        }
      }
      const savedCollapsed = localStorage.getItem('lam_panel_collapsed');
      if (savedCollapsed) {
        const parsed = JSON.parse(savedCollapsed);
        if (parsed && typeof parsed === 'object') panelCollapsed = { ...panelCollapsed, ...parsed };
      }
      const savedOrder = localStorage.getItem('lam_panel_order');
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed) && parsed.length >= 3) panelOrder = parsed;
      }
      const savedWidths = localStorage.getItem('lam_panel_widths');
      if (savedWidths) {
        const parsed = JSON.parse(savedWidths);
        if (parsed && typeof parsed === 'object') panelWidths = { ...panelWidths, ...parsed };
      }
      const savedHeights = localStorage.getItem('lam_panel_heights');
      if (savedHeights) {
        const parsed = JSON.parse(savedHeights);
        if (parsed && typeof parsed === 'object') panelHeights = { ...panelHeights, ...parsed };
      }
      const savedDetached = localStorage.getItem('lam_panel_detached');
      if (savedDetached) {
        const parsed = JSON.parse(savedDetached);
        if (parsed && typeof parsed === 'object') panelDetached = { ...panelDetached, ...parsed };
      }
      const savedDock = localStorage.getItem('lam_terminal_dock');
      if (savedDock === 'bottom' || savedDock === 'column') terminalDockPosition = savedDock;
      const savedPreset = localStorage.getItem('lam_layout_preset');
      if (savedPreset === 'vscode-dock' || savedPreset === 'columns-3' || savedPreset === 'focus-code' || savedPreset === 'custom') layoutPreset = savedPreset;
    } catch (e) {
      console.warn('loadInitialPanelLayout failed:', e);
    }
  }

  return { panelOrder, panelVisible, panelWidths, panelHeights, panelDetached, panelCollapsed, terminalDockPosition, layoutPreset };
};

export const persistPanelLayout = (patch: Partial<PersistedLayoutState>) => {
  if (typeof localStorage !== 'undefined') {
    try {
      if (patch.panelVisible) localStorage.setItem('lam_panel_visible', JSON.stringify(patch.panelVisible));
      if (patch.panelCollapsed) localStorage.setItem('lam_panel_collapsed', JSON.stringify(patch.panelCollapsed));
      if (patch.panelOrder) localStorage.setItem('lam_panel_order', JSON.stringify(patch.panelOrder));
      if (patch.panelWidths) localStorage.setItem('lam_panel_widths', JSON.stringify(patch.panelWidths));
      if (patch.panelHeights) localStorage.setItem('lam_panel_heights', JSON.stringify(patch.panelHeights));
      if (patch.panelDetached) localStorage.setItem('lam_panel_detached', JSON.stringify(patch.panelDetached));
      if (patch.terminalDockPosition) localStorage.setItem('lam_terminal_dock', patch.terminalDockPosition);
      if (patch.layoutPreset) localStorage.setItem('lam_layout_preset', patch.layoutPreset);
    } catch {}
  }

  try {
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings?.(patch);
  } catch {}
};
