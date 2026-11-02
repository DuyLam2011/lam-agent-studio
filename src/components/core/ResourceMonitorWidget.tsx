import React, { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { fetchSystemMetrics } from '../../services/resourceBenchmarkService';
import type { SystemResourceMetrics } from '../../types/benchmark';
import clsx from 'clsx';

export const ResourceMonitorWidget: React.FC = () => {
  const { setBenchmarkModalOpen, isBenchmarkModalOpen } = useAgentStore();
  const [metrics, setMetrics] = useState<SystemResourceMetrics | null>(null);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      const data = await fetchSystemMetrics();
      if (mounted && data) setMetrics(data);
    };
    void poll();
    const timer = setInterval(poll, 3500);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const cpu = metrics?.processCpuPercent ?? 0;
  const ram = metrics?.rssMb ?? 0;
  const isHighCpu = cpu > 60;
  const isHighRam = ram > 600;

  return (
    <button
      type="button"
      onClick={() => setBenchmarkModalOpen(!isBenchmarkModalOpen)}
      title={`Process Resources:\nCPU: ${cpu}%\nRAM: ${ram} MB (Heap: ${metrics?.heapUsedMb ?? 0} MB)\nClick to open Benchmark & Optimizer`}
      className={clsx(
        "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-mono transition-all duration-200 select-none",
        isBenchmarkModalOpen
          ? "border-primary bg-primary/15 text-primary shadow-sm"
          : isHighCpu || isHighRam
          ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
          : "border-border surface-input hover:border-primary/40 text-secondary hover:text-primary"
      )}
    >
      <Cpu size={12} className={clsx(isHighCpu ? "text-amber-400 animate-pulse" : "text-primary")} />
      <span>{cpu}%</span>
      <span className="text-muted">/</span>
      <span>{ram > 0 ? `${ram}MB` : '--'}</span>
    </button>
  );
};
