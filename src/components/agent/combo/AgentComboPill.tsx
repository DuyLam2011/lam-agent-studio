import React, { useState, useRef, useEffect } from 'react';
import { Layers, ShieldCheck, Clock, Sparkles, ChevronUp } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { ComboQuickDropdown } from './ComboQuickDropdown';
import clsx from 'clsx';

export const AgentComboPill: React.FC = () => {
  const {
    getActiveCombo,
    agentCombos,
    setActiveCombo,
    setComboModalOpen,
    isComboFlowEnabled,
    toggleComboFlowEnabled
  } = useAgentStore();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const combo = getActiveCombo();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const renderIcon = () => {
    switch (combo.icon) {
      case 'ShieldCheck': return <ShieldCheck size={11} className={isComboFlowEnabled ? "text-emerald-400" : "text-gray-500"} />;
      case 'Clock': return <Clock size={11} className={isComboFlowEnabled ? "text-amber-400" : "text-gray-500"} />;
      case 'Sparkles': return <Sparkles size={11} className={isComboFlowEnabled ? "text-cyan-400" : "text-gray-500"} />;
      default: return <Layers size={11} className={isComboFlowEnabled ? "text-purple-400" : "text-gray-500"} />;
    }
  };

  const handleSelectCombo = (comboId: string) => {
    setActiveCombo(comboId);
    if (!isComboFlowEnabled) {
      toggleComboFlowEnabled(true);
    }
  };

  const handleOpenManagement = () => {
    setIsOpen(false);
    setComboModalOpen(true);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Unified Ergonomic Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={isComboFlowEnabled
          ? `Ensemble Active: ${combo.name} (${combo.subagentIds.length} subagents). Click to configure or toggle.`
          : "Solo Mode (Ensemble Flow is OFF). Click to activate Subagent collaboration."}
        className={clsx(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all shadow-sm select-none cursor-pointer group text-[10.5px]",
          isComboFlowEnabled
            ? "bg-purple-950/40 border-purple-500/40 hover:border-purple-500/60 text-purple-200"
            : "bg-white/5 border-white/10 hover:border-white/20 text-gray-400"
        )}
      >
        <div className="flex items-center gap-1">
          <span className={clsx(
            "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
            isComboFlowEnabled ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-gray-500"
          )} />
          {renderIcon()}
        </div>

        <span className={clsx("font-medium truncate max-w-[130px]", isComboFlowEnabled ? "text-purple-100 group-hover:text-white" : "text-gray-400")}>
          {isComboFlowEnabled ? combo.name : 'Solo Mode'}
        </span>

        {isComboFlowEnabled && (
          <span className="px-1.5 py-0.2 rounded-full font-mono text-[9px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {combo.subagentIds.length}
          </span>
        )}

        <ChevronUp size={10} className={clsx("text-gray-400 group-hover:text-gray-200 transition-transform", !isOpen && "rotate-180")} />
      </button>

      {/* Quick Dropdown Menu */}
      <ComboQuickDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        activeCombo={combo}
        isComboFlowEnabled={isComboFlowEnabled}
        onToggleFlow={() => toggleComboFlowEnabled()}
        agentCombos={agentCombos}
        onSelectCombo={handleSelectCombo}
        onOpenManagement={handleOpenManagement}
      />
    </div>
  );
};
