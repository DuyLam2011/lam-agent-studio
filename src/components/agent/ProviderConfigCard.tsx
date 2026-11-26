import React, { useState } from 'react';
import { Key, Eye, EyeOff, Server, Cpu, Check, Sparkles } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import clsx from 'clsx';

export const ProviderConfigCard: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast, setOllamaModalOpen } = useAgentStore();
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
    <div className="p-3 rounded-xl surface-card border border-subtle space-y-2.5">
      <div className="flex items-center justify-between text-[10px] text-app-muted font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Server size={12} className="text-primary" /> AI Agent Provider
        </span>
        <span className="text-emerald-500 font-mono text-[9px] uppercase font-semibold">
          {provider === 'offline' ? 'Offline Mode' : `${provider} active`}
        </span>
      </div>

      {/* Provider Selector Tabs */}
      <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg surface-input border border-subtle">
        {(['gemini', 'openai', 'ollama', 'offline'] as const).map((p) => (
          <button
            key={p}
            onClick={() => {
              const defaultModel = modelsByProvider[p][0];
              updateEngineSettings({ provider: p, selectedModel: defaultModel });
            }}
            className={clsx(
              "py-1 rounded-md text-center text-[10px] font-semibold capitalize transition-all border cursor-pointer",
              provider === p
                ? "bg-primary border-primary text-white shadow-sm"
                : "border-transparent text-app-muted hover:text-app-text hover:bg-primary/10"
            )}
          >
            {p === 'gemini' ? 'Gemini' : p === 'openai' ? 'OpenAI' : p === 'ollama' ? 'Ollama' : 'Offline'}
          </button>
        ))}
      </div>

      {/* Model Selector */}
      <div className="space-y-1">
        <label className="text-[10px] text-app-muted flex items-center gap-1">
          <Cpu size={11} className="text-primary" /> Active Model
        </label>
        <select
          value={engineSettings.selectedModel}
          onChange={(e) => updateEngineSettings({ selectedModel: e.target.value })}
          className="w-full surface-input border border-subtle rounded-lg px-2 py-1 text-xs text-app-text font-mono focus:outline-none focus:border-primary/60"
        >
          {(modelsByProvider[provider] || modelsByProvider.gemini).map((m) => (
            <option key={m} value={m} style={{ background: 'var(--bg-panel-solid)', color: 'var(--text-primary)' }}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* API Key Input */}
      {provider !== 'offline' && (
        <div className="space-y-1">
          <label className="text-[10px] text-app-muted flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Key size={11} className="text-amber-500" /> {provider === 'gemini' ? 'Gemini API Key' : 'API Key'}
            </span>
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-app-muted hover:text-app-text transition-colors cursor-pointer"
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
              className="flex-1 surface-input border border-subtle rounded-lg px-2 py-1 text-xs text-app-text font-mono focus:outline-none focus:border-primary/60"
            />
            <button
              onClick={handleSaveConfig}
              className="px-2.5 py-1 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Check size={12} /> Save
            </button>
          </div>
        </div>
      )}

      {/* Base URL for Ollama / Custom Endpoint */}
      {(provider === 'ollama' || provider === 'openai') && (
        <div className="space-y-1">
          <label className="text-[10px] text-app-muted">Endpoint Base URL</label>
          <input
            type="text"
            value={baseUrlInput}
            onChange={(e) => setBaseUrlInput(e.target.value)}
            className="w-full surface-input border border-subtle rounded-lg px-2 py-1 text-xs text-app-text font-mono focus:outline-none focus:border-primary/60"
          />
        </div>
      )}

      {provider === 'ollama' && (
        <button
          type="button"
          onClick={() => setOllamaModalOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 text-xs font-semibold transition-all cursor-pointer"
        >
          <Sparkles size={12} className="text-primary" /> Deploy & Manage Ollama Local AI
        </button>
      )}
    </div>
  );
};
