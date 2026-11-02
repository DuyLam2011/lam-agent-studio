import React from 'react';
import { Layers, ShieldCheck, Clock, Sparkles, ChevronDown, CheckCircle2, CircleOff } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

export const AgentComboPill: React.FC = () => {
  const {
    getActiveCombo,
    setAgentsCenterOpen,
    setAgentsCenterTab,
    isComboFlowEnabled,
    toggleComboFlowEnabled
  } = useAgentStore();
  const combo = getActiveCombo();

  const handleOpenCombos = () => {
    setAgentsCenterTab('combos');
    setAgentsCenterOpen(true);
  };

  const renderIcon = () => {
    switch (combo.icon) {
      case 'ShieldCheck':
        return <ShieldCheck size={11} className={isComboFlowEnabled ? "text-emerald-400" : "text-gray-500"} />;
      case 'Clock':
        return <Clock size={11} className={isComboFlowEnabled ? "text-amber-400" : "text-gray-500"} />;
      case 'Sparkles':
        return <Sparkles size={11} className={isComboFlowEnabled ? "text-cyan-400" : "text-gray-500"} />;
      case 'Layers':
      default:
        return <Layers size={11} className={isComboFlowEnabled ? "text-purple-400" : "text-gray-500"} />;
    }
  };

  const flowBadge = combo.flowType === 'sequential_pipeline' ? 'Pipeline' : combo.flowType === 'parallel_swarm' ? 'Swarm' : 'Delegation';

  return (
    <div className={clsx(
      "flex items-center rounded-full border transition-all shadow-sm shrink-0 select-none overflow-hidden",
      isComboFlowEnabled
        ? "bg-purple-950/40 border-purple-500/40 hover:border-purple-500/60 text-gray-200"
        : "bg-white/5 border-white/10 hover:border-white/20 text-gray-400"
    )}>
      <button
        type="button"
        onClick={() => toggleComboFlowEnabled()}
        title={isComboFlowEnabled ? "Combo flow is ACTIVE: subagents will collaborate on each turn. Click to disable." : "Combo flow is DISABLED: Father Agent will answer alone. Click to enable."}
        className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 hover:bg-white/10 transition-colors"
      >
        {renderIcon()}
        {isComboFlowEnabled ? (
          <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
        ) : (
          <CircleOff size={10} className="text-gray-500 shrink-0" />
        )}
      </button>

      <button
        type="button"
        onClick={handleOpenCombos}
        title={`Active Combo: ${combo.name} (${flowBadge} Flow - ${combo.subagentIds.length} subagents). Click to open Agent Combos in Agents Center.`}
        className="flex items-center gap-1.5 pr-2.5 py-1 hover:bg-white/10 transition-colors group"
      >
        <span className={clsx("font-medium text-[10px] truncate max-w-[110px]", isComboFlowEnabled ? "text-purple-200 group-hover:text-white" : "text-gray-400")}>
          {combo.name}
        </span>
        <span className={clsx(
          "px-1.5 py-0.2 rounded-full font-mono text-[9px] font-semibold border",
          isComboFlowEnabled ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-white/5 text-gray-400 border-white/10"
        )}>
          {combo.subagentIds.length}
        </span>
        <ChevronDown size={10} className="text-gray-400 group-hover:text-gray-200 transition-transform" />
      </button>
    </div>
  );
};