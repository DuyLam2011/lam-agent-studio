import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Bot, Terminal, Key, ChevronDown, Check, RefreshCw } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import {
  DEFAULT_ANTIGRAVITY_MODELS, DEFAULT_CODEX_MODELS,
  DEFAULT_CLAUDECODE_MODELS, DEFAULT_VERIFIED_MODELS,
  PROVIDER_DEFAULT_MODELS, isModelValidForProvider
} from './modelConstants';
import clsx from 'clsx';

const PROVIDERS = [
  { id: 'antigravity', label: 'Antigravity', icon: Sparkles, color: 'text-emerald-400', activeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { id: 'codex', label: 'Codex', icon: Bot, color: 'text-blue-400', activeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { id: 'claudecode', label: 'Claude', icon: Terminal, color: 'text-purple-400', activeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { id: 'gemini', label: 'Gemini', icon: Key, color: 'text-amber-400', activeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
];

export const AgentModelDropdown: React.FC<{ dropUp?: boolean; compact?: boolean }> = ({ dropUp = false, compact = false }) => {
  const { engineSettings, updateEngineSettings, liveModels, isFetchingLiveModels, fetchLiveModels, addToast } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const provider = (engineSettings.provider || 'antigravity') as string;
  const provMeta = PROVIDERS.find((p) => p.id === provider) || PROVIDERS[0];
  const Icon = provMeta.icon;

  const defaultList = provider === 'claudecode' ? DEFAULT_CLAUDECODE_MODELS
    : (provider === 'codex' ? DEFAULT_CODEX_MODELS
    : (provider === 'antigravity' ? DEFAULT_ANTIGRAVITY_MODELS : DEFAULT_VERIFIED_MODELS));
  const modelsList = liveModels.length > 0 ? liveModels : defaultList;

  const validModel = isModelValidForProvider(provider, engineSettings.selectedModel)
    ? engineSettings.selectedModel
    : (PROVIDER_DEFAULT_MODELS[provider] || defaultList[0].id);
  const currentModelObj = modelsList.find((m) => m.id === validModel) || { name: validModel, id: validModel };

  const handleSelectProvider = (provId: string) => {
    const defaultModel = PROVIDER_DEFAULT_MODELS[provId] || 'gemini-3.8-flash-high';
    updateEngineSettings({ provider: provId as any, selectedModel: defaultModel });
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings?.({ aiProvider: provId, aiModel: defaultModel });
    fetchLiveModels(provId, engineSettings.customApiKey);
    addToast(`Engine: ${provId.toUpperCase()}`, 'info');
  };

  const handleSelectModel = (modelId: string) => {
    updateEngineSettings({ selectedModel: modelId });
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings?.({ aiModel: modelId });
    setIsOpen(false);
    addToast(`Model: ${modelId}`, 'success');
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "surface-card flex items-center gap-1.5 rounded-lg border transition-all text-app-text select-none",
          compact ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-xs",
          isOpen && "border-primary/50 shadow-md"
        )}
        title="Select AI Engine & Model"
      >
        <Icon size={compact ? 11 : 12} className={clsx(provMeta.color, "shrink-0")} />
        <span className="font-bold text-[10px] uppercase text-app-sub shrink-0">{provMeta.label}</span>
        <span className="text-gray-500 text-[10px]">·</span>
        <span className={clsx("font-medium truncate", compact ? "max-w-[90px]" : "max-w-[120px]")}>{currentModelObj.name}</span>
        <ChevronDown size={10} className={clsx("text-app-muted shrink-0 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className={clsx("surface-dropdown absolute z-50 w-72 py-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100", dropUp ? "bottom-full left-0 mb-1.5" : "top-full left-0 mt-1")}>
          <div className="px-2 pb-1.5 mb-1 border-b border-border">
            <div className="text-[9px] uppercase tracking-wider text-app-muted font-bold mb-1">AI Engine Provider</div>
            <div className="grid grid-cols-4 gap-1">
              {PROVIDERS.map((p) => {
                const PIcon = p.icon;
                const active = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProvider(p.id)}
                    className={clsx(
                      "flex items-center justify-center gap-1 py-1 rounded text-[10px] font-semibold border transition-all",
                      active ? p.activeBg : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <PIcon size={10} className={p.color} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-2 py-1 flex items-center justify-between border-b border-border text-[9px] uppercase text-app-muted font-semibold">
            <span>{liveModels.length > 0 ? `Live Models (${liveModels.length})` : `${provMeta.label} Models`}</span>
            <button
              type="button"
              onClick={() => fetchLiveModels(provider, engineSettings.customApiKey)}
              disabled={isFetchingLiveModels}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <RefreshCw size={9} className={clsx(isFetchingLiveModels && "animate-spin")} />
              <span>{isFetchingLiveModels ? 'Fetching...' : 'Fetch Live'}</span>
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
            {modelsList.map((m: any) => {
              const selected = validModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectModel(m.id)}
                  className={clsx(
                    "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs text-left transition-colors",
                    selected ? "bg-primary/20 text-white font-semibold" : "text-gray-300 hover:bg-white/5"
                  )}
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="text-[11px] truncate">{m.name}</span>
                    <span className="text-[9px] text-gray-500 font-mono truncate">{m.id}</span>
                  </div>
                  {selected && <Check size={12} className="text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
