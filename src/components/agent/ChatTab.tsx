import React, { useState, useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import { useAgentStore, ChatMessage } from '../../store/useAgentStore';
import { useConversationStore } from '../../store/useConversationStore';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInputArea } from './ChatInputArea';
import { ChatEmptyState } from './ChatEmptyState';
import { ContextBatchSwarmWidget } from './swarm/ContextBatchSwarmWidget';

const ChatTab: React.FC = () => {
  const {
    chatMessages, addChatMessage, engineSettings, updateEngineSettings, addToast, activeFile,
    systemContext, contextAttachments, activeSkillIdsForChat, getActiveRulesForContext,
    getActiveSkillsForContext, getActiveWorkflowsForContext, getActivePluginsForContext,
    getActiveSubagentsForContext, getActiveMemoriesForContext, setOllamaModalOpen, addAgentDiffSnapshot
  } = useAgentStore();
  const { syncCurrentMessages, securityMode, getActiveConversation } = useConversationStore();
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isThinking]);

  // Sync initial conversation messages if store is fresh
  useEffect(() => {
    const active = getActiveConversation();
    if (active && active.messages && active.messages.length > 0 && chatMessages.length === 0) {
      useAgentStore.setState({ chatMessages: active.messages });
    }
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Math.random().toString(36).substring(7), role: 'user', text, timestamp: Date.now() };
    const currentList = [...chatMessages, userMsg];
    addChatMessage(userMsg);
    syncCurrentMessages(currentList);
    setIsThinking(true);

    try {
      const activeWorkspace = systemContext.workspaces.find(w => w.id === systemContext.activeWorkspaceId);
      const workspacePath = activeWorkspace?.folders?.[0] || systemContext.cwd;
      const wsId = systemContext.activeWorkspaceId || undefined;

      const rules = getActiveRulesForContext(wsId, workspacePath).map(r => ({ name: r.name, scope: r.scope, content: r.content, filePath: r.filePath }));
      const allSkills = getActiveSkillsForContext(wsId, workspacePath);
      const skills = (activeSkillIdsForChat.length > 0 ? allSkills.filter(s => activeSkillIdsForChat.includes(s.name)) : allSkills)
        .map(s => ({ name: s.name, folderName: s.folderName, scope: s.scope, description: s.description, content: s.content }));
      const workflows = getActiveWorkflowsForContext(wsId, workspacePath).map(w => ({ name: w.name, description: w.description, steps: w.steps }));
      const plugins = getActivePluginsForContext(wsId, workspacePath).map(p => ({ name: p.name, description: p.description, toolsExposed: p.toolsExposed }));
      const subagents = getActiveSubagentsForContext(wsId, workspacePath).map(sa => ({ name: sa.name, role: sa.role, systemPrompt: sa.systemPrompt }));
      const memories = getActiveMemoriesForContext(wsId, workspacePath).map(m => ({ title: m.title, category: m.category, content: m.content }));

      const autonomyLevel = securityMode === 'turbo' ? 'autonomous' : (securityMode === 'restricted' ? 'ask-all' : 'balanced');

      // @ts-ignore
      const response = await window.lamApi?.ai?.sendPrompt?.(text, {
        model: engineSettings.selectedModel,
        mode: engineSettings.mode,
        persona: engineSettings.persona,
        autonomyLevel,
        securityMode,
        apiKey: engineSettings.customApiKey,
        provider: engineSettings.provider,
        baseUrl: engineSettings.baseUrl,
        activeFilePath: activeFile?.path,
        workspacePath,
        contextAttachments,
        rules, skills, workflows, plugins, subagents, memories
      });

      if (response) {
        if (response.diffSnapshots && Array.isArray(response.diffSnapshots)) {
          response.diffSnapshots.forEach((snap: any) => addAgentDiffSnapshot(snap));
        }
        const agentMsg: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          role: 'agent',
          text: response.text || 'I processed your request.',
          thinking: response.thinking,
          toolCalls: response.toolCalls,
          timestamp: Date.now()
        };
        addChatMessage(agentMsg);
        syncCurrentMessages([...currentList, agentMsg]);
      }
    } catch (error: any) {
      addToast(error.message || 'Error communicating with AI engine', 'error');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!engineSettings.customApiKey && engineSettings.provider !== 'ollama' && (
        <div className="mx-3 mt-2 p-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/30 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-amber-200 truncate">⚡ Have an API Key? Connect Gemini to activate autonomous agents.</span>
          <button onClick={() => setOllamaModalOpen(true)} className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] shrink-0 transition-colors">
            Enter Key
          </button>
        </div>
      )}

      {engineSettings.persona && (
        <div className="mx-3 mt-1.5 px-2.5 py-1 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Bot size={12} className="text-pink-400 shrink-0" />
            <span className="text-[11px] text-pink-300 font-medium truncate">
              Active Persona: <span className="text-white font-semibold">{engineSettings.persona}</span>
            </span>
          </div>
          <button onClick={() => updateEngineSettings({ persona: undefined })} className="text-[10px] text-gray-400 hover:text-white">
            Reset
          </button>
        </div>
      )}

      {/* Unified Context Batch Swarm */}
      <ContextBatchSwarmWidget />

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {chatMessages.length === 0 ? (
          <ChatEmptyState onSelectPrompt={handleSendMessage} />
        ) : (
          chatMessages.map((msg) => <ChatMessageItem key={msg.id} message={msg} />)
        )}

        {isThinking && (
          <div className="flex gap-2.5 my-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-xs">
              <Bot size={13} />
            </div>
            <div className="surface-card rounded-xl px-3 py-2 flex items-center gap-1.5 shadow-md">
              <span className="text-[11px] text-app-muted font-mono">Synthesizing solution</span>
              <span className="w-1 h-1 bg-primary rounded-full animate-ping" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInputArea onSendMessage={handleSendMessage} isThinking={isThinking} />
    </div>
  );
};

export default ChatTab;
