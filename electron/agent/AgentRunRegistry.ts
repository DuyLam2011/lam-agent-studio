/** Tracks in-flight agent runs so the renderer can cancel them by id. */
export class AgentRunRegistry {
  private runs = new Map<string, AbortController>();

  public start(runId: string): AbortController {
    this.runs.get(runId)?.abort();
    const controller = new AbortController();
    this.runs.set(runId, controller);
    return controller;
  }

  public cancel(runId: string): boolean {
    const controller = this.runs.get(runId);
    if (!controller) return false;
    controller.abort();
    return true;
  }

  public finish(runId: string, controller: AbortController) {
    if (this.runs.get(runId) === controller) this.runs.delete(runId);
  }
}

export const agentRunRegistry = new AgentRunRegistry();
