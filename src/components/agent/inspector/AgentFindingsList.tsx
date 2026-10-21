import React from 'react';
import { AgentFindingItem } from '../../../types/agent-activity';
import { useAgentActivityStore } from '../../../store/useAgentActivityStore';
import { ShieldAlert, Zap, CheckCircle, AlertTriangle, Copy, MessageSquarePlus, Play, Loader2 } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface AgentFindingsListProps {
  summary: string;
  findings: AgentFindingItem[];
}

export const AgentFindingsList: React.FC<AgentFindingsListProps> = ({ summary, findings }) => {
  const { currentTask } = useAgentActivityStore();
  const { addToast, addChatMessage, setRightPanelTab, setPanelVisible } = useAgentStore();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard', 'success');
  };

  const handleSendToChat = (item: AgentFindingItem) => {
    const prompt = `Please help address this review finding:\n\n**${item.title}**\n${item.description}\n\nSuggested Fix:\n${item.suggestion || 'Please provide an automated patch.'}`;
    addChatMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      text: prompt
    });
    setRightPanelTab('chat');
    setPanelVisible('agent', true);
    addToast('Sent finding to AI Chat', 'info');
  };

  const getCategoryBadge = (category: AgentFindingItem['category']) => {
    switch (category) {
      case 'security': return { icon: ShieldAlert, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case 'performance': return { icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'bug': return { icon: AlertTriangle, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
      default: return { icon: CheckCircle, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    }
  };

  const isWorking = currentTask?.status === 'thinking' || currentTask?.status === 'reviewing_git';

  if (isWorking && (!findings || findings.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-2">
        <Loader2 size={24} className="animate-spin text-primary" />
        <p className="text-xs font-semibold text-gray-200">Analyzing code changes...</p>
        <p className="text-[11px] text-gray-500">Structured findings will appear here upon completion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {summary && (
        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-purple-300 text-[11px] uppercase tracking-wide">Analysis Summary</span>
            <button
              onClick={() => handleCopy(summary)}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10"
              title="Copy Summary"
            >
              <Copy size={11} />
            </button>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed text-gray-300">{summary}</p>
        </div>
      )}

      {findings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">Findings & Recommendations</h4>
          {findings.map((item) => {
            const badge = getCategoryBadge(item.category);
            const Icon = badge.icon;
            return (
              <div key={item.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={clsx("p-1 rounded-md border", badge.color)}>
                      <Icon size={12} />
                    </span>
                    <span className="text-xs font-semibold text-white">{item.title}</span>
                  </div>
                  <button
                    onClick={() => handleSendToChat(item)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/20 text-primary text-[10px] hover:bg-primary/30 transition-colors"
                    title="Send this finding to AI Chat"
                  >
                    <MessageSquarePlus size={10} /> Fix with AI
                  </button>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{item.description}</p>
                {item.suggestion && (
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5 font-mono text-[11px] text-emerald-300 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-gray-500 block text-[9px] uppercase font-bold mb-0.5">Suggestion / Command:</span>
                      <span className="truncate block select-text">{item.suggestion}</span>
                    </div>
                    <button
                      onClick={() => {
                        // @ts-ignore
                        window.lamApi?.terminal?.write('term-main', item.suggestion + '\r\n');
                        addToast(`Sent command to Terminal: ${item.suggestion}`, 'success');
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] shrink-0 border border-emerald-500/30 flex items-center gap-1 font-sans transition-colors"
                      title="Execute this command in Terminal"
                    >
                      <Play size={10} /> Run Command
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
