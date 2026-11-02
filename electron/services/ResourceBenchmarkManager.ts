import { app } from 'electron';
import type {
  SystemResourceMetrics,
  ProcessMetricItem,
  BenchmarkReport,
  OptimizationResult,
  MemoryPressureLevel,
} from '../../src/types/benchmark';
import { BenchmarkRunner } from './BenchmarkRunner';

export class ResourceBenchmarkManager {
  private lastCpu = process.cpuUsage();
  private lastCpuTime = Date.now();

  public getSystemMetrics(): SystemResourceMetrics {
    const mem = process.memoryUsage();
    const rssMb = Math.round((mem.rss / 1024 / 1024) * 10) / 10;
    const heapUsedMb = Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10;
    const heapTotalMb = Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10;
    const externalMb = Math.round((mem.external / 1024 / 1024) * 10) / 10;

    const now = Date.now();
    const elapsedUs = Math.max((now - this.lastCpuTime) * 1000, 1000);
    const cpuDiff = process.cpuUsage(this.lastCpu);
    this.lastCpu = process.cpuUsage();
    this.lastCpuTime = now;
    const processCpuPercent = Math.min(Math.round(((cpuDiff.user + cpuDiff.system) / elapsedUs) * 100 * 10) / 10, 100);

    let processes: ProcessMetricItem[] = [];
    let totalAppMemoryMb = rssMb;

    try {
      if (app && typeof app.getAppMetrics === 'function') {
        const metrics = app.getAppMetrics();
        processes = metrics.map((m) => {
          const memMb = Math.round(((m.memory.workingSetSize || 0) / 1024) * 10) / 10;
          return {
            pid: m.pid,
            type: m.type,
            cpuPercent: Math.round((m.cpu?.percentCPUUsage || 0) * 10) / 10,
            memoryMb: memMb,
          };
        });
        totalAppMemoryMb = Math.round(processes.reduce((acc, p) => acc + p.memoryMb, 0) * 10) / 10 || rssMb;
      }
    } catch {
      processes = [{ pid: process.pid, type: 'Main', cpuPercent: processCpuPercent, memoryMb: rssMb }];
    }

    const memoryPressure: MemoryPressureLevel = rssMb > 600 ? 'critical' : rssMb > 300 ? 'moderate' : 'optimal';

    return {
      rssMb,
      heapUsedMb,
      heapTotalMb,
      externalMb,
      processCpuPercent,
      totalAppMemoryMb,
      processCount: processes.length || 1,
      processes,
      memoryPressure,
      uptimeSec: Math.round(process.uptime()),
      timestamp: now,
    };
  }

  public async runBenchmark(): Promise<BenchmarkReport> {
    const currentMetrics = this.getSystemMetrics();
    return BenchmarkRunner.executeSyntheticSuite(currentMetrics.processCpuPercent);
  }

  public optimizeResources(): OptimizationResult {
    const tStart = Date.now();
    const before = process.memoryUsage().heapUsed;

    if (typeof (global as any).gc === 'function') {
      try {
        (global as any).gc();
      } catch {
        // continue
      }
    }

    const after = process.memoryUsage().heapUsed;
    const freedBytes = Math.max(before - after, 0);
    const freedMemoryMb = Math.round((freedBytes / 1024 / 1024) * 10) / 10;

    return {
      freedMemoryMb,
      heapBeforeMb: Math.round((before / 1024 / 1024) * 10) / 10,
      heapAfterMb: Math.round((after / 1024 / 1024) * 10) / 10,
      durationMs: Date.now() - tStart,
      status: 'success',
      details: `Optimization complete in ${Date.now() - tStart}ms. Reclaimed ${freedMemoryMb} MB of heap memory.`,
    };
  }
}

export const resourceBenchmarkManager = new ResourceBenchmarkManager();
