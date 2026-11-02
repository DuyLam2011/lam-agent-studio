import React, { useState } from 'react';
import { RotateCcw, Crosshair, Smartphone, Tablet, Monitor, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { BrowserViewportPreset } from '../../types/browser';
import clsx from 'clsx';

interface BrowserNavigationBarProps {
  url: string;
  onNavigate: (url: string) => void;
  viewport: BrowserViewportPreset;
  onSelectViewport: (vp: BrowserViewportPreset) => void;
  inspectMode: boolean;
  onToggleInspect: () => void;
  devServerRunning: boolean | null;
}

export const BrowserNavigationBar: React.FC<BrowserNavigationBarProps> = ({
  url,
  onNavigate,
  viewport,
  onSelectViewport,
  inspectMode,
  onToggleInspect,
  devServerRunning
}) => {
  const [inputUrl, setInputUrl] = useState(url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) onNavigate(inputUrl.trim());
  };

  return (
    <div className="flex items-center gap-2 p-2 surface-header border-b border-white/5 text-xs select-none">
      {/* Dev Server Status Indicator */}
      <div className="flex items-center gap-1 shrink-0" title={devServerRunning ? 'Dev server connected' : 'Checking dev server'}>
        {devServerRunning ? (
          <CheckCircle2 size={13} className="text-emerald-400" />
        ) : (
          <AlertCircle size={13} className="text-amber-400" />
        )}
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex items-center min-w-0 relative">
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="http://localhost:5173"
          className="w-full surface-input rounded-lg py-1 pl-7 pr-7 text-[11px] font-mono focus:outline-none focus:border-primary/50"
        />
        <Globe size={12} className="absolute left-2 text-gray-400 pointer-events-none" />
        <button
          type="button"
          onClick={() => onNavigate(inputUrl)}
          className="absolute right-1.5 p-1 text-gray-400 hover:text-white rounded transition-colors"
          title="Reload Preview"
        >
          <RotateCcw size={11} />
        </button>
      </form>

      {/* Quick Port Pills */}
      <div className="hidden sm:flex items-center gap-1 shrink-0">
        {['5173', '3000', '8080'].map((port) => (
          <button
            key={port}
            type="button"
            onClick={() => {
              const newUrl = `http://localhost:${port}`;
              setInputUrl(newUrl);
              onNavigate(newUrl);
            }}
            className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 transition-colors"
          >
            :{port}
          </button>
        ))}
      </div>

      {/* Viewport Presets */}
      <div className="flex items-center gap-0.5 border-l border-white/10 pl-2 shrink-0">
        <button
          type="button"
          onClick={() => onSelectViewport('desktop')}
          className={clsx("p-1 rounded transition-colors", viewport === 'desktop' ? "bg-white/15 text-white" : "text-gray-400 hover:text-gray-200")}
          title="Desktop (100%)"
        >
          <Monitor size={12} />
        </button>
        <button
          type="button"
          onClick={() => onSelectViewport('tablet')}
          className={clsx("p-1 rounded transition-colors", viewport === 'tablet' ? "bg-white/15 text-white" : "text-gray-400 hover:text-gray-200")}
          title="Tablet (768px)"
        >
          <Tablet size={12} />
        </button>
        <button
          type="button"
          onClick={() => onSelectViewport('mobile')}
          className={clsx("p-1 rounded transition-colors", viewport === 'mobile' ? "bg-white/15 text-white" : "text-gray-400 hover:text-gray-200")}
          title="Mobile (375px)"
        >
          <Smartphone size={12} />
        </button>
      </div>

      {/* Inspect Mode Toggle */}
      <button
        type="button"
        onClick={onToggleInspect}
        className={clsx(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-medium transition-colors border shrink-0",
          inspectMode
            ? "bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm"
            : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
        )}
        title="Toggle DOM Element Inspector"
      >
        <Crosshair size={12} />
        <span className="hidden md:inline">Inspect</span>
      </button>
    </div>
  );
};
