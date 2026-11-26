import React from 'react';
import { Bot, Code2, ShieldAlert, Sparkles, Cpu, CheckCircle2, Folder } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { useConversationStore } from '../../store/useConversationStore';

interface ChatEmptyStateProps {
  onSelectPrompt: (text: string) => void;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ onSelectPrompt }) => {
  const { engineSettings, activeFile, systemContext, setActiveWorkspace } = useAgentStore();
  const currentModel = engineSettings.selectedModel || 'gemini-2.5-flash';
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
    <div className="h-full flex flex-col items-center justify-center p-4 space-y-3.5 text-app-muted max-w-sm mx-auto">
      <div className="w-10 h-10 rounded-xl surface-card border border-subtle flex items-center justify-center text-primary shadow-sm">
        <Bot size={20} />
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-xs font-bold text-app-text uppercase tracking-wider">Agents Ready</h3>
        <div className="flex items-center justify-center gap-2 text-[10px] text-app-muted font-mono">
          <span className="flex items-center gap-1"><Cpu size={10} className="text-primary" /> {currentModel}</span>
          {activeWs && <span className="flex items-center gap-1 text-app-sub"><Folder size={10} /> {activeWs.name}</span>}
        </div>
      </div>

      {!activeWs && systemContext.workspaces.length > 0 && (
        <div className="w-full p-2.5 rounded-xl surface-card border border-subtle text-xs text-left space-y-1.5">
          <span className="font-semibold text-app-text text-[10px] block">Select active workspace:</span>
          <div className="flex flex-wrap gap-1.5">
            {systemContext.workspaces.map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setActiveWorkspace(w.id);
                  useConversationStore.getState().switchWorkspaceConversation(w.id, w.folders[0]);
                }}
                className="px-2 py-1 rounded-lg surface-input hover:border-primary/40 text-app-text border border-subtle text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Folder size={11} className="text-primary" /> {w.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="w-full space-y-1.5 pt-1">
        <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block text-left px-1">
          Quick Task Suggestions
        </span>
        {samplePrompts.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(p.text)}
              className="w-full p-2.5 rounded-xl surface-card border border-subtle text-left text-app-sub flex items-start gap-2.5 transition-all group cursor-pointer"
            >
              <Icon size={13} className="text-app-muted shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-app-text block group-hover:text-primary transition-colors">
                  {p.title}
                </span>
                <span className="text-[10px] text-app-muted line-clamp-1">{p.text}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
