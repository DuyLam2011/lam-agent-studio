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
        "rounded-lg border p-2 text-xs transition-all space-y-1 select-none",
        isHallucination
          ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
          : isLoop
          ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
          : "bg-cyan-950/30 border-cyan-500/40 text-cyan-200"
      )}
    >
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
          {isHallucination ? (
            <ShieldAlert size={13} className="text-rose-400 shrink-0 animate-pulse" />
          ) : isLoop ? (
            <AlertTriangle size={13} className="text-amber-400 shrink-0" />
          ) : (
            <Compass size={13} className="text-cyan-400 shrink-0" />
          )}
          <span>⚡ Điều Hướng Suy Nghĩ ({anomalyType})</span>
        </div>

        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10 uppercase tracking-wider">
          Auto-Steered
        </span>
      </div>

      <div className="text-[10.5px] opacity-90 leading-relaxed font-mono">
        <span className="font-semibold text-white/90">Nguyên nhân:</span> {reason}
      </div>

      <div className="text-[10px] pl-2 border-l border-white/20 italic opacity-85">
        &ldquo;{correctiveDirective}&rdquo;
      </div>
    </div>
  );
};
