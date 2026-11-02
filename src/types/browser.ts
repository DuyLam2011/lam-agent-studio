export interface DOMElementInspection {
  tagName: string;
  id?: string;
  className?: string;
  selector: string;
  textContent: string;
  outerHTML: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  computedStyles: Record<string, string>;
  attributes: Record<string, string>;
  componentName?: string;
}

export interface BrowserConsoleLog {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  source?: string;
}

export type BrowserViewportPreset = 'responsive' | 'desktop' | 'tablet' | 'mobile';

export interface BrowserState {
  currentUrl: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  viewport: BrowserViewportPreset;
  inspectMode: boolean;
  selectedElement: DOMElementInspection | null;
  consoleLogs: BrowserConsoleLog[];
}
