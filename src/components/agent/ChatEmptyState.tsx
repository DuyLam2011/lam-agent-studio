import React from 'react';
import { Zap, Code2, ShieldAlert, Sparkles, Cpu, CheckCircle2 } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';

interface ChatEmptyStateProps {
  onSelectPrompt: (text: string) => void;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ onSelectPrompt }) => {
  const { engineSettings, activeFile } = useAgentStore();
  const currentModel = engineSettings.selectedModel || 'gemini-3.5-flash-lite';

  const samplePrompts = [
    {
      title: 'Audit & Refactor Code',
      text: activeFile ? `Review ${activeFile.name} and refactor it for performance, modularity (<150 lines), and strict types.` : 'Inspect the active workspace for architectural bottlenecks and suggest refactoring.',
      icon: Code2,
      color: 'text-primary'
    },
    {
      title: 'Security & Vulnerability Audit',
      text: 'Scan the active file and recent changes for OWASP security risks, unsanitized inputs, and secrets leaks.',
      icon: ShieldAlert,
      color: 'text-rose-400'
    },
    {
      title: 'Generate Unit Tests',
      text: activeFile ? `Write comprehensive TypeScript unit tests covering all functions and edge cases in ${activeFile.name}.` : 'Write comprehensive TypeScript unit tests for core utilities.',
      icon: CheckCircle2,
      color: 'text-emerald-400'
    },
    {
      title: 'Build UI Component',
      text: 'Create a glassmorphic modal component using TailwindCSS, Lucide-React, and TypeScript with dark mode styling.',
      icon: Sparkles,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 space-y-3.5 text-gray-400 max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 via-purple-600/20 to-amber-500/20 border border-white/10 flex items-center justify-center text-primary shadow-2xl">
        <Zap size={22} className="text-amber-400" />
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">AI Coding Agent Ready</h3>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-cyan-300 font-mono">
          <Cpu size={10} />
          <span>Active Model: {currentModel}</span>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="w-full p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400 space-y-1 text-left">
        <span className="font-semibold text-gray-300 text-[10px] block mb-0.5">💡 How to prompt the agent:</span>
        <p className="leading-relaxed">
          1. Click <strong className="text-primary">+ Add Context</strong> below to attach files or line ranges.
        </p>
        <p className="leading-relaxed">
          2. Ask the agent to inspect, edit, or create files.
        </p>
        <p className="leading-relaxed">
          3. Click <strong className="text-purple-300">Review Diff</strong> on tool calls to inspect & accept changes.
        </p>
      </div>

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
              onClick={() => onSelectPrompt(p.text)}
              className="w-full p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-gray-300 flex items-start gap-2.5 transition-colors group"
            >
              <Icon size={14} className={`${p.color} shrink-0 mt-0.5`} />
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-white block group-hover:text-primary transition-colors">
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
