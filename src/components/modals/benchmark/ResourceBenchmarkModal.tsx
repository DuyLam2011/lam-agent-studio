import React, { useState, useEffect, useCallback } from 'react';
import { X, Cpu, Play, Trash2, Loader2, Sparkles } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import {
  fetchSystemMetrics,
  runBenchmarkSuite,
  triggerMemoryOptimization,
  getAITelemetrySummary,
} from '../../../services/resourceBenchmarkService';
import type { SystemResourceMetrics, BenchmarkReport } from '../../../types/benchmark';
import { BenchmarkMetricsGrid } from './BenchmarkMetricsGrid';
import { BenchmarkReportCard } from './BenchmarkReportCard';

export const ResourceBenchmarkModal: React.FC = () => {
  const { isBenchmarkModalOpen, setBenchmarkModalOpen, addToast } = useAgentStore();
  const [metrics, setMetrics] = useState<SystemResourceMetrics | null>(null);
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const loadMetrics = useCallback(async () => {
    const data = await fetchSystemMetrics();
    if (data) setMetrics(data);
  }, []);

  useEffect(() => {
    if (!isBenchmarkModalOpen) return;
    void loadMetrics();
    const interval = setInterval(loadMetrics, 2500);
    return () => clearInterval(interval);
  }, [isBenchmarkModalOpen, loadMetrics]);

  if (!isBenchmarkModalOpen) return null;

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    try {
      const res = await runBenchmarkSuite();
      if (res) {
        setReport(res);
        addToast(`Benchmark complete: ${res.overallScore}/100 (${res.rating})`, 'success');
      }
    } finally {
      setIsRunning(false);
      void loadMetrics();
    }
  };

  const handleOptimize = async () => {
    setIsCleaning(true);
    try {
      const opt = await triggerMemoryOptimization();
      if (opt) {
        addToast(`Reclaimed ${opt.freedMemoryMb} MB of heap memory`, 'success');
      }
    } finally {
      setIsCleaning(false);
      void loadMetrics();
    }
  };

  const aiAverages = getAITelemetrySummary();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-2xl rounded-2xl surface-modal flex flex-col overflow-hidden max-h-[90vh] shadow-2xl border border-subtle">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-subtle surface-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shadow-sm">
              <Cpu size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-app-text tracking-wide">Resource Telemetry & Benchmark</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">
                  Live CPU & RAM
                </span>
              </div>
              <p className="text-[10px] text-app-sub">Real-time profiling and AI task throughput benchmark</p>
            </div>
          </div>
          <button
            onClick={() => setBenchmarkModalOpen(false)}
            className="p-1 rounded-lg text-app-muted hover:text-app-text hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <BenchmarkMetricsGrid metrics={metrics} aiAverages={aiAverages} />

          {/* Action Toolbar */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunBenchmark}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-[var(--primary-contrast,#ffffff)] font-bold text-xs transition-all shadow-md disabled:opacity-50 active:scale-95"
              >
                {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                <span>{isRunning ? 'Running Benchmark...' : 'Run Benchmark'}</span>
              </button>

              <button
                type="button"
                onClick={handleOptimize}
                disabled={isCleaning}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-subtle surface-card hover:brightness-110 text-app-sub hover:text-app-text text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {isCleaning ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} className="text-rose-400" />}
                <span>Free Memory</span>
              </button>
            </div>

            <div className="text-[10px] font-mono text-app-muted flex items-center gap-1">
              <Sparkles size={11} className="text-primary" /> Auto-optimizing streams
            </div>
          </div>

          {/* Benchmark Results */}
          {report && <BenchmarkReportCard report={report} />}
        </div>
      </div>
    </div>
  );
};
