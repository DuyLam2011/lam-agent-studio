import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentClassType, AGENT_CLASS_REGISTRY } from '../../../types/agent-class';
import { Building2, Compass, Zap, Sparkles, ChevronUp, Check, LucideIcon } from 'lucide-react';
import clsx from 'clsx';

export const AgentClassPill: React.FC = () => {
  const { activeAgentClass, setActiveAgentClass, addToast } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const items: Array<{ id: AgentClassType | 'auto'; label: string; desc: string; icon: LucideIcon }> = [
    {
      id: 'auto',
      label: 'Father Agent (Auto)',
      desc: 'Father Agent dynamically routes task to optimal agent class',
      icon: Sparkles
    },
    {
      id: 'architecture',
      label: 'Architecture Class',
      desc: AGENT_CLASS_REGISTRY.architecture.description,
      icon: Building2
    },
    {
      id: 'planner',
      label: 'Planner Class',
      desc: AGENT_CLASS_REGISTRY.planner.description,
      icon: Compass
    },
    {
      id: 'executor',
      label: 'Executor Class',
      desc: AGENT_CLASS_REGISTRY.executor.description,
      icon: Zap
    }
  ];

  const currentItem = items.find((i) => i.id === activeAgentClass) || items[0];
  const CurrentIcon = currentItem.icon;

  const handleSelect = (id: AgentClassType | 'auto') => {
    setActiveAgentClass(id);
    setIsOpen(false);
    addToast(`Task Class routed to: ${id.toUpperCase()}`, 'info');
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-medium border transition-all",
          activeAgentClass === 'auto'
            ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30"
            : AGENT_CLASS_REGISTRY[activeAgentClass].bgBadge
        )}
        title="Agent Class Routing. Configures Father Agent and subagents specialization focus."
      >
        <CurrentIcon size={11} />
        <span>{activeAgentClass === 'auto' ? 'Class: Auto' : AGENT_CLASS_REGISTRY[activeAgentClass].name}</span>
        <ChevronUp size={10} className={clsx("transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="surface-dropdown absolute bottom-full mb-1.5 left-0 z-50 w-64 p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 mb-1">
            Agent Class Specialization
          </div>
          <div className="space-y-0.5">
            {items.map(({ id, label, desc, icon: Icon }) => {
              const isSelected = activeAgentClass === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelect(id)}
                  className={clsx(
                    "w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors text-xs",
                    isSelected ? "bg-white/10 text-white font-medium" : "text-gray-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon size={13} className="shrink-0 mt-0.5 text-purple-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>{label}</span>
                      {isSelected && <Check size={11} className="text-purple-400 shrink-0" />}
                    </div>
                    <div className="text-[9.5px] text-gray-400 line-clamp-1 leading-snug">{desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
