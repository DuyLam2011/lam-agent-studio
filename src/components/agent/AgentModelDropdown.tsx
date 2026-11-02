import React, { useState, useEffect, useRef } from 'react';
import { Cpu, ChevronDown, Check, RefreshCw, Plus } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import clsx from 'clsx';

export const AgentModelDropdown: React.FC<{ dropUp?: boolean; compact?: boolean }> = ({ dropUp = false, compact = false }) => {
  const { engineSettings, updateEngineSettings, liveModels, isFetchingLiveModels, fetchLiveModels, addToast } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (liveModels.length === 0 && engineSettings.customApiKey) {
      fetchLiveModels(engineSettings.provider, engineSettings.customApiKey);
    }
  }, [engineSettings.customApiKey, engineSettings.provider]);

  const defaultVerifiedModels = [
    { id: 'auto-smart-router', name: 'Auto (Smart Router)', provider: 'Google', badge: '🎯 Task Complexity Router' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', provider: 'Google', badge: '⚡ Ultra Fast (0.8s)' },
    { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite', provider: 'Google', badge: '⚡ Fast (0.9s)' },
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'Google', badge: 'Deep Reasoning (~60s)' }
  ];

  const modelsList = liveModels.length > 0 ? liveModels : defaultVerifiedModels;
  const currentModelId = engineSettings.selectedModel || 'gemini-3.5-flash-lite';
  const currentModelObj = modelsList.find(m => m.id === currentModelId) || { name: currentModelId, id: currentModelId };

  const handleSelectModel = (modelId: string) => {
    updateEngineSettings({ selectedModel: modelId });
    setIsOpen(false);
    addToast(`Selected model: ${modelId}`, 'success');
  };

  const handleApplyCustom = () => {
    if (!customModelInput.trim()) return;
    const clean = customModelInput.trim().replace(/^models\//, '');
    updateEngineSettings({ selectedModel: clean });
    setIsOpen(false);
    setShowCustomInput(false);
    addToast(`Selected custom model: ${clean}`, 'success');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "surface-card flex items-center gap-1.5 rounded-lg text-app-text hover:text-primary transition-colors",
          compact ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-xs"
        )}
        title="Select AI Model"
      >
        <Cpu size={compact ? 11 : 12} className="text-primary shrink-0" />
        <span className={clsx("font-medium truncate", compact ? "text-[10px] max-w-[85px]" : "text-[11px] max-w-[100px]")}>{currentModelObj.name}</span>
        <ChevronDown size={10} className="text-app-muted shrink-0" />
      </button>

      {isOpen && (
        <div className={clsx("surface-dropdown absolute z-50 w-64 py-1 shadow-2xl animate-in fade-in zoom-in-95 duration-100", dropUp ? "bottom-full left-0 mb-1.5" : "top-full left-0 mt-1")}>
          <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-border text-[9px] uppercase tracking-wider text-app-muted font-semibold">
            <span>{liveModels.length > 0 ? `Live Models (${liveModels.length})` : 'Verified Models'}</span>
            <button
              onClick={() => fetchLiveModels(engineSettings.provider, engineSettings.customApiKey)}
              disabled={isFetchingLiveModels}
              className="flex items-center gap-1 text-primary hover:underline"
              title="Refresh models from API"
            >
              <RefreshCw size={10} className={clsx(isFetchingLiveModels && "animate-spin")} />
              <span>{isFetchingLiveModels ? 'Fetching...' : 'Fetch Live'}</span>
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto custom-scrollbar">
            {modelsList.map((m: any) => (
              <button
                key={m.id}
                onClick={() => handleSelectModel(m.id)}
                className={clsx(
                  "w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left transition-colors border-b border-white/[0.02]",
                  currentModelId === m.id ? "bg-primary/20 text-white font-semibold" : "text-gray-300 hover:bg-white/5"
                )}
              >
                <div className="flex flex-col truncate pr-2">
                  <span className="text-[11px] truncate">{m.name}</span>
                  <span className="text-[9px] text-gray-500 font-mono truncate">{m.id}</span>
                </div>
                {currentModelId === m.id && <Check size={12} className="text-primary shrink-0" />}
              </button>
            ))}
          </div>

          {/* Custom Model Text Entry */}
          <div className="p-2 border-t border-white/5 bg-white/[0.02]">
            {showCustomInput ? (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  placeholder="e.g. gemini-3.5-flash-lite"
                  className="w-full surface-input rounded-lg px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-primary/50"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => setShowCustomInput(false)}
                    className="px-2 py-0.5 rounded text-[10px] text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyCustom}
                    className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-semibold"
                  >
                    Set Model
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full flex items-center justify-center gap-1 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 text-[10px] transition-colors"
              >
                <Plus size={11} />
                <span>Enter Custom Model ID</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
