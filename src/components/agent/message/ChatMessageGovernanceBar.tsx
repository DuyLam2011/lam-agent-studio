import React, { useState } from 'react';
import { AlertTriangle, Zap, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { ChatMessage, useAgentStore } from '../../../store/useAgentStore';

interface GovernanceBarProps {
  message: ChatMessage;
}

export const ChatMessageGovernanceBar: React.FC<GovernanceBarProps> = ({ message }) => {
  const { setActiveAgentClass, addToast } = useAgentStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const skills = message.activeSkills || [];
  const rules = message.appliedRules || [];
  const warning = message.classMismatchWarning;

  if (!warning && skills.length === 0 && rules.length === 0) return null;

  const handleResetToFatherAgent = () => {
    setActiveAgentClass('auto');
    addToast('Father Agent Auto restored (Automatic Class Routing)', 'success');
  };

  return (
    <div className="space-y-1.5 my-1.5 font-sans">
      {warning && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-app-text text-xs shadow-sm flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <div className="font-bold text-[11px] text-amber-500 uppercase tracking-wide">
                Agent Class Mismatch Warning
              </div>
              <p className="text-[11px] leading-relaxed text-app-sub">{warning}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetToFatherAgent}
            className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 text-[10px] font-semibold border border-amber-500/30 shrink-0 transition-colors cursor-pointer"
          >
            Switch to Auto
          </button>
        </div>
      )}

      {(skills.length > 0 || rules.length > 0) && (
        <div className="p-2 rounded-xl surface-input border border-subtle text-[10.5px]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              {skills.length > 0 && (
                <div className="flex items-center gap-1 text-primary">
                  <Zap size={11} className="shrink-0" />
                  <span className="font-semibold text-[10px] uppercase tracking-wider">Skills:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {skills.slice(0, isExpanded ? skills.length : 2).map((s) => (
                      <span key={s} className="px-1.5 py-0.2 rounded-md bg-primary/15 text-primary border border-primary/25 font-mono text-[9px]">
                        {s}
                      </span>
                    ))}
                    {!isExpanded && skills.length > 2 && (
                      <span className="text-[9px] text-app-muted font-mono">+{skills.length - 2}</span>
                    )}
                  </div>
                </div>
              )}

              {rules.length > 0 && (
                <div className="flex items-center gap-1 text-emerald-500">
                  <ShieldCheck size={11} className="shrink-0" />
                  <span className="font-semibold text-[10px] uppercase tracking-wider">Rules:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {rules.slice(0, isExpanded ? rules.length : 2).map((r) => (
                      <span key={r} className="px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 font-mono text-[9px] truncate max-w-[130px]">
                        {r}
                      </span>
                    ))}
                    {!isExpanded && rules.length > 2 && (
                      <span className="text-[9px] text-app-muted font-mono">+{rules.length - 2}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {(skills.length > 2 || rules.length > 2) && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-app-muted hover:text-app-text p-0.5 rounded transition-colors"
                title={isExpanded ? "Collapse list" : "View all active skills and rules"}
              >
                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
