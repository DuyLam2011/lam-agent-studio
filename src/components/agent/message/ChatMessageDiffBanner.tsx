import React, { useState } from 'react';
import { GitCommit, RotateCcw, Check, Loader2 } from 'lucide-react';
import { ChatMessage, useAgentStore } from '../../../store/useAgentStore';

export const ChatMessageDiffBanner: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const { pendingAgentDiffs, revertAllAgentDiffs, setDiffReviewModalOpen } = useAgentStore();
  const [isReverting, setIsReverting] = useState(false);
  const [hasReverted, setHasReverted] = useState(false);

  const relevantPendingDiffs = pendingAgentDiffs.filter(p => {
    if (message.diffSnapshots?.some(s => s.id === p.id || s.filePath === p.filePath)) {
      return true;
    }
    return message.toolCalls?.some(tc => {
      const pth = tc.args?.path || tc.args?.filePath;
      return pth && (p.filePath === pth || p.filePath.endsWith(pth) || pth.endsWith(p.relativePath));
    });
  });

  const handleRevertAll = async () => {
    if (isReverting || relevantPendingDiffs.length === 0) return;
    setIsReverting(true);
    try {
      const targetIds = relevantPendingDiffs.map(d => d.id);
      const success = await revertAllAgentDiffs(targetIds);
      if (success) {
        setHasReverted(true);
      }
    } finally {
      setIsReverting(false);
    }
  };

  if (hasReverted && relevantPendingDiffs.length === 0) {
    return (
      <div className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-2 text-[11px] text-emerald-300">
        <Check size={12} className="text-emerald-400 shrink-0" />
        <span>All code changes from this step have been reverted to original state.</span>
      </div>
    );
  }

  if (relevantPendingDiffs.length === 0) {
    return null;
  }

  return (
    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-[11px] text-purple-200">
        <GitCommit size={13} className="text-purple-400 shrink-0" />
        <span>
          Agent modified <strong className="text-purple-100 font-semibold">{relevantPendingDiffs.length}</strong> {relevantPendingDiffs.length === 1 ? 'file' : 'files'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleRevertAll}
          disabled={isReverting}
          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 font-medium text-[10px] transition-colors shadow-sm flex items-center gap-1"
          title="Revert all changes made by this agent step back to original state"
        >
          {isReverting ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
          <span>Revert Changes ({relevantPendingDiffs.length})</span>
        </button>
        <button
          onClick={() => setDiffReviewModalOpen(true)}
          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-[10px] transition-colors shadow-sm"
        >
          Review Diffs
        </button>
      </div>
    </div>
  );
};
