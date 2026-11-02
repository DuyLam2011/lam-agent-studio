import type { ThoughtIntervention, TurnAnalysisContext } from './ThoughtSteeringTypes';

export class ThoughtSteeringEngine {
  public static detectThoughtLoop(allThinking: string): { isLoop: boolean; phrase?: string } {
    if (!allThinking || allThinking.length < 120) return { isLoop: false };
    const sentences = allThinking.split(/[.\n!?]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.split(' ').length >= 5);
    const counts = new Map<string, number>();

    for (const s of sentences) {
      const key = s.slice(0, 60);
      const c = (counts.get(key) || 0) + 1;
      counts.set(key, c);
      if (c >= 3) {
        return { isLoop: true, phrase: s.slice(0, 45) };
      }
    }
    return { isLoop: false };
  }

  public static detectToolStagnation(executedHistory: any[], currentCalls: any[]): { isStagnant: boolean; signature?: string } {
    if (executedHistory.length < 2) return { isStagnant: false };
    const recent = executedHistory.slice(-3);
    const allFailed = recent.length >= 2 && recent.every((t) => t.status === 'failed');
    if (allFailed) {
      const sameName = recent.every((t) => t.name === recent[0].name);
      if (sameName) {
        return { isStagnant: true, signature: `${recent[0].name} (failed consecutively ${recent.length} times)` };
      }
    }

    if (currentCalls.length >= 1 && executedHistory.length >= 2) {
      const last = executedHistory[executedHistory.length - 1];
      const prev = executedHistory[executedHistory.length - 2];
      const curr = currentCalls[0];
      if (curr.name === prev.name && curr.args?.path === prev.args?.path && last.name !== curr.name) {
        return { isStagnant: true, signature: `Oscillating between ${curr.name} and ${last.name}` };
      }
    }
    return { isStagnant: false };
  }

  public static detectHallucinatedClaim(ctx: TurnAnalysisContext): { isHallucinating: boolean; claimedFile?: string } {
    if (ctx.toolCalls.length > 0) return { isHallucinating: false };
    const combined = `${ctx.currentText}\n${ctx.currentThinkingChunk}`.toLowerCase();
    const claimRegex = /(?:i have (?:edited|modified|updated|created|written|deleted)|đã (?:chỉnh sửa|cập nhật|thêm|sửa|xóa))\s+(?:file|the file|tệp)?\s*`?([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)`?/i;
    const match = combined.match(claimRegex);
    if (!match) return { isHallucinating: false };

    const claimedFile = match[1];
    const actuallyModified = ctx.executedHistory.some((t) =>
      (t.name === 'edit_file' || t.name === 'write_file') &&
      t.status === 'success' &&
      JSON.stringify(t.args).toLowerCase().includes(claimedFile.toLowerCase())
    );

    if (!actuallyModified) {
      return { isHallucinating: true, claimedFile };
    }
    return { isHallucinating: false };
  }

  public static evaluateTurn(ctx: TurnAnalysisContext): ThoughtIntervention | null {
    const loop = this.detectThoughtLoop(ctx.allThinking);
    if (loop.isLoop) {
      return {
        anomalyType: 'THOUGHT_LOOP',
        reason: `Repetitive circular thinking detected: "${loop.phrase}..."`,
        correctiveDirective: 'You are caught in a repetitive reasoning loop. Break out immediately. Stop re-hypothesizing: execute a concrete tool (e.g. read_file, inspect_git_status) or formulate your final conclusion now.'
      };
    }

    const stagnation = this.detectToolStagnation(ctx.executedHistory, ctx.toolCalls);
    if (stagnation.isStagnant) {
      return {
        anomalyType: 'TOOL_STAGNATION',
        reason: `Tool execution stagnation: ${stagnation.signature}`,
        correctiveDirective: `Repeated tool failures detected with ${stagnation.signature}. Change your approach or fallback to inspect_git_status/list_workspace instead of retrying the same arguments.`
      };
    }

    const hallucination = this.detectHallucinatedClaim(ctx);
    if (hallucination.isHallucinating && ctx.turn < ctx.maxTurns - 1) {
      return {
        anomalyType: 'HALLUCINATED_CLAIM',
        reason: `Hallucinated file edit: Claimed to have modified '${hallucination.claimedFile}' without executing edit_file/write_file`,
        correctiveDirective: `You stated that you modified '${hallucination.claimedFile}', but NO modification tool was executed. You MUST call 'edit_file' or 'write_file' now to apply actual changes to disk.`,
        forceNextTurn: true
      };
    }

    return null;
  }
}
