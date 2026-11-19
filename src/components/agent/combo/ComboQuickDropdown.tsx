import React from 'react';
import { Layers, ShieldCheck, Clock, Sparkles, Check, Settings, Power } from 'lucide-react';
import { AgentCombo } from '../../../types/agent-combo';
import clsx from 'clsx';

interface ComboQuickDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  activeCombo: AgentCombo;
  isComboFlowEnabled: boolean;
  onToggleFlow: () => void;
  agentCombos: AgentCombo[];
  onSelectCombo: (comboId: string) => void;
  onOpenManagement: () => void;
}

export const ComboQuickDropdown: React.FC<ComboQuickDropdownProps> = ({
  isOpen,
  activeCombo,
  isComboFlowEnabled,
  onToggleFlow,
  agentCombos,
  onSelectCombo,
  onOpenManagement
}) => {
  if (!isOpen) return null;

  const renderIcon = (icon?: string) => {
    switch (icon) {
      case 'ShieldCheck': return <ShieldCheck size={13} className="text-emerald-400 shrink-0" />;
      case 'Clock': return <Clock size={13} className="text-amber-400 shrink-0" />;
      case 'Sparkles': return <Sparkles size={13} className="text-cyan-400 shrink-0" />;
      default: return <Layers size={13} className="text-purple-400 shrink-0" />;
    }
  };

  return (
    <div className="surface-dropdown absolute bottom-full left-0 mb-2 w-80 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs rounded-2xl border border-white/10 backdrop-blur-xl">
      {/* 1. Master Enable / Disable Toggle */}
      <div className={clsx(
        "p-2.5 rounded-xl border mb-2.5 flex items-center justify-between gap-3 transition-colors",
        isComboFlowEnabled
          ? "bg-purple-950/40 border-purple-500/40"
          : "surface-card border-white/5"
      )}>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Power size={13} className={isComboFlowEnabled ? "text-emerald-400" : "text-gray-500"} />
            <span className="text-xs font-bold text-gray-100">Agent Ensemble Flow</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
            {isComboFlowEnabled ? 'Active: Subagents collaborate on complex tasks' : 'Solo: Father Agent handles tasks directly'}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleFlow}
          className={clsx(
            "px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all shadow-sm border shrink-0",
            isComboFlowEnabled
              ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20"
              : "bg-white/10 text-gray-300 border-white/10 hover:text-white"
          )}
        >
          {isComboFlowEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* 2. Available Combos Quick List */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center justify-between px-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>Select Agent Combo</span>
          <span className="font-mono">{agentCombos.length}</span>
        </div>

        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 pr-0.5">
          {agentCombos.map((combo) => {
            const isSelected = combo.id === activeCombo.id;
            const flowTag = combo.flowType === 'sequential_pipeline' ? 'Pipeline' : combo.flowType === 'parallel_swarm' ? 'Swarm' : 'Lead DAG';
            return (
              <button
                key={combo.id}
                type="button"
                onClick={() => onSelectCombo(combo.id)}
                className={clsx(
                  "w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 group",
                  isSelected
                    ? "bg-purple-950/40 border-purple-500/50 text-gray-100 shadow-sm"
                    : "surface-card border-transparent hover:border-white/10 text-gray-300"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-lg bg-white/5 shrink-0">{renderIcon(combo.icon)}</div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate text-gray-200 group-hover:text-white">{combo.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-gray-400">
                      <span className="font-mono text-purple-300">{flowTag}</span>
                      <span>·</span>
                      <span>{combo.subagentIds.length} subagents</span>
                    </div>
                  </div>
                </div>

                {isSelected && <Check size={13} className="text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Action Footer */}
      <div className="pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={onOpenManagement}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors border border-white/5"
        >
          <Settings size={12} />
          <span>Manage & Customize Combos...</span>
        </button>
      </div>
    </div>
  );
};
