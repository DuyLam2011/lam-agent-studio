import React, { useState } from 'react';
import { AlertTriangle, Undo2, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

export interface ActionWarningProps {
  title?: string;
  category: 'database' | 'credentials' | 'system_command' | 'core_config' | 'high_complexity' | 'none';
  target: string;
  description: string;
  riskLevel?: 'low' | 'medium' | 'high';
  diffId?: string;
  autoApproved?: boolean;
}

export const ActionWarningNote: React.FC<ActionWarningProps> = ({
  title,
  category,
  target,
  description,
  riskLevel = 'medium',
  diffId,
  autoApproved = true,
}) => {
  const { revertAgentDiff, pendingAgentDiffs, addToast } = useAgentStore();
  const [expanded, setExpanded] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const hasDiff = Boolean(diffId && pendingAgentDiffs.some((d) => d.id === diffId));

  const handleRevert = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!diffId) return;
    setIsReverting(true);
    const success = await revertAgentDiff(diffId);
    setIsReverting(false);
    if (success) addToast(`Reverted changes for: ${target}`, 'info');
  };

  const isHighRisk = riskLevel === 'high';

  return (
    <div
      className={clsx(
        "my-2 rounded-xl border p-3 text-xs transition-all select-none",
        isHighRisk
          ? "bg-rose-950/25 border-rose-500/30 text-rose-200"
          : "bg-amber-950/20 border-amber-500/30 text-amber-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={clsx(
              "p-1.5 rounded-lg shrink-0 mt-0.5",
              isHighRisk ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400"
            )}
          >
            <AlertTriangle size={15} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-white tracking-wide">
                {title || 'High-Risk / Sensitive Operation Notice'}
              </span>
              <span
                className={clsx(
                  "px-1.5 py-0.2 rounded font-mono text-[9px] uppercase border",
                  isHighRisk
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                    : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                )}
              >
                {category.replace('_', ' ')}
              </span>
              {autoApproved && (
                <span className="flex items-center gap-1 text-[9.5px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.2 rounded">
                  <ShieldCheck size={11} /> Auto-Approved
                </span>
              )}
            </div>

            <p className="text-[11px] text-app-sub leading-relaxed mb-1.5">{description}</p>
            <div className="text-[10px] font-mono text-app-muted truncate max-w-md">
              Target: <span className="text-app-text">{target}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasDiff && (
            <button
              type="button"
              disabled={isReverting}
              onClick={handleRevert}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-500 transition-colors cursor-pointer"
              title="Restore original file state"
            >
              <Undo2 size={12} />
              <span>{isReverting ? 'Reverting...' : 'Revert'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg text-app-muted hover:text-app-text transition-colors cursor-pointer"
            title="Security details"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-subtle text-[10.5px] text-app-muted space-y-1 font-sans">
          <div>
            • <strong>Safeguard Policy:</strong> Authorized automatically per your Turbo/Guarded configuration in Setting Center.
          </div>
          <div>
            • <strong>Security Check:</strong> FileSecurityHarness verified target paths remain inside the Workspace Sandbox boundary.
          </div>
          <div>
            • <strong>Rollback:</strong> Patch tracked in SurgicalPatchEngine and can be reverted anytime using the Revert button above.
          </div>
        </div>
      )}
    </div>
  );
};
