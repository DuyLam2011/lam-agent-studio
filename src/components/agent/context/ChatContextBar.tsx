import React from 'react';
import { Plus, FileCode, GitCommit, Sparkles, X, ChevronUp, Zap, MousePointerClick } from 'lucide-react';
import { useAgentStore, ContextAttachment } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface ChatContextBarProps {
  showCommands: boolean;
  setShowCommands: (show: boolean) => void;
}

export const ChatContextBar: React.FC<ChatContextBarProps> = ({ showCommands, setShowCommands }) => {
  const {
    activeFile,
    contextAttachments,
    removeContextAttachment,
    addContextAttachment,
    setAddContextModalOpen,
    setSkillSelectorModalOpen,
    activeSkillIdsForChat,
    addToast
  } = useAgentStore();

  const handleAddActiveFile = () => {
    if (!activeFile?.path) {
      addToast('No active editor file to attach', 'info');
      return;
    }
    const attachment: ContextAttachment = {
      id: `ctx-${Date.now()}`,
      name: activeFile.name || activeFile.path.split(/[/\\]/).pop() || 'file',
      path: activeFile.path,
      type: 'file',
      tokenEstimate: Math.max(150, Math.ceil((activeFile.content?.length || 0) / 3.8)),
      pinned: true,
      snippet: activeFile.content ? activeFile.content.slice(0, 4000) : undefined
    };
    addContextAttachment(attachment);
    addToast(`Attached ${attachment.name} to AI context`, 'success');
  };

  const handleAddGitDiff = () => {
    const attachment: ContextAttachment = {
      id: 'git-diff-ctx',
      name: 'Uncommitted Git Diff',
      path: 'git:diff',
      type: 'diff',
      tokenEstimate: 420,
      pinned: true,
    };
    addContextAttachment(attachment);
    addToast('Attached Git Diff to context', 'success');
  };

  return (
    <div className="space-y-1.5 pb-1 text-[10px]">
      {/* Context Chips Carousel */}
      {contextAttachments.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
          {contextAttachments.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/10 border border-white/10 text-gray-200 shrink-0 group"
            >
              {item.type === 'snippet' ? (
                <MousePointerClick size={10} className="text-purple-400" />
              ) : item.type === 'diff' ? (
                <GitCommit size={10} className="text-amber-400" />
              ) : (
                <FileCode size={10} className="text-cyan-400" />
              )}
              <span className="font-mono text-[10px] font-medium max-w-[130px] truncate" title={item.path}>
                {item.name}
              </span>
              <span className="text-[9px] text-gray-500 font-mono">~{item.tokenEstimate}t</span>
              <button
                type="button"
                onClick={() => removeContextAttachment(item.id)}
                className="text-gray-400 hover:text-rose-400 ml-0.5 transition-colors"
                title="Remove Context"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons Toolbar */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setAddContextModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-medium transition-colors shadow-sm"
          >
            <Plus size={11} />
            <span>Add Context</span>
          </button>

          <button
            type="button"
            onClick={handleAddActiveFile}
            title={activeFile ? `Attach ${activeFile.name}` : 'No active file'}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
          >
            <FileCode size={11} className="text-cyan-400" />
            <span className="truncate max-w-[80px]">{activeFile?.name || '@ActiveFile'}</span>
          </button>

          <button
            type="button"
            onClick={handleAddGitDiff}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
          >
            <GitCommit size={11} className="text-amber-400" />
            <span>@GitDiff</span>
          </button>

          <button
            type="button"
            onClick={() => setSkillSelectorModalOpen(true)}
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors",
              activeSkillIdsForChat.length > 0
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300 font-medium"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200"
            )}
          >
            <Zap size={11} className="text-amber-400" />
            <span>Skills ({activeSkillIdsForChat.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCommands(!showCommands)}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
          >
            <Sparkles size={11} className="text-indigo-400" />
            <span>/Commands</span>
            <ChevronUp size={10} className={clsx("transition-transform", showCommands && "rotate-180")} />
          </button>
        </div>
      </div>
    </div>
  );
};
