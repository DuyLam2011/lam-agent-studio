import React from 'react';
import { Cpu, HardDrive, Zap, Activity } from 'lucide-react';
import type { SystemResourceMetrics } from '../../../types/benchmark';
import clsx from 'clsx';

interface BenchmarkMetricsGridProps {
  metrics: SystemResourceMetrics | null;
  aiAverages: { avgTtftMs: number; avgTps: number; totalCompleted: number };
}

export const BenchmarkMetricsGrid: React.FC<BenchmarkMetricsGridProps> = ({ metrics, aiAverages }) => {
  const pressureColor = (level?: string) => {
    switch (level) {
      case 'critical': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'moderate': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
      {/* CPU */}
      <div className="surface-card border border-subtle rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-secondary text-[11px]">
          <span>Process CPU</span>
          <Cpu size={13} className="text-primary" />
        </div>
        <div className="mt-2">
          <div className="text-lg font-bold text-primary font-mono">
            {metrics?.processCpuPercent ?? 0}%
          </div>
          <span className="text-[10px] text-muted">{metrics?.processCount ?? 1} active processes</span>
        </div>
      </div>

      {/* RAM */}
      <div className="surface-card border border-subtle rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-secondary text-[11px]">
          <span>App Memory (RSS)</span>
          <HardDrive size={13} className="text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="text-lg font-bold text-primary font-mono">
            {metrics?.rssMb ?? 0} <span className="text-xs font-normal text-secondary">MB</span>
          </div>
          <span className="text-[10px] text-muted">Heap: {metrics?.heapUsedMb ?? 0} MB</span>
        </div>
      </div>

      {/* AI Speed (TPS) */}
      <div className="surface-card border border-subtle rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-secondary text-[11px]">
          <span>AI Streaming TPS</span>
          <Zap size={13} className="text-amber-400" />
        </div>
        <div className="mt-2">
          <div className="text-lg font-bold text-primary font-mono">
            {aiAverages.avgTps > 0 ? aiAverages.avgTps : '--'} <span className="text-xs font-normal text-secondary">tps</span>
          </div>
          <span className="text-[10px] text-muted">TTFT: {aiAverages.avgTtftMs > 0 ? `${aiAverages.avgTtftMs}ms` : '--'}</span>
        </div>
      </div>

      {/* Memory Pressure */}
      <div className="surface-card border border-subtle rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-secondary text-[11px]">
          <span>Memory Pressure</span>
          <Activity size={13} className="text-purple-400" />
        </div>
        <div className="mt-2">
          <span className={clsx("inline-block px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase border", pressureColor(metrics?.memoryPressure))}>
            {metrics?.memoryPressure ?? 'Optimal'}
          </span>
          <div className="text-[10px] text-muted mt-1">Uptime: {metrics?.uptimeSec ?? 0}s</div>
        </div>
      </div>
    </div>
  );
};
