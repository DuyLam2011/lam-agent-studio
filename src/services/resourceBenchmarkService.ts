import type {
  SystemResourceMetrics,
  BenchmarkReport,
  OptimizationResult,
} from '../types/benchmark';
import { aiBenchmarkTelemetry } from './aiBenchmarkTelemetry';

export const fetchSystemMetrics = async (): Promise<SystemResourceMetrics | null> => {
  if (typeof window === 'undefined' || !window.lamApi?.system?.getMetrics) {
    return null;
  }
  try {
    return await window.lamApi.system.getMetrics();
  } catch (err) {
    console.warn('Failed to fetch system metrics:', err);
    return null;
  }
};

export const runBenchmarkSuite = async (): Promise<BenchmarkReport | null> => {
  if (typeof window === 'undefined' || !window.lamApi?.system?.runBenchmark) {
    return null;
  }
  try {
    return await window.lamApi.system.runBenchmark();
  } catch (err) {
    console.error('Failed to run benchmark suite:', err);
    return null;
  }
};

export const triggerMemoryOptimization = async (): Promise<OptimizationResult | null> => {
  if (typeof window === 'undefined' || !window.lamApi?.system?.optimizeResources) {
    return null;
  }
  try {
    return await window.lamApi.system.optimizeResources();
  } catch (err) {
    console.error('Failed to optimize resources:', err);
    return null;
  }
};

export const getAITelemetrySummary = () => {
  return aiBenchmarkTelemetry.getAverages();
};

export const getAITelemetryHistory = () => {
  return aiBenchmarkTelemetry.getRecentHistory();
};
