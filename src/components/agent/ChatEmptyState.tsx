import React from 'react';
import { Bot, Code2, ShieldAlert, Sparkles, Cpu, CheckCircle2, Folder } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { useConversationStore } from '../../store/useConversationStore';

interface ChatEmptyStateProps {
  onSelectPrompt: (text: string) => void;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ onSelectPrompt }) => {
  const { engineSettings, activeFile, systemContext, setActiveWorkspace } = useAgentStore();
  const currentModel = engineSettings.selectedModel || 'gemini-3.5-flash-lite';
  const activeWs = systemContext.workspaces.find(w => w.id === systemContext.activeWorkspaceId);

  const samplePrompts = [
    {
      title: 'Audit & Refactor Code',
      text: activeFile ? `Review ${activeFile.name} and refactor it for performance, modularity (<150 lines), and strict types.` : 'Inspect the active workspace for architectural bottlenecks and suggest refactoring.',
      icon: Code2
    },
    {
      title: 'Security & Vulnerability Audit',
      text: 'Scan the active file and recent changes for OWASP security risks, unsanitized inputs, and secrets leaks.',
      icon: ShieldAlert
    },
    {
      title: 'Generate Unit Tests',
      text: activeFile ? `Write comprehensive TypeScript unit tests covering all functions and edge cases in ${activeFile.name}.` : 'Write comprehensive TypeScript unit tests for core utilities.',
      icon: CheckCircle2
    },
    {
      title: 'Build UI Component',
      text: 'Create a glassmorphic or minimal component using TailwindCSS, Lucide-React, and TypeScript with clean tokens.',
      icon: Sparkles
    }
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 space-y-3.5 text-gray-400 max-w-sm mx-auto">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-sm">
        <Bot size={20} className="text-gray-300" />
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Agents Ready</h3>
        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-mono">
          <span className="flex items-center gap-1"><Cpu size={10} /> {currentModel}</span>
          {activeWs && <span className="flex items-center gap-1 text-gray-300"><Folder size={10} /> {activeWs.name}</span>}
        </div>
      </div>

      {!activeWs && systemContext.workspaces.length > 0 && (
        <div className="w-full p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-left space-y-1.5">
          <span className="font-semibold text-gray-300 text-[10px] block">Select active workspace:</span>
          <div className="flex flex-wrap gap-1.5">
            {systemContext.workspaces.map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setActiveWorkspace(w.id);
                  useConversationStore.getState().switchWorkspaceConversation(w.id, w.folders[0]);
                }}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-[10px] font-medium flex items-center gap-1 transition-colors"
              >
                <Folder size={11} /> {w.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Prompts */}
      <div className="w-full space-y-1.5 pt-1">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block text-left px-1">
          Quick Task Suggestions
        </span>
        {samplePrompts.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(p.text)}
              className="w-full p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-left text-gray-300 flex items-start gap-2.5 transition-colors group"
            >
              <Icon size={13} className="text-gray-400 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-white block group-hover:text-primary transition-colors">
                  {p.title}
                </span>
                <span className="text-[10px] text-gray-400 line-clamp-1">{p.text}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
