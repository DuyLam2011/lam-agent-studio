import React, { useState } from 'react';
import { Send, Zap, FileCode, GitCommit, Sparkles, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { useAgentStore, ContextAttachment } from '../../store/useAgentStore';
import { SLASH_COMMANDS } from './agentConstants';

interface ChatInputAreaProps {
  onSendMessage: (text: string) => void;
  isThinking: boolean;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({ onSendMessage, isThinking }) => {
  const { engineSettings, activeFile, contextAttachments, addContextAttachment, addToast } = useAgentStore();
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    onSendMessage(input);
    setInput('');
    setShowCommands(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddActiveFile = () => {
    if (!activeFile?.path) {
      addToast('No active editor file to attach', 'info');
      return;
    }
    const attachment: ContextAttachment = {
      id: Math.random().toString(36).substring(7),
      name: activeFile.name || activeFile.path.split(/[/\\]/).pop() || 'file',
      path: activeFile.path,
      type: 'file',
      tokenEstimate: Math.max(150, Math.ceil((activeFile.content?.length || 0) / 3.8)),
      pinned: true,
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
    <div className="p-3 border-t border-white/10 bg-black/40 space-y-2 shrink-0">
      {/* Context Quick Pills & Slash Commands Bar */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar pb-1 text-[10px]">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleAddActiveFile}
            title={activeFile ? `Attach ${activeFile.name}` : 'No active file'}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
          >
            <FileCode size={11} className="text-cyan-400" />
            <span className="truncate max-w-[90px]">{activeFile?.name || '@ActiveFile'}</span>
          </button>

          <button
            onClick={handleAddGitDiff}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
          >
            <GitCommit size={11} className="text-amber-400" />
            <span>@GitDiff</span>
          </button>

          <button
            onClick={() => setShowCommands(!showCommands)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
          >
            <Sparkles size={11} />
            <span>/Commands</span>
            <ChevronUp size={10} className={clsx("transition-transform", showCommands && "rotate-180")} />
          </button>
        </div>

        {contextAttachments.length > 0 && (
          <span className="text-[9px] text-gray-500 font-mono shrink-0">
            {contextAttachments.length} ctx pinned
          </span>
        )}
      </div>

      {/* Slash Commands Dropdown */}
      {showCommands && (
        <div className="p-1.5 rounded-xl bg-neutral-900 border border-white/10 shadow-2xl space-y-1 mb-2">
          {SLASH_COMMANDS.map((cmd) => (
            <button
              key={cmd.command}
              onClick={() => {
                setInput(cmd.command + ' ');
                setShowCommands(false);
              }}
              className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-primary text-xs font-semibold">{cmd.command}</span>
                <span className="text-[10px] text-gray-400">{cmd.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input Text Box */}
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={engineSettings.mode === 'vibe' ? "Vibe Code prompt... (e.g. 'Refactor and fix all compiler lints')" : "Ask AI coding assistant..."}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-3 pr-10 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none h-14 custom-scrollbar"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isThinking}
          className={clsx(
            "absolute right-2 bottom-2 p-1.5 rounded-lg text-white transition-all shadow-md",
            engineSettings.mode === 'vibe'
              ? "bg-gradient-to-r from-primary to-indigo-600 hover:brightness-110 disabled:opacity-40"
              : "bg-white/10 hover:bg-white/20 disabled:opacity-40"
          )}
          title="Send Prompt (Enter)"
        >
          {engineSettings.mode === 'vibe' ? <Zap size={14} /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
};
