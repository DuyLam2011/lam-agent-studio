import React, { useState } from 'react';
import { GitCommit, RotateCcw, Check, Loader2 } from 'lucide-react';
import { ToolCallItem, useAgentStore } from '../../../store/useAgentStore';

export const ToolCallDiffActions: React.FC<{ toolCall: ToolCallItem }> = ({ toolCall }) => {
  const { pendingAgentDiffs, revertAgentDiff, setDiffReviewModalOpen } = useAgentStore();
  const [isReverting, setIsReverting] = useState(false);
  const [isReverted, setIsReverted] = useState(false);

  const isFileTool = toolCall.name === 'write_file' || toolCall.name === 'edit_file' || toolCall.name === 'patch_file';
  if (!isFileTool || toolCall.status !== 'success') {
    return null;
  }

  const targetPath = toolCall.args?.path || toolCall.args?.filePath;
  const matchingDiff = pendingAgentDiffs.find(d => {
    if (!targetPath) return false;
    return d.filePath === targetPath ||
      (d.relativePath && (targetPath.endsWith(d.relativePath) || d.filePath.endsWith(targetPath)));
  });

  const handleRevert = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!matchingDiff || isReverting) return;
    setIsReverting(true);
    try {
      const ok = await revertAgentDiff(matchingDiff.id);
      if (ok) {
        setIsReverted(true);
      }
    } finally {
      setIsReverting(false);
    }
  };

  const handleReviewDiff = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDiffReviewModalOpen(true);
  };

  if (isReverted && !matchingDiff) {
    return (
      <span className="px-2 py-0.5 rounded-md text-[9px] bg-white/5 text-gray-400 font-mono flex items-center gap-1 border border-white/5 shrink-0">
        <Check size={10} className="text-emerald-400" /> Reverted
      </span>
    );
  }

  if (matchingDiff) {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handleRevert}
          disabled={isReverting}
          className="px-2 py-0.5 rounded-md text-[9px] bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-mono flex items-center gap-1 transition-colors border border-rose-500/30 shrink-0"
          title={`Revert ${matchingDiff.relativePath} to original state`}
        >
          {isReverting ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
          Revert
        </button>
        <button
          type="button"
          onClick={handleReviewDiff}
          className="px-2 py-0.5 rounded-md text-[9px] bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 font-mono flex items-center gap-1 transition-colors border border-purple-500/30 shrink-0"
          title="Review file changes and diff"
        >
          <GitCommit size={10} /> Review Diff
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleReviewDiff}
      className="px-2 py-0.5 rounded-md text-[9px] bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 font-mono flex items-center gap-1 transition-colors border border-purple-500/30 shrink-0"
      title="Review file changes and diff"
    >
      <GitCommit size={10} /> Review Diff
    </button>
  );
};
