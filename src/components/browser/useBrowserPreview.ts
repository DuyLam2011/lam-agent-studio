import { useState, useEffect, useCallback } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import { DOMElementInspection, BrowserViewportPreset, BrowserConsoleLog } from '../../types/browser';

export const useBrowserPreview = () => {
  const { addContextAttachment, setPanelVisible, setPendingChatPrompt, addToast } = useAgentStore();
  const [url, setUrl] = useState('http://localhost:5173');
  const [isLoading, setIsLoading] = useState(false);
  const [viewport, setViewport] = useState<BrowserViewportPreset>('responsive');
  const [inspectMode, setInspectMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<DOMElementInspection | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<BrowserConsoleLog[]>([]);
  const [devServerRunning, setDevServerRunning] = useState<boolean | null>(null);

  const checkDevServer = useCallback(async (targetUrl: string) => {
    try {
      // @ts-ignore
      const res = await window.lamApi?.browser?.navigate?.(targetUrl);
      setDevServerRunning(res?.status === 200 || !res?.error);
      // @ts-ignore
      const logs = await window.lamApi?.browser?.getConsoleLogs?.();
      if (Array.isArray(logs)) setConsoleLogs(logs);
    } catch {
      setDevServerRunning(false);
    }
  }, []);

  useEffect(() => {
    checkDevServer(url);
  }, [url, checkDevServer]);

  const handleInspectSelector = async (selector: string) => {
    setIsLoading(true);
    try {
      // @ts-ignore
      const result: DOMElementInspection = await window.lamApi?.browser?.inspectElement?.(selector);
      setSelectedElement(result);
    } catch (err: any) {
      addToast(`Inspection failed: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddElementToChat = (element: DOMElementInspection) => {
    const snippet = `[DOM Element: <${element.tagName}${element.className ? ` class="${element.className}"` : ''}>]
Selector: ${element.selector}
Text: "${element.textContent.slice(0, 100)}"
BoundingBox: { x: ${element.boundingBox.x}, y: ${element.boundingBox.y}, width: ${element.boundingBox.width}, height: ${element.boundingBox.height} }
Computed Styles: ${JSON.stringify(element.computedStyles, null, 2)}
HTML: ${element.outerHTML}`;

    addContextAttachment({
      id: `dom-${Date.now()}`,
      name: `<${element.tagName}${element.className ? `.${element.className.split(' ')[0]}` : ''}>`,
      type: 'dom_element',
      path: 'browser:dom',
      tokenEstimate: Math.max(120, Math.ceil(snippet.length / 3.8)),
      pinned: true,
      snippet
    });

    addToast(`Attached element <${element.tagName}> to AI Chat`, 'success');
  };

  const handleAskAiToFix = (element: DOMElementInspection, intent?: string) => {
    handleAddElementToChat(element);
    setPanelVisible('agent', true);
    const prompt = `@browser-inspector Inspect and refine element \`${element.selector}\`: ${intent || 'Check layout alignment, responsive bounds, and clean CSS styling.'}`;
    setPendingChatPrompt(prompt);
  };

  return {
    url,
    setUrl,
    isLoading,
    setIsLoading,
    viewport,
    setViewport,
    inspectMode,
    setInspectMode,
    selectedElement,
    setSelectedElement,
    consoleLogs,
    devServerRunning,
    handleInspectSelector,
    handleAddElementToChat,
    handleAskAiToFix
  };
};
