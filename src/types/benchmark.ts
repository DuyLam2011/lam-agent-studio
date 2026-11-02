export type MemoryPressureLevel = 'optimal' | 'moderate' | 'critical';

export interface ProcessMetricItem {
  pid: number;
  type: string;
  cpuPercent: number;
  memoryMb: number;
}

export interface SystemResourceMetrics {
  rssMb: number;
  heapUsedMb: number;
  heapTotalMb: number;
  externalMb: number;
  processCpuPercent: number;
  totalAppMemoryMb: number;
  processCount: number;
  processes: ProcessMetricItem[];
  memoryPressure: MemoryPressureLevel;
  uptimeSec: number;
  timestamp: number;
}

export interface BenchmarkStepResult {
  name: string;
  durationMs: number;
  throughput: number;
  unit: string;
  status: 'passed' | 'warning' | 'failed';
  score: number;
}

export interface BenchmarkReport {
  id: string;
  timestamp: number;
  overallScore: number; // 0 - 100
  rating: 'EXCELLENT' | 'GOOD' | 'NEEDS_OPTIMIZATION';
  contextLatencyMs: number;
  streamingTps: number;
  memoryDeltaMb: number;
  memoryRecoveryPercent: number;
  cpuPeakPercent: number;
  steps: BenchmarkStepResult[];
  summary: string;
  recommendations: string[];
}

export interface OptimizationResult {
  freedMemoryMb: number;
  heapBeforeMb: number;
  heapAfterMb: number;
  durationMs: number;
  status: 'success' | 'partial';
  details: string;
}

export interface AITaskTelemetry {
  runId: string;
  model: string;
  provider: string;
  taskDurationMs: number;
  ttftMs: number;
  totalTokens: number;
  tokensPerSec: number;
  peakMemoryMb: number;
  cpuPeakPercent: number;
  timestamp: number;
}
