import React, { useState, useEffect, useRef } from 'react';
import { Bot, Zap, Code2, ShieldAlert } from 'lucide-react';
import { useAgentStore, ChatMessage, ToolCallItem } from '../../store/useAgentStore';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInputArea } from './ChatInputArea';

const ChatTab: React.FC = () => {
  const {
    chatMessages, addChatMessage, engineSettings, addToast, activeFile, systemContext,
    getActiveRulesForContext, getActiveSkillsForContext, getActiveWorkflowsForContext,
    getActivePluginsForContext, getActiveSubagentsForContext, getActiveMemoriesForContext
  } = useAgentStore();
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isThinking]);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Math.random().toString(36).substring(7), role: 'user', text, timestamp: Date.now() };
    addChatMessage(userMsg);
    setIsThinking(true);

    try {
      const activeWorkspace = systemContext.workspaces.find(w => w.id === systemContext.activeWorkspaceId);
      const workspacePath = activeWorkspace?.folders?.[0] || systemContext.cwd;
      const wsId = systemContext.activeWorkspaceId || undefined;

      const rules = getActiveRulesForContext(wsId, workspacePath).map(r => ({ name: r.name, scope: r.scope, content: r.content, filePath: r.filePath }));
      const skills = getActiveSkillsForContext(wsId, workspacePath).map(s => ({ name: s.name, folderName: s.folderName, scope: s.scope, description: s.description, content: s.content }));
      const workflows = getActiveWorkflowsForContext(wsId, workspacePath).map(w => ({ name: w.name, description: w.description, steps: w.steps }));
      const plugins = getActivePluginsForContext(wsId, workspacePath).map(p => ({ name: p.name, description: p.description, toolsExposed: p.toolsExposed }));
      const subagents = getActiveSubagentsForContext(wsId, workspacePath).map(sa => ({ name: sa.name, role: sa.role, systemPrompt: sa.systemPrompt }));
      const memories = getActiveMemoriesForContext(wsId, workspacePath).map(m => ({ title: m.title, category: m.category, content: m.content }));

      // @ts-ignore
      const response = await window.lamApi?.ai?.sendPrompt?.(text, {
        model: engineSettings.selectedModel,
        mode: engineSettings.mode,
        persona: engineSettings.persona,
        autonomyLevel: engineSettings.autonomyLevel,
        apiKey: engineSettings.customApiKey,
        provider: engineSettings.provider,
        baseUrl: engineSettings.baseUrl,
        activeFilePath: activeFile?.path,
        workspacePath,
        rules,
        skills,
        workflows,
        plugins,
        subagents,
        memories,
      });

      if (response) {
        const agentMsg: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          role: 'agent',
          text: response.text || 'Action executed successfully.',
          thinking: response.thinking,
          toolCalls: response.toolCalls as ToolCallItem[],
          timestamp: Date.now(),
        };
        addChatMessage(agentMsg);
      }
    } catch (err: any) {
      addToast('Error communicating with AI engine', 'error');
      addChatMessage({
        id: Math.random().toString(36).substring(7),
        role: 'agent',
        text: 'Error communicating with AI backend. Please verify your connection.',
        timestamp: Date.now(),
      });
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4 text-gray-400">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-primary shadow-xl">
              <Zap size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Vibecoding Agent Ready</h3>
              <p className="text-[11px] text-gray-500 max-w-[220px]">
                Autonomous coding engine. Select a mode or run an immediate task.
              </p>
            </div>

            <div className="w-full space-y-1.5 pt-2">
              <button
                onClick={() => handleSendMessage('Scan active repository for architectural bottlenecks and suggest refactors')}
                className="w-full p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-left text-gray-300 flex items-center gap-2 transition-colors"
              >
                <Code2 size={13} className="text-primary shrink-0" />
                <span className="truncate">Scan for architectural bottlenecks</span>
              </button>
              <button
                onClick={() => handleSendMessage('Run comprehensive TypeScript strictness & OWASP security audit')}
                className="w-full p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-left text-gray-300 flex items-center gap-2 transition-colors"
              >
                <ShieldAlert size={13} className="text-emerald-400 shrink-0" />
                <span className="truncate">Run TypeScript & OWASP audit</span>
              </button>
            </div>
          </div>
        ) : (
          chatMessages.map((msg) => <ChatMessageItem key={msg.id} message={msg} />)
        )}

        {isThinking && (
          <div className="flex gap-2.5 my-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center text-xs">
              <Bot size={13} />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-1.5 shadow-md">
              <span className="text-[11px] text-gray-400 font-mono">Synthesizing solution</span>
              <span className="w-1 h-1 bg-primary rounded-full animate-ping" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInputArea onSendMessage={handleSendMessage} isThinking={isThinking} />
    </div>
  );
};

export default ChatTab;
