import React from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { Link2, X, Check, ArrowRight, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { ProviderLinkMode } from '../../../types/provider-link';
import { ProviderLinkEndpointSelect, ProviderEndpointOption } from './ProviderLinkEndpointSelect';

interface ProviderLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDER_OPTIONS: ProviderEndpointOption[] = [
  { id: 'claudecode', name: 'Claude Code', defaultModel: 'claude-3-7-sonnet' },
  { id: 'codex', name: 'OpenAI Codex', defaultModel: 'gpt-4o' },
  { id: 'gemini', name: 'Google Gemini', defaultModel: 'gemini-2.5-flash' },
  { id: 'antigravity', name: 'Google Antigravity', defaultModel: 'gemini-2.5-pro' }
];

export const ProviderLinkModal: React.FC<ProviderLinkModalProps> = ({ isOpen, onClose }) => {
  const { providerLinkConfig, updateProviderLinkConfig, addToast } = useAgentStore();
  if (!isOpen) return null;

  const handleToggle = () => {
    const next = !providerLinkConfig.enabled;
    updateProviderLinkConfig({ enabled: next });
    addToast(next ? 'Provider Link Activated' : 'Provider Link Paused', 'info');
  };

  const setPreset = (source: string, target: string) => {
    const s = PROVIDER_OPTIONS.find((p) => p.id === source);
    const t = PROVIDER_OPTIONS.find((p) => p.id === target);
    updateProviderLinkConfig({ sourceProvider: source, sourceModel: s?.defaultModel || 'claude-3-7-sonnet', targetProvider: target, targetModel: t?.defaultModel || 'gpt-4o', enabled: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-gray-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30">
              <Link2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Provider Link Pipeline</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono">Cross-AI</span>
              </h2>
              <p className="text-[11px] text-gray-400">Automate code generation and verifier refinement</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <div>
            <div className="text-xs font-semibold text-white">Enable Provider Link Loop</div>
            <div className="text-[10.5px] text-gray-400">When enabled, chat messages execute through the linked pipeline</div>
          </div>
          <button
            onClick={handleToggle}
            className={clsx("w-12 h-6 rounded-full transition-colors relative p-0.5", providerLinkConfig.enabled ? "bg-violet-600" : "bg-neutral-700")}
          >
            <div className={clsx("w-5 h-5 rounded-full bg-white transition-transform shadow-md", providerLinkConfig.enabled ? "translate-x-6" : "translate-x-0")} />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2 items-center">
          <div className="col-span-2">
            <ProviderLinkEndpointSelect
              label="Source (Author)"
              provider={providerLinkConfig.sourceProvider}
              model={providerLinkConfig.sourceModel}
              options={PROVIDER_OPTIONS}
              onSelectProvider={(p, m) => updateProviderLinkConfig({ sourceProvider: p, sourceModel: m })}
              onChangeModel={(m) => updateProviderLinkConfig({ sourceModel: m })}
            />
          </div>
          <div className="col-span-1 flex justify-center text-violet-400">
            <div className="p-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
              <ArrowRight size={14} />
            </div>
          </div>
          <div className="col-span-2">
            <ProviderLinkEndpointSelect
              label="Target (Verifier)"
              provider={providerLinkConfig.targetProvider}
              model={providerLinkConfig.targetModel}
              options={PROVIDER_OPTIONS}
              onSelectProvider={(p, m) => updateProviderLinkConfig({ targetProvider: p, targetModel: m })}
              onChangeModel={(m) => updateProviderLinkConfig({ targetModel: m })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Topology Mode</label>
            <select
              value={providerLinkConfig.mode}
              onChange={(e) => updateProviderLinkConfig({ mode: e.target.value as ProviderLinkMode })}
              className="text-xs bg-black/60 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
            >
              <option value="ping-pong">Dual Ping-Pong (Auto-Refine)</option>
              <option value="1-pass">1-Pass Verify & Report</option>
              <option value="test-refine">Test & Refine Loop</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Max Iterations</label>
            <select
              value={providerLinkConfig.maxIterations}
              onChange={(e) => updateProviderLinkConfig({ maxIterations: Number(e.target.value) })}
              className="text-xs bg-black/60 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
            >
              <option value={1}>1 Loop (1 review)</option>
              <option value={2}>2 Loops (recommended)</option>
              <option value={3}>3 Loops (thorough)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
          <span className="text-gray-500 font-semibold flex items-center gap-1"><Sparkles size={11} className="text-violet-400" /> Presets:</span>
          {([['claudecode', 'codex', 'Claude Code ➔ Codex'], ['codex', 'claudecode', 'Codex ➔ Claude Code'], ['gemini', 'antigravity', 'Gemini ➔ Antigravity']] as const).map(([s, t, label]) => (
            <button key={label} onClick={() => setPreset(s, t)} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10">
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-white/10">
          <button onClick={onClose} className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 shadow-md">
            <Check size={13} />
            <span>Apply Pipeline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
