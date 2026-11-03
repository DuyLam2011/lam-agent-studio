import React from 'react';
import { FolderGit2, X } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { resolveActiveRepoScope } from '../../../services/workspace/activeRepoScopeResolver';
import { ChatContextChip } from './ChatContextChip';

export const ChatContextTray: React.FC = () => {
  const {
    contextAttachments, removeContextAttachment, clearContextAttachments,
    activeFile, systemContext, activeRepoPath
  } = useAgentStore();

  const repoScope = resolveActiveRepoScope({
    workspaces: systemContext.workspaces,
    activeWorkspaceId: systemContext.activeWorkspaceId,
    contextAttachments,
    activeFilePath: activeFile?.path,
    activeRepoPath,
    fallbackCwd: systemContext.cwd
  });

  if (contextAttachments.length === 0 && !repoScope.isMultiRepo) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-[10px]">
      {repoScope.isMultiRepo && (
        <div
          title={`Target Scope: ${repoScope.repoName} (${repoScope.repoRoot}) - Resolved from ${repoScope.resolutionSource}`}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 font-mono shrink-0 shadow-sm"
        >
          <FolderGit2 size={10} className="text-cyan-400" />
          <span className="font-semibold">{repoScope.repoName}</span>
          <span className="text-[9px] text-cyan-400/70">({repoScope.tag})</span>
        </div>
      )}

      {contextAttachments.map((item) => (
        <ChatContextChip key={item.id} item={item} onRemove={removeContextAttachment} />
      ))}

      {contextAttachments.length >= 2 && (
        <button
          type="button"
          onClick={clearContextAttachments}
          className="px-1.5 py-0.5 rounded text-[9px] text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 flex items-center gap-0.5"
          title="Clear all attachments"
        >
          <X size={9} /> <span>Clear</span>
        </button>
      )}
    </div>
  );
};
