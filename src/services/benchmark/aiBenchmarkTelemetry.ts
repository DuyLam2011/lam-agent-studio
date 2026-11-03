import type { AITaskTelemetry } from '../../types/benchmark';

class AIBenchmarkTelemetryTracker {
  private activeRuns = new Map<string, {
    startTime: number;
    ttftTime?: number;
    tokenCount: number;
    model: string;
    provider: string;
  }>();

  private history: AITaskTelemetry[] = [];
  private readonly MAX_HISTORY = 20;

  public startTask(runId: string, model: string = 'Gemini', provider: string = 'gemini'): void {
    this.activeRuns.set(runId, {
      startTime: Date.now(),
      tokenCount: 0,
      model,
      provider,
    });
  }

  public recordToken(runId: string, charCount: number = 4): void {
    const run = this.activeRuns.get(runId);
    if (!run) return;
    if (!run.ttftTime) {
      run.ttftTime = Date.now();
    }
    // Approximate ~4 chars per token if delta is string
    run.tokenCount += Math.max(Math.round(charCount / 4), 1);
  }

  public finishTask(runId: string, peakMemoryMb: number = 0, cpuPeakPercent: number = 0): AITaskTelemetry | null {
    const run = this.activeRuns.get(runId);
    if (!run) return null;
    this.activeRuns.delete(runId);

    const now = Date.now();
    const taskDurationMs = Math.max(now - run.startTime, 1);
    const ttftMs = run.ttftTime ? Math.max(run.ttftTime - run.startTime, 1) : taskDurationMs;
    const tokensPerSec = Math.round((run.tokenCount / (taskDurationMs / 1000)) * 10) / 10;

    const record: AITaskTelemetry = {
      runId,
      model: run.model,
      provider: run.provider,
      taskDurationMs,
      ttftMs,
      totalTokens: run.tokenCount,
      tokensPerSec,
      peakMemoryMb,
      cpuPeakPercent,
      timestamp: now,
    };

    this.history.unshift(record);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.pop();
    }

    return record;
  }

  public getRecentHistory(): AITaskTelemetry[] {
    return [...this.history];
  }

  public getAverages(): { avgTtftMs: number; avgTps: number; totalCompleted: number } {
    if (this.history.length === 0) {
      return { avgTtftMs: 0, avgTps: 0, totalCompleted: 0 };
    }
    const sumTtft = this.history.reduce((acc, h) => acc + h.ttftMs, 0);
    const sumTps = this.history.reduce((acc, h) => acc + h.tokensPerSec, 0);
    return {
      avgTtftMs: Math.round(sumTtft / this.history.length),
      avgTps: Math.round((sumTps / this.history.length) * 10) / 10,
      totalCompleted: this.history.length,
    };
  }

  public clearHistory(): void {
    this.history = [];
    this.activeRuns.clear();
  }
}

export const aiBenchmarkTelemetry = new AIBenchmarkTelemetryTracker();
