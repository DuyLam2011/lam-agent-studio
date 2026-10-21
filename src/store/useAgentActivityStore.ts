import { create } from 'zustand';
import { AgentActivityStatus, AgentActivityTask, AgentFindingItem, AgentThinkingEntry } from '../types/agent-activity';

interface AgentActivityStore {
  currentTask: AgentActivityTask | null;
  isInspectorOpen: boolean;
  isReviewModalOpen: boolean;
  reviewModalTarget: { repoPath: string; filePath?: string } | null;
  setInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;
  openReviewModal: (repoPath: string, filePath?: string) => void;
  closeReviewModal: () => void;
  startTask: (params: {
    type: AgentActivityTask['type'];
    agentId: string;
    agentName: string;
    agentRole: string;
    title: string;
    targetRepo?: string;
    targetFile?: string;
    status?: AgentActivityStatus;
    terminalBuffer?: string;
  }) => void;
  addThinking: (message: string, type?: AgentThinkingEntry['type']) => void;
  setTaskStatus: (status: AgentActivityStatus) => void;
  addFinding: (finding: Omit<AgentFindingItem, 'id'>) => void;
  completeTask: (summary: string, findings?: AgentFindingItem[], rawOutput?: string) => void;
  failTask: (errorMsg: string) => void;
  clearTask: () => void;
}

export const useAgentActivityStore = create<AgentActivityStore>((set, get) => ({
  currentTask: null,
  isInspectorOpen: false,
  isReviewModalOpen: false,
  reviewModalTarget: null,

  setInspectorOpen: (open) => set({ isInspectorOpen: open }),
  toggleInspector: () => set((s) => ({ isInspectorOpen: !s.isInspectorOpen })),
  openReviewModal: (repoPath, filePath) => set({ isReviewModalOpen: true, reviewModalTarget: { repoPath, filePath } }),
  closeReviewModal: () => set({ isReviewModalOpen: false, reviewModalTarget: null }),

  startTask: (params) => {
    const newTask: AgentActivityTask = {
      id: `task-${Date.now()}`,
      type: params.type,
      agentId: params.agentId,
      agentName: params.agentName,
      agentRole: params.agentRole,
      title: params.title,
      status: params.status || 'thinking',
      startTime: Date.now(),
      targetRepo: params.targetRepo,
      targetFile: params.targetFile,
      terminalBuffer: params.terminalBuffer,
      thinkingStream: [
        {
          id: `th-${Date.now()}-0`,
          timestamp: Date.now(),
          message: `Agent ${params.agentName} assigned to: ${params.title}`,
          type: 'info'
        }
      ],
      findings: [],
      summary: ''
    };
    set({ currentTask: newTask, isInspectorOpen: true });
  },

  addThinking: (message, type = 'reasoning') => {
    const { currentTask } = get();
    if (!currentTask) return;
    const entry: AgentThinkingEntry = {
      id: `th-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      message,
      type
    };
    set({
      currentTask: {
        ...currentTask,
        thinkingStream: [...currentTask.thinkingStream, entry]
      }
    });
  },

  setTaskStatus: (status) => {
    const { currentTask } = get();
    if (!currentTask) return;
    set({ currentTask: { ...currentTask, status } });
  },

  addFinding: (finding) => {
    const { currentTask } = get();
    if (!currentTask) return;
    const item: AgentFindingItem = {
      ...finding,
      id: `find-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    };
    set({
      currentTask: {
        ...currentTask,
        findings: [...currentTask.findings, item]
      }
    });
  },

  completeTask: (summary, findings, rawOutput) => {
    const { currentTask, addThinking } = get();
    if (!currentTask) return;
    addThinking('Task analysis completed successfully.', 'action');
    set({
      currentTask: {
        ...currentTask,
        status: 'completed',
        endTime: Date.now(),
        summary,
        findings: findings || currentTask.findings,
        rawOutput
      }
    });
  },

  failTask: (errorMsg) => {
    const { currentTask, addThinking } = get();
    if (!currentTask) return;
    addThinking(`Task failed: ${errorMsg}`, 'error');
    set({
      currentTask: {
        ...currentTask,
        status: 'error',
        endTime: Date.now(),
        summary: `Error encountered: ${errorMsg}`
      }
    });
  },

  clearTask: () => set({ currentTask: null })
}));
