import React from 'react';
import { Bot, Key, Zap, Sparkles, Terminal } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';

export const ChatTopAlerts: React.FC = () => {
  const { engineSettings, updateEngineSettings, setOllamaModalOpen } = useAgentStore();

  return (
    <>
      {!engineSettings.customApiKey && engineSettings.provider !== 'ollama' && engineSettings.provider !== 'antigravity' && engineSettings.provider !== 'codex' && engineSettings.provider !== 'claudecode' && (
        <div className="mx-3 mt-2 p-2 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-gray-300 truncate flex items-center gap-1.5">
            <Key size={12} className="text-gray-400 shrink-0" />
            <span>Configure AI API Key or connect Google/Codex/Claude in Account Center.</span>
          </span>
          <button
            type="button"
            onClick={() => setOllamaModalOpen(true)}
            className="px-2 py-0.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[10px] font-medium shrink-0 transition-colors"
          >
            Configure
          </button>
        </div>
      )}

      {engineSettings.provider === 'claudecode' && (
        <div className="mx-3 mt-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Terminal size={12} className="text-amber-300 shrink-0" />
            <span className="text-[11px] text-amber-200 font-medium truncate">
              Claude Code Runtime: <span className="font-bold text-amber-300">Official CLI Session Active</span>
            </span>
          </div>
          <span className="text-[10px] text-amber-300/80 font-mono">
            {engineSettings.selectedModel || 'claude-3-7-sonnet'}
          </span>
        </div>
      )}

      {engineSettings.provider === 'codex' && (
        <div className="mx-3 mt-1.5 px-2.5 py-1 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Bot size={12} className="text-teal-300 shrink-0" />
            <span className="text-[11px] text-teal-200 font-medium truncate">
              OpenAI Codex Engine: <span className="font-bold text-teal-300">Active (ChatGPT Plan Quota)</span>
            </span>
          </div>
          <span className="text-[10px] text-teal-300/80 font-mono">
            {engineSettings.selectedModel || 'gpt-6.1-sol'}
          </span>
        </div>
      )}

      {engineSettings.provider === 'antigravity' && (
        <div className="mx-3 mt-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles size={12} className="text-emerald-400 shrink-0" />
            <span className="text-[11px] text-emerald-200 font-medium truncate">
              Google Antigravity Engine: <span className="font-bold text-emerald-300">Active (High Quota • 503 Bypass)</span>
            </span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">
            {engineSettings.selectedModel || 'gemini-3.8-flash-high'}
          </span>
        </div>
      )}

      {engineSettings.persona && (
        <div className="mx-3 mt-1.5 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Bot size={12} className="text-gray-400 shrink-0" />
            <span className="text-[11px] text-gray-300 font-medium truncate">
              Persona: <span className="text-white font-semibold">{engineSettings.persona}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateEngineSettings({ persona: undefined })}
            className="text-[10px] text-gray-400 hover:text-white"
          >
            Reset
          </button>
        </div>
      )}

      {engineSettings.communicationTone === 'caveman' && (
        <div className="mx-3 mt-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Zap size={12} className="text-amber-400 shrink-0 fill-amber-400" />
            <span className="text-[11px] text-amber-200 font-medium truncate">
              Caveman Mode: <span className="font-bold text-amber-300">~75% Token Savings (Terse)</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateEngineSettings({ communicationTone: 'executive', explanationVerbosity: 'concise' })}
            className="text-[10px] text-amber-300 hover:text-white px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      )}
    </>
  );
};
