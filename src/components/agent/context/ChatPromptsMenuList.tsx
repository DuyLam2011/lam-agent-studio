import React from 'react';
import { Shield, Bot } from 'lucide-react';
import { PROMPT_PATTERNS } from '../../../services/chatPromptOptimizerService';
import { SLASH_COMMANDS } from '../agentConstants';

interface ChatPromptsMenuListProps {
  tab: 'prompts' | 'commands' | 'subagents';
  onSelect: (text: string) => void;
}

const QUICK_SUBAGENTS = [
  { tag: '@security-harness', name: 'Security Sentinel', desc: 'OWASP & zero-secrets leak audit' },
  { tag: '@backend-reviewer', name: 'Backend Reviewer', desc: 'Rule 4 (<150 lines) modularity & logic' },
  { tag: '@ui-inspector', name: 'UI & Design Inspector', desc: 'WCAG contrast & responsive tokens' },
  { tag: '@log-analyzer', name: 'Log Diagnostician', desc: 'Callstack & terminal error isolation' }
];

export const ChatPromptsMenuList: React.FC<ChatPromptsMenuListProps> = ({ tab, onSelect }) => {
  return (
    <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1">
      {tab === 'prompts' && (
        PROMPT_PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.template)}
            className="w-full flex items-start gap-2 p-1.5 rounded-lg hover:bg-white/10 text-left transition-colors group"
          >
            <Shield size={12} className="text-primary mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-gray-200 group-hover:text-white truncate">{p.label}</div>
              <div className="text-[9.5px] text-app-muted truncate leading-tight">{p.description}</div>
            </div>
          </button>
        ))
      )}

      {tab === 'commands' && (
        SLASH_COMMANDS.map((cmd) => (
          <button
            key={cmd.command}
            type="button"
            onClick={() => onSelect(cmd.command + ' ')}
            className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-white/10 text-left transition-colors group"
          >
            <span className="font-mono text-primary text-[11px] font-bold">{cmd.command}</span>
            <span className="text-[9.5px] text-app-muted truncate max-w-[150px]">{cmd.description}</span>
          </button>
        ))
      )}

      {tab === 'subagents' && (
        QUICK_SUBAGENTS.map((s) => (
          <button
            key={s.tag}
            type="button"
            onClick={() => onSelect(s.tag + ' ')}
            className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-white/10 text-left transition-colors group"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Bot size={12} className="text-primary shrink-0" />
              <div className="truncate">
                <div className="text-[11px] font-semibold text-gray-200 group-hover:text-white">{s.name}</div>
                <div className="text-[9.5px] text-app-muted truncate">{s.desc}</div>
              </div>
            </div>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 shrink-0">
              {s.tag}
            </span>
          </button>
        ))
      )}
    </div>
  );
};
