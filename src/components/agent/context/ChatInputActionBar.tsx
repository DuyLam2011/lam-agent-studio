import React from 'react';
import { Send, Square, Zap } from 'lucide-react';
import clsx from 'clsx';
import { useAgentStore } from '../../../store/useAgentStore';
import { ChatAttachMenu } from './ChatAttachMenu';
import { ChatPromptsMenu } from './ChatPromptsMenu';
import { AgentComboPill } from '../combo/AgentComboPill';
import { ChatSecurityModeSelector } from '../ChatSecurityModeSelector';

interface ChatInputActionBarProps {
  onInsertPrompt: (text: string) => void;
  onSendMessage: () => void;
  onStop?: () => void;
  isThinking: boolean;
  hasInput: boolean;
}

export const ChatInputActionBar: React.FC<ChatInputActionBarProps> = ({
  onInsertPrompt,
  onSendMessage,
  onStop,
  isThinking,
  hasInput
}) => {
  const { setSkillSelectorModalOpen, activeSkillIdsForChat } = useAgentStore();

  return (
    <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/5 flex-wrap">
      {/* Left: Input Modifiers (Context, Skills, Combo, Prompts) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <ChatAttachMenu />

        <button
          type="button"
          onClick={() => setSkillSelectorModalOpen(true)}
          className={clsx(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-medium border transition-all",
            activeSkillIdsForChat.length > 0
              ? "bg-primary/20 border-primary/40 text-primary font-semibold shadow-sm"
              : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
          )}
          title={`Active Skills (${activeSkillIdsForChat.filter(id => !['code_review', 'security_audit', 'skill-code-review', 'skill-security-audit'].includes(id)).length || activeSkillIdsForChat.length}). Click to manage specialized skills.`}
        >
          <Zap size={11} className={activeSkillIdsForChat.length > 0 ? "text-primary" : "text-gray-400"} />
          <span>Skills</span>
          {activeSkillIdsForChat.length > 0 && (
            <span className="px-1 rounded-full text-[9px] bg-primary text-white font-mono leading-tight">
              {activeSkillIdsForChat.filter(id => !['code_review', 'security_audit', 'skill-code-review', 'skill-security-audit'].includes(id)).length || activeSkillIdsForChat.length}
            </span>
          )}
        </button>

        <AgentComboPill />

        <ChatPromptsMenu onInsertPrompt={onInsertPrompt} />
      </div>

      {/* Right: Engine Settings (Security Mode, Send/Stop) */}
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        <ChatSecurityModeSelector dropUp={true} compact={true} />

        {isThinking && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="p-1.5 rounded-lg text-white transition-all shadow bg-rose-500 hover:bg-rose-600 border border-rose-400/30"
            title="Stop the agent run"
          >
            <Square size={12} fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSendMessage}
            disabled={!hasInput || isThinking}
            className={clsx(
              "flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-medium transition-all shadow",
              "bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:hover:bg-primary"
            )}
            title="Send Prompt (Enter)"
          >
            <Send size={12} />
            <span>Send</span>
          </button>
        )}
      </div>
    </div>
  );
};
