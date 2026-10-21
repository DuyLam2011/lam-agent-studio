import React, { useState, useEffect, useRef } from 'react';
import { Bot, Zap, Code2, ShieldAlert } from 'lucide-react';
import { useAgentStore, ChatMessage } from '../../store/useAgentStore';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInputArea } from './ChatInputArea';

const ChatTab: React.FC = () => {
  const {
    chatMessages, addChatMessage, engineSettings, updateEngineSettings, addToast, activeFile, systemContext,
    getActiveRulesForContext, getActiveSkillsForContext, getActiveWorkflowsForContext,
    getActivePluginsForContext, getActiveSubagentsForContext, getActiveMemoriesForContext,
    setOllamaModalOpen
  } = useAgentStore();
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        rules, skills, workflows, plugins, subagents, memories
      });

      if (response) {
        addChatMessage({
          id: Math.random().toString(36).substring(7),
          role: 'agent',
          text: response.text || 'I processed your request.',
          thinking: response.thinking,
          toolCalls: response.toolCalls,
          timestamp: Date.now()
        });
      }
    } catch (error: any) {
      addToast(error.message || 'Error communicating with AI engine', 'error');
    } finally {
      setIsThinking(false);
    }
  };

  const samplePrompts = [
    { text: 'Scan active repository for architectural bottlenecks', icon: Code2, color: 'text-primary' },
    { text: 'Run comprehensive TypeScript strictness & OWASP audit', icon: ShieldAlert, color: 'text-emerald-400' }
  ];

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
          <button
            onClick={() => updateEngineSettings({ persona: undefined })}
            className="text-[10px] text-gray-400 hover:text-white"
            title="Reset to default Core Agent"
          >
            Reset
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3 text-gray-400">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-primary shadow-xl">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Vibecoding Agent Ready</h3>
              <p className="text-[11px] text-gray-500 max-w-[220px]">Autonomous coding engine. Select a mode or run a task.</p>
            </div>
            <div className="w-full space-y-1.5 pt-1">
              {samplePrompts.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button key={idx} onClick={() => handleSendMessage(p.text)} className="w-full p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-left text-gray-300 flex items-center gap-2 transition-colors">
                    <Icon size={13} className={p.color} />
                    <span className="truncate">{p.text}</span>
                  </button>
                );
              })}
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

      <ChatInputArea onSendMessage={handleSendMessage} isThinking={isThinking} />
    </div>
  );
};

export default ChatTab;
