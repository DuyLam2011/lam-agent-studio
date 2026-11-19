import React from 'react';
import { useAgentStore, HardworkLevel } from '../../../../store/useAgentStore';
import { PROVIDER_DEFAULT_MODELS } from '../../../agent/modelConstants';
import { ToneAndVerbositySection } from './ToneAndVerbositySection';
import { AgentDecisionLevelSection } from './AgentDecisionLevelSection';
import { Cpu, Users2, KeyRound, Sparkles, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

export const AiEngineSettingsTab: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast, setOllamaModalOpen } = useAgentStore();

  const handleProviderChange = (provider: string) => {
    const defaultModel = PROVIDER_DEFAULT_MODELS[provider] || 'gemini-2.5-flash';
    updateEngineSettings({ provider, selectedModel: defaultModel });
    window.lamApi?.settingsAPI?.saveSettings?.({ aiProvider: provider, aiModel: defaultModel });
    addToast(`Selected AI Provider: ${provider.toUpperCase()}`, 'info');
  };

  const handleHardworkChange = (level: HardworkLevel) => {
    const effort = level === 'rapid' ? 'low' : (level === 'balanced' ? 'medium' : 'high');
    updateEngineSettings({ hardworkLevel: level, reasoningEffort: effort });
    window.lamApi?.settingsAPI?.saveSettings?.({ hardworkLevel: level, reasoningEffort: effort });
    addToast(`Hardwork Level: ${level.toUpperCase()}`, 'info');
  };

  return (
    <div className="space-y-3 p-1">
      {/* Provider Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Cpu size={13} className="text-primary" /> AI Model Engine & Provider
          </label>
          <button type="button" onClick={() => setOllamaModalOpen(true)} className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium">
            <span>Cloud & Ollama Hub</span><ExternalLink size={10} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'antigravity', label: 'Antigravity (Google)' }, { id: 'gemini', label: 'Google Gemini' },
            { id: 'codex', label: 'OpenAI Codex' }, { id: 'anthropic', label: 'Claude AI' },
            { id: 'deepseek', label: 'DeepSeek' }, { id: 'ollama', label: 'Local Ollama' }
          ].map(({ id, label }) => {
            const isSelected = (engineSettings.provider || 'gemini').toLowerCase() === id;
            return (
              <button key={id} type="button" onClick={() => handleProviderChange(id)} className={clsx("p-2 rounded-xl border text-center transition-all cursor-pointer surface-card text-xs font-medium", isSelected ? "border-primary bg-primary/10 text-primary font-bold shadow-sm" : "border-subtle text-secondary hover:text-app-text")}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Agent Decision Level & Context Acquisition */}
      <AgentDecisionLevelSection />

      {/* Hardwork Level & Swarm Orchestration */}
      <div className="p-2.5 rounded-xl surface-card border border-subtle space-y-1.5">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Users2 size={13} className="text-primary" />Reasoning Effort & Swarm Scale</span>
          <span className="text-primary font-mono text-[10px] capitalize">{engineSettings.hardworkLevel || 'deep'}</span>
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'rapid' as HardworkLevel, label: '⚡ Rapid', desc: '1 Agent' },
            { id: 'balanced' as HardworkLevel, label: '⚖️ Balanced', desc: '2 Agents' },
            { id: 'deep' as HardworkLevel, label: '🧠 Deep', desc: '3 Agents' },
            { id: 'max_swarm' as HardworkLevel, label: '🔥 Max Swarm', desc: '5 Subagents' }
          ].map(opt => (
            <button key={opt.id} type="button" onClick={() => handleHardworkChange(opt.id)} className={clsx("p-1.5 rounded-lg border text-center transition-all cursor-pointer text-[10px]", (engineSettings.hardworkLevel || 'deep') === opt.id ? "border-primary bg-primary/20 text-primary font-bold shadow-sm" : "border-subtle text-muted hover:text-app-text")}>
              <div className="font-semibold">{opt.label}</div>
              <div className="text-[8.5px] text-muted">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Auto Smart Router Mode vs Fixed Model */}
      <div className="p-2.5 rounded-xl surface-card border border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400"><Sparkles size={16} /></div>
          <div>
            <h4 className="text-xs font-semibold text-app-text">Auto (Smart Router)</h4>
            <p className="text-[10px] text-muted">Dynamically evaluates 4D complexity and routes optimal model</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const provider = engineSettings.provider || 'gemini';
            const defaultFallback = PROVIDER_DEFAULT_MODELS[provider] || 'gemini-2.5-flash';
            const isAuto = engineSettings.selectedModel === 'auto-smart-router' || !engineSettings.selectedModel;
            const nextModel = isAuto ? defaultFallback : 'auto-smart-router';
            updateEngineSettings({ selectedModel: nextModel });
            window.lamApi?.settingsAPI?.saveSettings?.({ aiModel: nextModel });
            addToast(`Smart Router: ${nextModel === 'auto-smart-router' ? 'ENABLED' : 'DISABLED (' + nextModel + ')'}`, 'info');
          }}
          className={clsx("w-10 h-5 rounded-full transition-colors relative cursor-pointer border border-subtle", (engineSettings.selectedModel === 'auto-smart-router' || !engineSettings.selectedModel) ? "bg-primary" : "bg-white/10")}
        >
          <span className={clsx("block w-3.5 h-3.5 rounded-full bg-white transition-transform transform shadow-sm", (engineSettings.selectedModel === 'auto-smart-router' || !engineSettings.selectedModel) ? "translate-x-5" : "translate-x-0.5")} />
        </button>
      </div>

      {/* API Key Status & Quick Config */}
      <div className="p-2.5 rounded-xl surface-card border border-subtle space-y-1.5">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <KeyRound size={13} className="text-primary" /> API Key & Custom Endpoint
        </label>
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={engineSettings.customApiKey || ''}
            onChange={(e) => updateEngineSettings({ customApiKey: e.target.value })}
            placeholder="Enter API Key (e.g. AIzaSy... / sk-ant-...)"
            className="flex-1 surface-input px-3 py-1.5 rounded-lg text-xs font-mono border border-subtle text-app-text focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => {
              const key = engineSettings.customApiKey || '';
              window.lamApi?.settingsAPI?.saveSettings?.({ customApiKey: key });
              addToast('Saved API Key securely to settings.json', 'success');
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary hover:bg-primary-hover text-white cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>

      <ToneAndVerbositySection />
    </div>
  );
};
