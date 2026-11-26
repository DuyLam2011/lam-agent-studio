import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Bot, Sparkles } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import {
  detectConnectedPackages,
  getPackageAwareModelOptions,
  SubagentModelOption,
  inferPackageMeta
} from '../../services/subagents/subagentPackageResolver';
import { AgentModelDropdownList } from './AgentModelDropdownList';
import clsx from 'clsx';

export const AgentModelDropdown: React.FC<{ dropUp?: boolean; compact?: boolean }> = ({
  dropUp = false,
  compact = false
}) => {
  const store = useAgentStore();
  const { engineSettings, updateEngineSettings, addToast, isFetchingLiveModels, fetchLiveModels } = store;
  const [isOpen, setIsOpen] = useState(false);
  const [activePackageFilter, setActivePackageFilter] = useState<'all' | 'connected' | string>('connected');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const packages = detectConnectedPackages(store);
  const modelOptions = getPackageAwareModelOptions(store);
  const selectedModelId = engineSettings.selectedModel || 'auto-smart-router';
  const currentOption = modelOptions.find((m) => m.id === selectedModelId) || {
    id: selectedModelId,
    label: selectedModelId,
    packageName: inferPackageMeta(selectedModelId, engineSettings.provider).name,
    packageId: engineSettings.provider || 'antigravity',
    connected: true
  };

  const handleSelectModel = (opt: SubagentModelOption) => {
    if (!opt.connected) {
      addToast(`Cannot select ${opt.packageName}: Package is not connected. Connect account first.`, 'info');
      return;
    }

    const nextProvider = opt.packageId === 'auto' ? (engineSettings.provider || 'antigravity') : opt.packageId;
    updateEngineSettings({
      selectedModel: opt.id,
      ...(opt.packageId !== 'auto' ? { provider: nextProvider as any } : {})
    });

    store.assignFatherAgentModel?.(nextProvider, opt.id);
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings?.({ aiProvider: nextProvider, aiModel: opt.id });
    setIsOpen(false);
  };

  const handleFetchLive = () => {
    fetchLiveModels(engineSettings.provider, engineSettings.customApiKey);
    addToast('Refreshed live model definitions', 'info');
  };

  const connectedCount = packages.filter((p) => p.connected).length;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "surface-card flex items-center gap-1.5 rounded-xl border transition-all text-app-text select-none cursor-pointer",
          compact ? "px-2 py-1 text-[10.5px]" : "px-2.5 py-1.5 text-xs",
          isOpen ? "border-primary/50 shadow-md ring-1 ring-primary/30" : "border-subtle hover:border-primary/30"
        )}
        title="Agent Engine Configuration (Select from connected providers)"
      >
        <Bot size={compact ? 12 : 13} className="text-primary shrink-0" />
        <span className="font-semibold text-[10px] uppercase text-app-sub shrink-0">Model</span>
        <span className="text-app-muted text-[10px]">·</span>
        <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-primary/10 text-primary border border-primary/20 shrink-0">
          {currentOption.packageId === 'auto' ? 'Auto-Router' : currentOption.packageName.split(' ')[0]}
        </span>
        <span className={clsx("font-medium truncate", compact ? "max-w-[90px]" : "max-w-[130px]")}>
          {currentOption.label.replace(/^🟢 |^⚪ /, '').replace(/^\[.*?\]\s*/, '')}
        </span>
        <span className={clsx("w-2 h-2 rounded-full shrink-0", currentOption.connected ? "bg-emerald-500 shadow-sm shadow-emerald-500/40" : "bg-slate-400")} />
        <ChevronDown size={11} className={clsx("text-app-muted shrink-0 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          className={clsx(
            "surface-dropdown absolute z-50 w-84 p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100 rounded-2xl border border-subtle",
            dropUp ? "bottom-full left-0 mb-2" : "top-full left-0 mt-2"
          )}
        >
          {/* Header */}
          <div className="px-1 pb-2 mb-2 border-b border-subtle flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bot size={13} className="text-primary" />
              <span className="text-xs font-bold text-app-text">Primary Agent Engine</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-mono font-semibold">
              <Sparkles size={11} />
              <span>{connectedCount} Connected</span>
            </div>
          </div>

          {/* Model Options List */}
          <AgentModelDropdownList
            selectedModelId={selectedModelId}
            onSelectModel={handleSelectModel}
            activePackageFilter={activePackageFilter}
            setActivePackageFilter={setActivePackageFilter}
            packages={packages}
            modelOptions={modelOptions}
            isFetchingLive={isFetchingLiveModels}
            onFetchLive={handleFetchLive}
          />
        </div>
      )}
    </div>
  );
};
