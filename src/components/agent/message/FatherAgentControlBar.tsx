import React from 'react';
import { Bot, Square, Compass, FileSearch, GitBranch, ShieldAlert, Network } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { cancelActiveRun } from '../../../services/agent-chat/agentRunService';

interface FatherAgentControlBarProps {
  isLive: boolean;
  model?: string;
}

const formatModelBadge = (m?: string) => {
  if (!m) return 'Active Engine';
  if (/gpt-6/i.test(m)) return 'gpt-4o';
  if (/gemini-3\.5/i.test(m)) return 'gemini-2.5-flash';
  return m;
};

export const FatherAgentControlBar: React.FC<FatherAgentControlBarProps> = ({ isLive, model }) => {
  const { setPendingChatPrompt, addToast } = useAgentStore();

  const handleSteer = (directive: string) => {
    setPendingChatPrompt(`[Father Agent Steer]: ${directive}`);
    addToast(`Loaded directive: ${directive}`, 'info');
  };

  const handleStop = async () => {
    await cancelActiveRun();
    addToast('Cancelled agent execution', 'info');
  };

  return (
    <div className="rounded-lg surface-card border border-subtle p-2 flex flex-col gap-1.5 shadow-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <Bot size={12} className="text-primary shrink-0" />
          <span className="text-[10.5px] font-semibold text-app-text">Lead Coordinator</span>
          <span className="text-[9.5px] text-app-muted font-mono">({formatModelBadge(model)})</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono surface-panel text-app-sub border border-subtle">
            Context Isolation
          </span>
        </div>

        {isLive && (
          <button
            type="button"
            onClick={handleStop}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[10px] font-semibold transition-colors cursor-pointer"
            title="Cancel active agent execution"
          >
            <Square size={9} fill="currentColor" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 pt-0.5 flex-wrap text-[9.5px]">
        <span className="text-app-muted flex items-center gap-1 shrink-0 select-none">
          <Compass size={10} className="text-primary" />
          <span>Steer:</span>
        </span>

        <button
          type="button"
          onClick={() => handleSteer('Decompose task into structured Subagent task contracts (DAG)')}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded surface-panel hover:bg-primary/10 text-app-sub hover:text-app-text border border-subtle transition-colors cursor-pointer"
        >
          <Network size={9} />
          <span>Orchestrate (DAG)</span>
        </button>

        <button
          type="button"
          onClick={() => handleSteer('Ground assertions with real file contents using read_file')}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded surface-panel hover:bg-primary/10 text-app-sub hover:text-app-text border border-subtle transition-colors cursor-pointer"
        >
          <FileSearch size={9} />
          <span>Inspect Files</span>
        </button>

        <button
          type="button"
          onClick={() => handleSteer('Verify git diff and run regression tests')}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded surface-panel hover:bg-primary/10 text-app-sub hover:text-app-text border border-subtle transition-colors cursor-pointer"
        >
          <GitBranch size={9} />
          <span>Verify Git</span>
        </button>

        <button
          type="button"
          onClick={() => handleSteer('Strictly enforce Rule 4: Modular architecture, each file <= 150 lines')}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded surface-panel hover:bg-primary/10 text-app-sub hover:text-app-text border border-subtle transition-colors cursor-pointer"
        >
          <ShieldAlert size={9} />
          <span>Enforce Rule 4</span>
        </button>
      </div>
    </div>
  );
};
