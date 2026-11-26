import React from 'react';
import { SubagentModelOption, ConnectedPackageInfo } from '../../services/subagents/subagentPackageResolver';
import { Check, RefreshCw, Zap, ShieldAlert, Wifi } from 'lucide-react';
import clsx from 'clsx';

interface AgentModelDropdownListProps {
  selectedModelId: string;
  onSelectModel: (opt: SubagentModelOption) => void;
  activePackageFilter: string;
  setActivePackageFilter: (id: string) => void;
  packages: ConnectedPackageInfo[];
  modelOptions: SubagentModelOption[];
  isFetchingLive: boolean;
  onFetchLive: () => void;
}

export const AgentModelDropdownList: React.FC<AgentModelDropdownListProps> = ({
  selectedModelId, onSelectModel, activePackageFilter, setActivePackageFilter,
  packages, modelOptions, isFetchingLive, onFetchLive
}) => {
  const filteredOptions = modelOptions.filter((opt) => {
    if (activePackageFilter === 'all') return true;
    if (activePackageFilter === 'connected') return opt.connected;
    return opt.packageId === activePackageFilter;
  });

  return (
    <div className="text-xs space-y-1.5">
      {/* Package Filter Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1.5 px-1 custom-scrollbar border-b border-subtle text-[10px]">
        <button
          type="button"
          onClick={() => setActivePackageFilter('connected')}
          className={clsx(
            "px-2 py-0.5 rounded-full font-semibold border transition-all shrink-0 flex items-center gap-1 cursor-pointer",
            activePackageFilter === 'connected'
              ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40"
              : "surface-input border-subtle text-app-muted hover:text-app-text"
          )}
        >
          <Wifi size={10} className="text-emerald-500" />
          <span>Connected Only</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePackageFilter('all')}
          className={clsx(
            "px-2 py-0.5 rounded-full font-semibold border transition-all shrink-0 cursor-pointer",
            activePackageFilter === 'all'
              ? "bg-primary/15 text-primary border-primary/40"
              : "surface-input border-subtle text-app-muted hover:text-app-text"
          )}
        >
          All Packages
        </button>

        {packages.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => setActivePackageFilter(pkg.id)}
            className={clsx(
              "px-2 py-0.5 rounded-full font-medium border transition-all shrink-0 flex items-center gap-1 cursor-pointer",
              activePackageFilter === pkg.id
                ? "bg-primary/15 text-primary border-primary/40"
                : "surface-input border-subtle text-app-muted hover:text-app-text",
              !pkg.connected && "opacity-55"
            )}
            title={pkg.connected ? `${pkg.name} (Connected)` : `${pkg.name} (Disconnected)`}
          >
            <span className={clsx("w-1.5 h-1.5 rounded-full", pkg.connected ? "bg-emerald-500" : "bg-slate-400")} />
            <span>{pkg.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Live Fetch Action Header */}
      <div className="px-2 py-0.5 flex items-center justify-between text-[10px] text-app-muted font-mono">
        <span>Available Models ({filteredOptions.length})</span>
        <button type="button" onClick={onFetchLive} disabled={isFetchingLive} className="flex items-center gap-1 text-primary hover:underline cursor-pointer">
          <RefreshCw size={9} className={clsx(isFetchingLive && "animate-spin")} />
          <span>{isFetchingLive ? 'Checking...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Model Options List */}
      <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-1">
        {filteredOptions.map((opt) => {
          const isSelected = selectedModelId === opt.id || (selectedModelId === '' && opt.id === 'auto-smart-router');
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectModel(opt)}
              className={clsx(
                "w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all select-none group cursor-pointer",
                isSelected
                  ? "bg-primary/15 border-primary/50 text-app-text font-medium shadow-sm"
                  : "surface-card border-subtle hover:border-primary/35 text-app-sub",
                !opt.connected && "opacity-55 hover:opacity-85"
              )}
            >
              <div className="flex items-start gap-2 min-w-0 pr-1">
                <div className="mt-0.5 shrink-0">
                  {opt.id === 'auto-smart-router' ? (
                    <Zap size={13} className="text-primary fill-primary/25" />
                  ) : opt.connected ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 block mt-1" />
                  ) : (
                    <ShieldAlert size={12} className="text-app-muted" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-app-text group-hover:text-primary truncate font-medium">{opt.label.replace(/^🟢 |^⚪ /, '')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-app-muted font-mono">
                    <span className="text-primary">{opt.packageName}</span>
                    <span>·</span>
                    <span className="truncate">{opt.id}</span>
                    {!opt.connected && <span className="text-rose-500 font-bold">(Not Connected)</span>}
                  </div>
                </div>
              </div>
              {isSelected && <Check size={13} className="text-primary shrink-0 ml-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
