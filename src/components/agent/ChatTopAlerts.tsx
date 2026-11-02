import React from 'react';
import { Bot, Key } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';

export const ChatTopAlerts: React.FC = () => {
  const { engineSettings, updateEngineSettings, setOllamaModalOpen } = useAgentStore();

  return (
    <>
      {!engineSettings.customApiKey && engineSettings.provider !== 'ollama' && (
        <div className="mx-3 mt-2 p-2 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-gray-300 truncate flex items-center gap-1.5">
            <Key size={12} className="text-gray-400 shrink-0" />
            <span>Configure AI API Key to enable autonomous coding & review loops.</span>
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
    </>
  );
};
