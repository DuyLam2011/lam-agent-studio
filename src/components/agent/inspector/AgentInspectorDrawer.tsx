import React, { useState, useEffect } from 'react';
import { useAgentActivityStore } from '../../../store/useAgentActivityStore';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentInspectorHeader } from './AgentInspectorHeader';
import { AgentThinkingStream } from './AgentThinkingStream';
import { AgentFindingsList } from './AgentFindingsList';
import { TerminalLogViewer } from './TerminalLogViewer';
import { Brain, FileCode, Bot, Terminal as TermIcon } from 'lucide-react';
import clsx from 'clsx';

export const AgentInspectorDrawer: React.FC = () => {
  const { isInspectorOpen, currentTask, setInspectorOpen, openReviewModal } = useAgentActivityStore();
  const { systemContext } = useAgentStore();
  const [activeTab, setActiveTab] = useState<'thinking' | 'findings' | 'terminal_log'>('thinking');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInspectorOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setInspectorOpen]);

  useEffect(() => {
    if (currentTask?.type === 'terminal_monitor') {
      setActiveTab('terminal_log');
    }
  }, [currentTask?.id, currentTask?.type]);

  if (!isInspectorOpen) return null;

  const hasTerminalLog = Boolean(currentTask?.terminalBuffer || currentTask?.type === 'terminal_monitor');

  return (
    <div className="fixed top-10 right-0 bottom-0 left-0 z-40 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      {/* Background click to dismiss */}
      <div className="flex-1" onClick={() => setInspectorOpen(false)} />

      {/* Glassmorphic Flyout Drawer - Positioned strictly below TitleBar */}
      <div className="w-full max-w-lg h-full bg-neutral-900/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col z-40 animate-in slide-in-from-right duration-200">
        <AgentInspectorHeader />

        {/* Tab Switcher */}
        <div className="flex items-center px-4 py-2 border-b border-white/5 bg-black/20 gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('thinking')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0",
              activeTab === 'thinking' ? "bg-white/10 text-cyan-300 font-semibold" : "text-gray-400 hover:text-gray-200"
            )}
          >
            <Brain size={12} />
            <span>Thinking Stream</span>
            {currentTask?.thinkingStream?.length ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                {currentTask.thinkingStream.length}
              </span>
            ) : null}
          </button>

          {hasTerminalLog && (
            <button
              onClick={() => setActiveTab('terminal_log')}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0",
                activeTab === 'terminal_log' ? "bg-white/10 text-emerald-300 font-semibold" : "text-gray-400 hover:text-gray-200"
              )}
            >
              <TermIcon size={12} />
              <span>Terminal Log</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('findings')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0",
              activeTab === 'findings' ? "bg-white/10 text-purple-300 font-semibold" : "text-gray-400 hover:text-gray-200"
            )}
          >
            <FileCode size={12} />
            <span>Findings & Fixes</span>
            {currentTask?.findings?.length ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                {currentTask.findings.length}
              </span>
            ) : null}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentTask ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 text-xs space-y-3">
              <Brain size={32} className="opacity-30 text-gray-400" />
              <div>
                <p className="font-medium text-gray-300">Agent Inspector Idle</p>
                <p className="text-[11px] text-gray-500 mt-1 max-w-xs">
                  No active agent task running. You can assign an agent to review code or analyze terminal logs below:
                </p>
              </div>
              <button
                onClick={() => {
                  setInspectorOpen(false);
                  const ws = systemContext.workspaces[0];
                  const repo = ws?.folders?.[0] || systemContext.cwd;
                  if (repo) {
                    openReviewModal(repo);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
              >
                <Bot size={13} className="text-cyan-400" />
                <span>Assign Agent to Review Repo Now</span>
              </button>
            </div>
          ) : activeTab === 'terminal_log' ? (
            <TerminalLogViewer log={currentTask.terminalBuffer || currentTask.rawOutput || ''} />
          ) : activeTab === 'thinking' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                <span>Real-time execution log & reasoning tokens</span>
              </div>
              <AgentThinkingStream entries={currentTask.thinkingStream || []} />
            </div>
          ) : (
            <AgentFindingsList
              summary={currentTask.summary || 'Analysis in progress or no summary generated.'}
              findings={currentTask.findings || []}
            />
          )}
        </div>
      </div>
    </div>
  );
};
