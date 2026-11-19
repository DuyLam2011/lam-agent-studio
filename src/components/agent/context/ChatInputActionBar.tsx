import React from 'react';
import { Send, Square } from 'lucide-react';
import clsx from 'clsx';
import { ChatAttachMenu } from './ChatAttachMenu';
import { ChatSkillsMenu } from './ChatSkillsMenu';
import { ChatPromptsMenu } from './ChatPromptsMenu';
import { AgentComboPill } from '../combo/AgentComboPill';
import { ProviderLinkPill } from '../link/ProviderLinkPill';
import { ChatSecurityModeSelector } from '../ChatSecurityModeSelector';
import { ChatReasoningEffortSelector } from './ChatReasoningEffortSelector';
import { ChatDecisionLevelSelector } from './ChatDecisionLevelSelector';
import { ChatToneSelector } from './ChatToneSelector';

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
  return (
    <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/5 flex-wrap">
      {/* Left: Input Modifiers (Context, Skills, Combo, Prompts) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <ChatAttachMenu />
        <ChatSkillsMenu />
        <AgentComboPill />
        <ProviderLinkPill />
        <ChatPromptsMenu onInsertPrompt={onInsertPrompt} />
      </div>

      {/* Right: Decision Level, Tone, Reasoning Effort, Security Mode (Turbo / Supervised / Restricted) & Send / Stop */}
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        <ChatDecisionLevelSelector />
        <ChatToneSelector />
        <ChatReasoningEffortSelector />
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
