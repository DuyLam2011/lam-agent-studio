import React from 'react';
import { Plus, FileCode, GitCommit, Sparkles, ChevronUp, Zap, FolderGit2 } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { resolveWorkspaceRepoInfo } from '../../../services/workspace/workspaceRepoResolver';
import { resolveActiveRepoScope } from '../../../services/workspace/activeRepoScopeResolver';
import { ChatContextChip } from './ChatContextChip';
import { AgentComboPill } from '../combo/AgentComboPill';
import clsx from 'clsx';

interface ChatContextBarProps {
  showCommands: boolean;
  setShowCommands: (show: boolean) => void;
}

export const ChatContextBar: React.FC<ChatContextBarProps> = ({ showCommands, setShowCommands }) => {
  const {
    activeFile, contextAttachments, removeContextAttachment, systemContext,
    addContextAttachment, setAddContextModalOpen, setSkillSelectorModalOpen,
    activeSkillIdsForChat, addToast, activeRepoPath
  } = useAgentStore();

  const repoScope = resolveActiveRepoScope({
    workspaces: systemContext.workspaces,
    activeWorkspaceId: systemContext.activeWorkspaceId,
    contextAttachments,
    activeFilePath: activeFile?.path,
    activeRepoPath,
    fallbackCwd: systemContext.cwd
  });

  const handleAddActiveFile = () => {
    if (!activeFile?.path) {
      addToast('No active editor file to attach', 'info');
      return;
    }
    const name = activeFile.name || activeFile.path.split(/[/\\]/).pop() || 'file';
    const info = resolveWorkspaceRepoInfo(activeFile.path, systemContext.workspaces, systemContext.activeWorkspaceId, systemContext.cwd);
    addContextAttachment({
      id: `ctx-${Date.now()}`,
      name,
      path: activeFile.path,
      relativePath: activeFile.path,
      rootPath: info.rootPath,
      workspaceRepoTag: info.tag,
      type: 'file',
      tokenEstimate: Math.max(150, Math.ceil((activeFile.content?.length || 0) / 3.8)),
      pinned: true,
      snippet: activeFile.content ? activeFile.content.slice(0, 4000) : undefined
    });
    addToast(`Attached ${name} (${info.tag}) to AI context`, 'success');
  };

  const handleAddGitDiff = () => {
    addContextAttachment({
      id: 'git-diff-ctx',
      name: 'Uncommitted Git Diff',
      path: 'git:diff',
      type: 'diff',
      tokenEstimate: 420,
      pinned: true,
    });
    addToast('Attached Git Diff to context', 'success');
  };

  return (
    <div className="space-y-1.5 pb-1 text-[10px]">
      {contextAttachments.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
          {contextAttachments.map((item) => (
            <ChatContextChip key={item.id} item={item} onRemove={removeContextAttachment} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setAddContextModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-medium transition-colors shadow-sm"
          >
            <Plus size={11} /> <span>Add Context</span>
          </button>

          <button
            type="button"
            onClick={handleAddActiveFile}
            title={activeFile ? `Attach ${activeFile.name}` : 'No active file'}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
          >
            <FileCode size={11} className="text-gray-400" />
            <span className="truncate max-w-[80px]">{activeFile?.name || '@ActiveFile'}</span>
          </button>

          <button
            type="button"
            onClick={handleAddGitDiff}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
          >
            <GitCommit size={11} className="text-gray-400" /> <span>@GitDiff</span>
          </button>

          <button
            type="button"
            onClick={() => setSkillSelectorModalOpen(true)}
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors",
              activeSkillIdsForChat.length > 0
                ? "bg-white/15 border-white/20 text-white font-medium"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200"
            )}
          >
            <Zap size={11} className="text-gray-400" />
            <span>Skills ({activeSkillIdsForChat.filter(id => !['code_review', 'security_audit', 'skill-code-review', 'skill-security-audit'].includes(id)).length || activeSkillIdsForChat.length})</span>
          </button>

          {repoScope.isMultiRepo && (
            <div
              title={`Active Scope: ${repoScope.repoName} (${repoScope.repoRoot}) - Source: ${repoScope.resolutionSource}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono shrink-0 shadow-sm"
            >
              <FolderGit2 size={11} className="text-cyan-400" />
              <span className="font-semibold">{repoScope.repoName}</span>
              <span className="text-[9px] text-cyan-400/70">({repoScope.tag})</span>
            </div>
          )}

          <AgentComboPill />

          <button
            type="button"
            onClick={() => setShowCommands(!showCommands)}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
          >
            <Sparkles size={11} className="text-gray-400" />
            <span>/Commands</span>
            <ChevronUp size={10} className={clsx("transition-transform", showCommands && "rotate-180")} />
          </button>
        </div>
      </div>
    </div>
  );
};
