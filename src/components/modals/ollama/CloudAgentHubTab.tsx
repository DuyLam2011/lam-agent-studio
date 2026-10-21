import React, { useState } from 'react';
import { Cloud, Key, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

export const CloudAgentHubTab: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast, fetchLiveModels } = useAgentStore();
  const [provider, setProvider] = useState<'gemini' | 'deepseek' | 'openai' | 'openrouter'>('gemini');
  const [apiKey, setApiKey] = useState(engineSettings.customApiKey || '');
  const [baseUrl, setBaseUrl] = useState(engineSettings.baseUrl || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid?: boolean; latencyMs?: number; error?: string } | null>(null);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) return addToast('Please enter an API Key', 'error');
    setTesting(true);
    setTestResult(null);
    try {
      // @ts-ignore
      const res = await window.lamApi?.cloud?.validateKey?.(provider, apiKey, baseUrl);
      setTestResult(res);
      addToast(res?.valid ? `Connected to ${provider.toUpperCase()} (${res.latencyMs}ms)` : `Error: ${res?.error}`, res?.valid ? 'success' : 'error');
      if (res?.valid) {
        fetchLiveModels(provider, apiKey.trim());
      }
    } catch (err: any) {
      setTestResult({ valid: false, error: err.message });
      addToast(err.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndActivate = async () => {
    const effectiveProvider = provider === 'gemini' ? 'gemini' : 'openai';
    const effectiveBaseUrl = baseUrl.trim() || (provider === 'deepseek' ? 'https://api.deepseek.com/v1' : provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : '');
    const selectedModel = provider === 'gemini' ? 'gemini-2.0-flash' : provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o';

    updateEngineSettings({ provider: effectiveProvider, customApiKey: apiKey.trim(), baseUrl: effectiveBaseUrl, selectedModel });
    fetchLiveModels(effectiveProvider, apiKey.trim());

    try {
      // @ts-ignore
      await window.lamApi?.settingsAPI?.saveSettings?.({ aiApiKey: apiKey.trim(), aiProvider: effectiveProvider, aiBaseUrl: effectiveBaseUrl, aiModel: selectedModel });
      addToast(`Activated Cloud Provider: ${provider.toUpperCase()}`, 'success');
    } catch {
      addToast('Configuration saved', 'info');
    }
  };

  return (
    <div className="space-y-3.5 text-xs">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Cloud size={14} className="text-cyan-400" /> Connect Cloud AI Providers (Google Gemini, DeepSeek, OpenAI)
        </h4>
        <span className="text-[10px] text-gray-400">High-speed inference & large context</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {(['gemini', 'deepseek', 'openai', 'openrouter'] as const).map((p) => (
          <button
            key={p}
            onClick={() => { setProvider(p); setTestResult(null); }}
            className={clsx(
              "py-1.5 px-2 rounded-xl text-center text-xs font-semibold capitalize transition-all border",
              provider === p ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow" : "bg-white/[0.03] border-white/5 text-gray-400 hover:text-white"
            )}
          >
            {p === 'gemini' ? 'Gemini AI' : p === 'deepseek' ? 'DeepSeek' : p === 'openai' ? 'OpenAI' : 'OpenRouter'}
          </button>
        ))}
      </div>

      <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Key size={11} className="text-amber-400" /> {provider.toUpperCase()} API Key
            </label>
            {provider === 'gemini' && (
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1">
                Get Google Key <ExternalLink size={10} />
              </a>
            )}
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your API Key here..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {provider === 'openrouter' && (
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400">Custom Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://openrouter.ai/api/v1"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-xs text-gray-200 font-mono focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        )}

        {testResult && (
          <div className={clsx(
            "p-2 rounded-xl border flex items-center justify-between text-xs font-mono",
            testResult.valid ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-rose-950/20 border-rose-500/30 text-rose-300"
          )}>
            <div className="flex items-center gap-2">
              {testResult.valid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>{testResult.valid ? `Valid API Key! Ready to serve` : testResult.error}</span>
            </div>
            {testResult.latencyMs !== undefined && <span className="text-[10px] text-gray-400">{testResult.latencyMs}ms</span>}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
          >
            <RefreshCw size={12} className={clsx(testing && "animate-spin text-cyan-400")} />
            {testing ? 'Testing...' : 'Test Key'}
          </button>
          <button
            onClick={handleSaveAndActivate}
            className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-lg shadow-cyan-600/20"
          >
            Save & Activate Provider
          </button>
        </div>
      </div>
    </div>
  );
};
