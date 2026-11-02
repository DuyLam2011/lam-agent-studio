import { create } from 'zustand';

export interface ActiveAgentRun {
  runId: string;
  conversationId: string;
  messageId: string;
  agentRole: string;
  startedAt: number;
  /** Human-readable label of what the agent is doing right now. */
  phaseLabel: string;
}

interface AgentRunState {
  /** True for the whole pipeline (lead run plus any reviewer follow-ups). */
  isBusy: boolean;
  activeRun: ActiveAgentRun | null;
  setBusy: (busy: boolean) => void;
  beginRun: (run: Omit<ActiveAgentRun, 'phaseLabel' | 'startedAt'>) => void;
  setPhaseLabel: (runId: string, label: string) => void;
  endRun: (runId: string) => void;
}

export const useAgentRunStore = create<AgentRunState>((set) => ({
  isBusy: false,
  activeRun: null,
  setBusy: (isBusy) => set({ isBusy }),
  beginRun: (run) => set({ activeRun: { ...run, startedAt: Date.now(), phaseLabel: 'Connecting to model...' } }),
  setPhaseLabel: (runId, phaseLabel) => set((s) => (s.activeRun?.runId === runId ? { activeRun: { ...s.activeRun, phaseLabel } } : s)),
  endRun: (runId) => set((s) => (s.activeRun?.runId === runId ? { activeRun: null } : s))
}));
