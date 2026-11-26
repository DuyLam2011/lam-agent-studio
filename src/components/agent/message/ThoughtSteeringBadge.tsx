import React from 'react';
import { Compass, AlertTriangle, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

interface ThoughtSteeringBadgeProps {
  anomalyType: string;
  reason: string;
  correctiveDirective: string;
}

export const ThoughtSteeringBadge: React.FC<ThoughtSteeringBadgeProps> = ({
  anomalyType,
  reason,
  correctiveDirective
}) => {
  const isLoop = anomalyType.includes('LOOP');
  const isHallucination = anomalyType.includes('HALLUCINAT');

  return (
    <div
      className={clsx(
        "rounded-lg border p-2 text-xs transition-all space-y-1 select-none text-app-text",
        isHallucination
          ? "bg-rose-500/10 border-rose-500/35"
          : isLoop
          ? "bg-amber-500/10 border-amber-500/35"
          : "bg-primary/10 border-primary/35"
      )}
    >
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
          {isHallucination ? (
            <ShieldAlert size={13} className="text-rose-500 shrink-0 animate-pulse" />
          ) : isLoop ? (
            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
          ) : (
            <Compass size={13} className="text-primary shrink-0" />
          )}
          <span>⚡ Thought Steering ({anomalyType})</span>
        </div>

        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded surface-input border border-subtle uppercase tracking-wider text-app-muted">
          Auto-Steered
        </span>
      </div>

      <div className="text-[10.5px] leading-relaxed font-mono text-app-sub">
        <span className="font-semibold text-app-text">Reason:</span> {reason}
      </div>

      <div className="text-[10px] pl-2 border-l-2 border-primary/40 italic text-app-muted">
        &ldquo;{correctiveDirective}&rdquo;
      </div>
    </div>
  );
};
