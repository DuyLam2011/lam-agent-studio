import React, { useEffect } from 'react';
import { Bot, X, Shield, Sparkles, Terminal, Plus } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { SubagentPersona } from '../../types/subagents';
import { runAgentReview } from '../../services/agentReviewService';
import clsx from 'clsx';

interface GitAgentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  filePath?: string;
}

export const GitAgentReviewModal: React.FC<GitAgentReviewModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  filePath
}) => {
  const { subagentPersonas, addToast, openCreateAgentModal } = useAgentStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSelectAgent = (agent: SubagentPersona) => {
    onClose();
    addToast(`Agent ${agent.name} assigned to review diff`, 'info');
    runAgentReview({ repoPath, filePath, agent });
  };

  const handleOpenCreate = () => {
    onClose();
    openCreateAgentModal({ repoPath, filePath, autoRunReview: true });
  };

  const getAgentIcon = (id: string) => {
    if (id.includes('security')) return <Shield size={16} className="text-emerald-400" />;
    if (id.includes('devops') || id.includes('terminal')) return <Terminal size={16} className="text-amber-400" />;
    if (id.includes('reviewer') || id.includes('cavecrew')) return <Sparkles size={16} className="text-cyan-400" />;
    return <Bot size={16} className="text-purple-400" />;
  };

  const targetLabel = filePath ? filePath.split(/[/\\]/).pop() : repoPath.split(/[/\\]/).pop();

  return (
    <div
      className="fixed inset-0 top-10 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-cyan-400" />
            <div>
              <h3 className="text-xs font-bold text-white">Assign Agent to Review</h3>
              <p className="text-[10px] text-gray-400 truncate max-w-[280px]">
                Target: <span className="text-gray-200 font-mono">{targetLabel}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
            <X size={14} />
          </button>
        </div>

        {/* Subagent Selection List */}
        <div className="p-4 space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
          {subagentPersonas.length === 0 ? (
            <div className="text-center py-6 px-3 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">No Agents Created Yet</h4>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                  Create your first custom AI agent to inspect and review code diffs.
                </p>
              </div>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all inline-flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>+ Create Review Agent</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1 px-1">
                <span>Select an agent persona to review git diff:</span>
                <button
                  onClick={handleOpenCreate}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <Plus size={12} /> New Agent
                </button>
              </div>
              {subagentPersonas.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className={clsx(
                    "w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left group",
                    "bg-white/[0.03] hover:bg-white/10 border-white/5 hover:border-cyan-400/30"
                  )}
                >
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0 group-hover:scale-105 transition-transform">
                    {getAgentIcon(agent.id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {agent.name}
                      </h4>
                      <span className="text-[9px] font-mono text-gray-500 uppercase bg-white/5 px-1.5 py-0.5 rounded">
                        {agent.reasoningEffort} reasoning
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{agent.role}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-gray-500">
                      <span className="text-gray-300 font-mono">Model: {agent.model}</span>
                      <span>•</span>
                      <span>Skills: {agent.allowedSkills.length}</span>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
