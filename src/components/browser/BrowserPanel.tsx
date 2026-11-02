import React, { useRef } from 'react';
import { DynamicPanelHeader } from '../layout/DynamicPanelHeader';
import { BrowserNavigationBar } from './BrowserNavigationBar';
import { BrowserElementInspectorDrawer } from './BrowserElementInspectorDrawer';
import { useBrowserPreview } from './useBrowserPreview';
import { Crosshair, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface BrowserPanelProps {
  isCenter?: boolean;
}

export const BrowserPanel: React.FC<BrowserPanelProps> = () => {
  const {
    url,
    setUrl,
    viewport,
    setViewport,
    inspectMode,
    setInspectMode,
    selectedElement,
    setSelectedElement,
    devServerRunning,
    handleInspectSelector,
    handleAddElementToChat,
    handleAskAiToFix
  } = useBrowserPreview();

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getViewportWidth = () => {
    if (viewport === 'mobile') return 'max-w-[375px]';
    if (viewport === 'tablet') return 'max-w-[768px]';
    return 'w-full';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden surface-panel">
      <DynamicPanelHeader panelId="browser" />

      <BrowserNavigationBar
        url={url}
        onNavigate={(newUrl) => {
          setUrl(newUrl);
          setSelectedElement(null);
        }}
        viewport={viewport}
        onSelectViewport={setViewport}
        inspectMode={inspectMode}
        onToggleInspect={() => setInspectMode(!inspectMode)}
        devServerRunning={devServerRunning}
      />

      {/* Main Preview Container */}
      <div className="flex-1 overflow-auto custom-scrollbar flex flex-col items-center justify-start bg-black/40 p-2 relative">
        {inspectMode && (
          <div className="w-full mb-2 p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[10.5px] text-sky-200 flex items-center justify-between gap-2 shrink-0 animate-in fade-in duration-100">
            <span className="flex items-center gap-1.5">
              <Crosshair size={12} className="text-sky-400 shrink-0" />
              <span>Inspect Mode active. Click an element to capture its DOM context.</span>
            </span>
            <div className="flex items-center gap-1">
              {['button.primary', 'header', '#root', 'input'].map((sel) => (
                <button
                  key={sel}
                  type="button"
                  onClick={() => handleInspectSelector(sel)}
                  className="px-1.5 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-mono text-[9px] transition-colors"
                >
                  {sel}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={clsx("h-full bg-white transition-all rounded-lg overflow-hidden shadow-2xl relative border border-white/10", getViewportWidth())}>
          {devServerRunning === false ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-700 bg-neutral-900 space-y-2">
              <AlertTriangle size={24} className="text-amber-400 mx-auto" />
              <div className="text-xs font-semibold text-gray-200">Local Dev Server Not Detected</div>
              <div className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                Start your local dev server (e.g. <code className="text-white font-mono">npm run dev</code> in Terminal) at <code className="text-primary font-mono">{url}</code>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={url}
              title="Browser UI Preview"
              className="w-full h-full border-0 bg-neutral-900"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}
        </div>
      </div>

      {/* Selected Element Inspector Drawer */}
      {selectedElement && (
        <BrowserElementInspectorDrawer
          element={selectedElement}
          onClose={() => setSelectedElement(null)}
          onAddToChat={handleAddElementToChat}
          onAskAiToFix={handleAskAiToFix}
        />
      )}
    </div>
  );
};
