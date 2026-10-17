import React, { useState } from 'react';
import { Key, Eye, EyeOff, Server, Cpu, Check } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import clsx from 'clsx';

export const ProviderConfigCard: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast } = useAgentStore();
  const [showKey, setShowKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(engineSettings.customApiKey || '');
  const [baseUrlInput, setBaseUrlInput] = useState(engineSettings.baseUrl || 'http://localhost:11434/v1');

  const provider = engineSettings.provider || 'gemini';

  const modelsByProvider: Record<string, string[]> = {
    gemini: ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'o1-mini', 'o3-mini'],
    ollama: ['deepseek-r1:latest', 'llama3.3:latest', 'qwen2.5-coder:latest'],
    offline: ['offline-deterministic-agent']
  };

  const handleSaveConfig = async () => {
    updateEngineSettings({
      customApiKey: apiKeyInput.trim(),
      baseUrl: baseUrlInput.trim(),
      provider: provider as any
    });

    try {
      // @ts-ignore
      await window.lamApi?.settingsAPI?.saveSettings?.({
        aiApiKey: apiKeyInput.trim(),
        aiBaseUrl: baseUrlInput.trim(),
        aiProvider: provider,
        aiModel: engineSettings.selectedModel
      });
      addToast('AI Agent provider settings saved', 'success');
    } catch {
      addToast('Saved in session', 'info');
    }
  };

  return (
    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2.5">
      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Server size={12} className="text-primary" /> AI Agent Provider
        </span>
        <span className="text-emerald-400 font-mono text-[9px] uppercase">
          {provider === 'offline' ? 'Offline Mode' : `${provider} active`}
        </span>
      </div>

      {/* Provider Selector Tabs */}
      <div className="grid grid-cols-4 gap-1">
        {(['gemini', 'openai', 'ollama', 'offline'] as const).map((p) => (
          <button
            key={p}
            onClick={() => {
              const defaultModel = modelsByProvider[p][0];
              updateEngineSettings({ provider: p, selectedModel: defaultModel });
            }}
            className={clsx(
              "py-1 rounded-lg text-center text-[10px] font-semibold capitalize transition-all border",
              provider === p
                ? "bg-primary/20 border-primary/40 text-primary shadow"
                : "bg-white/5 border-transparent text-gray-400 hover:text-gray-200"
            )}
          >
            {p === 'gemini' ? 'Gemini' : p === 'openai' ? 'OpenAI' : p === 'ollama' ? 'Ollama' : 'Offline'}
          </button>
        ))}
      </div>

      {/* Model Selector */}
      <div className="space-y-1">
        <label className="text-[10px] text-gray-400 flex items-center gap-1">
          <Cpu size={11} className="text-purple-400" /> Active Model
        </label>
        <select
          value={engineSettings.selectedModel}
          onChange={(e) => updateEngineSettings({ selectedModel: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200 font-mono focus:outline-none focus:border-primary/50"
        >
          {(modelsByProvider[provider] || modelsByProvider.gemini).map((m) => (
            <option key={m} value={m} className="bg-neutral-900 text-gray-200">
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* API Key Input */}
      {provider !== 'offline' && (
        <div className="space-y-1">
          <label className="text-[10px] text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Key size={11} className="text-amber-400" /> {provider === 'gemini' ? 'Gemini API Key' : 'API Key'}
            </span>
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showKey ? <EyeOff size={11} /> : <Eye size={11} />}
            </button>
          </label>
          <div className="flex gap-1.5">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200 font-mono focus:outline-none focus:border-primary/50"
            />
            <button
              onClick={handleSaveConfig}
              className="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Check size={12} /> Save
            </button>
          </div>
        </div>
      )}

      {/* Base URL for Ollama / Custom Endpoint */}
      {(provider === 'ollama' || provider === 'openai') && (
        <div className="space-y-1">
          <label className="text-[10px] text-gray-400">Endpoint Base URL</label>
          <input
            type="text"
            value={baseUrlInput}
            onChange={(e) => setBaseUrlInput(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200 font-mono focus:outline-none focus:border-primary/50"
          />
        </div>
      )}
    </div>
  );
};
