import React, { useState } from 'react';
import { Sparkles, Search, Download, Copy, Check, FileText } from 'lucide-react';
import clsx from 'clsx';
import { useAgentStore } from '../../../store/useAgentStore';
import { useConversationStore } from '../../../store/useConversationStore';
import { calculateChatTokenUsage } from '../../../services/agent-chat/chatFilterService';
import {
  exportConversationAsMarkdown,
  downloadChatTranscript
} from '../../../services/agent-chat/chatExportService';

interface ChatContextBudgetBarProps {
  isSearchOpen: boolean;
  onToggleSearch: () => void;
}

export const ChatContextBudgetBar: React.FC<ChatContextBudgetBarProps> = ({
  isSearchOpen,
  onToggleSearch
}) => {
  const chatMessages = useAgentStore((s) => s.chatMessages);
  const selectedModel = useAgentStore((s) => s.engineSettings.selectedModel);
  const addToast = useAgentStore((s) => s.addToast);
  const { getActiveConversation } = useConversationStore();

  const [copied, setCopied] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const analytics = calculateChatTokenUsage(chatMessages, selectedModel);

  const handleCopyMarkdown = () => {
    const conv = getActiveConversation();
    const md = exportConversationAsMarkdown(conv, chatMessages);
    navigator.clipboard.writeText(md);
    setCopied(true);
    addToast('Conversation copied as Markdown', 'success');
    setTimeout(() => setCopied(false), 2000);
    setIsExportMenuOpen(false);
  };

  const handleDownload = (format: 'md' | 'json') => {
    const conv = getActiveConversation();
    const md = exportConversationAsMarkdown(conv, chatMessages);
    downloadChatTranscript(conv?.title || 'Chat_Transcript', md, format);
    addToast(`Exported transcript (${format.toUpperCase()})`, 'success');
    setIsExportMenuOpen(false);
  };

  if (chatMessages.length === 0) return null;

  return (
    <div className="mx-3 my-1 px-2.5 py-1 rounded-lg bg-black/20 border border-white/5 flex items-center justify-between gap-2 text-[10.5px] select-none shrink-0 relative z-20">
      {/* Left: Token Analytics & Context Saturation */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1 text-primary font-medium shrink-0">
          <Sparkles size={11} className="text-primary animate-pulse" />
          <span>~{analytics.formattedTokens}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-app-muted shrink-0">
          <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden shrink-0">
            <div
              className={clsx(
                "h-full rounded-full transition-all duration-300",
                analytics.percentOfContextWindow > 80 ? "bg-rose-500" :
                analytics.percentOfContextWindow > 50 ? "bg-amber-400" : "bg-primary"
              )}
              style={{ width: `${Math.max(4, analytics.percentOfContextWindow)}%` }}
            />
          </div>
          <span className="text-[9.5px] font-mono text-gray-400">{analytics.percentOfContextWindow}%</span>
        </div>

        <span className="text-gray-500 font-mono hidden md:inline">• {analytics.messageCount} msgs</span>
      </div>

      {/* Right: Search & Export Controls */}
      <div className="flex items-center gap-1 shrink-0 relative">
        <button
          type="button"
          onClick={onToggleSearch}
          className={clsx(
            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors border",
            isSearchOpen
              ? "bg-primary/20 text-primary border-primary/40 font-semibold"
              : "text-app-muted hover:text-app-text border-transparent hover:bg-white/5"
          )}
          title="Search in current chat (Ctrl+F)"
        >
          <Search size={10} />
          <span>Search</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-app-muted hover:text-app-text hover:bg-white/5 transition-colors"
            title="Export chat transcript"
          >
            <Download size={10} />
            <span className="hidden sm:inline">Export</span>
          </button>

          {isExportMenuOpen && (
            <div className="surface-dropdown absolute right-0 mt-1 w-44 p-1 z-50 flex flex-col gap-0.5 shadow-xl animate-in fade-in duration-100">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-white/5 text-gray-300 hover:text-white"
              >
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>Copy as Markdown</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload('md')}
                className="flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-white/5 text-gray-300 hover:text-white"
              >
                <FileText size={11} className="text-primary" />
                <span>Save as Markdown (.md)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
