import React from 'react';
import { Layers, Sparkles, ShieldCheck, FileCode } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import {
  addActiveFileToChatContext,
  addSelectionToChatContext,
  triggerExplainInChat,
  triggerReviewInChat
} from '../../services/editorContextService';

export const EditorActionBar: React.FC = () => {
  const { activeFile, editorSelection } = useAgentStore();

  if (!activeFile) return null;

  const fileName = activeFile.name || activeFile.path.split(/[/\\]/).pop() || 'file';
  const hasSelection = !!(editorSelection && editorSelection.text.trim());
  const selectionLinesCount = hasSelection
    ? Math.max(1, editorSelection.endLine - editorSelection.startLine + 1)
    : 0;

  const handleAddContext = () => {
    if (hasSelection && editorSelection) {
      addSelectionToChatContext(editorSelection, activeFile);
    } else {
      addActiveFileToChatContext(activeFile);
    }
  };

  const handleExplain = () => {
    triggerExplainInChat(activeFile, editorSelection);
  };

  const handleReview = () => {
    triggerReviewInChat(activeFile, editorSelection);
  };

  return (
    <div className="flex items-center justify-between px-3 py-1.5 surface-header border-b border-white/5 text-[11px] select-none gap-2 shrink-0">
      {/* File & Selection Status Info */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5 text-app-muted truncate">
          <FileCode size={12} className="text-primary shrink-0" />
          <span className="font-mono text-xs text-app-text truncate max-w-[200px]" title={activeFile.path}>
            {fileName}
          </span>
        </div>

        {hasSelection && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[10px] shrink-0 animate-in fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            L{editorSelection.startLine}-L{editorSelection.endLine} ({selectionLinesCount} lines)
          </span>
        )}
      </div>

      {/* Action Options for Chat Conversation */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleAddContext}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors shadow-sm"
          title={hasSelection ? 'Add selected lines to Chat Context' : 'Add entire file to Chat Context'}
        >
          <Layers size={11} className="text-cyan-400" />
          <span>{hasSelection ? '+ Selection' : '+ Context'}</span>
        </button>

        <button
          onClick={handleExplain}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 transition-colors shadow-sm font-medium"
          title="Explain active file or selection in Chat"
        >
          <Sparkles size={11} />
          <span>Explain</span>
        </button>

        <button
          onClick={handleReview}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors shadow-sm font-medium"
          title="Review code quality, security & modularity in Chat"
        >
          <ShieldCheck size={11} />
          <span>Review</span>
        </button>
      </div>
    </div>
  );
};
