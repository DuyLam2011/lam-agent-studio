import React from 'react';
import { Thermometer, Brain, Sparkles, UserCheck, Check } from 'lucide-react';
import { useAgentStore, ReasoningEffort } from '../../store/useAgentStore';
import { ProviderConfigCard } from './ProviderConfigCard';
import clsx from 'clsx';

const EngineTab: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast } = useAgentStore();

  const reasoningLevels: ReasoningEffort[] = ['off', 'low', 'medium', 'high'];

  const personas = [
    { id: 'vibecoder', name: 'Rapid Vibecoder', desc: 'Pragmatic, high speed, ship fast' },
    { id: 'architect', name: 'Principal Architect', desc: 'Strict TS, modular <150 lines, design patterns' },
    { id: 'purist', name: 'Clean Purist', desc: 'Minimalist, zero bloat, elegant code' },
    { id: 'security', name: 'Security Auditor', desc: 'OWASP Top 10, sanitization, defensive' },
  ] as const;

  return (
    <div className="p-3 flex-1 flex flex-col gap-3.5 overflow-y-auto custom-scrollbar h-full">
      {/* AI Provider & API Key Configuration */}
      <ProviderConfigCard />

      {/* Reasoning Effort Pills */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Brain size={12} className="text-purple-400" /> Reasoning Effort
          </span>
          <span className="text-purple-300 font-mono capitalize">{engineSettings.reasoningEffort}</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {reasoningLevels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                updateEngineSettings({ reasoningEffort: lvl });
                addToast(`Reasoning Effort: ${lvl.toUpperCase()}`, 'info');
              }}
              className={clsx(
                "py-1.5 rounded-lg text-center text-xs font-semibold capitalize transition-all border",
                engineSettings.reasoningEffort === lvl
                  ? "bg-purple-600/30 border-purple-500/50 text-white shadow"
                  : "bg-white/5 border-transparent text-gray-400 hover:text-gray-200"
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Temperature Slider */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Thermometer size={12} className="text-cyan-400" /> Temperature
          </span>
          <span className="font-mono text-cyan-300">{engineSettings.temperature.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={engineSettings.temperature}
          onChange={(e) => updateEngineSettings({ temperature: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[9px] text-gray-500 font-mono">
          <span>0.0 (Precise)</span>
          <span>0.2 (Recommended)</span>
          <span>1.0 (Creative)</span>
        </div>
      </div>

      {/* Vibecoding Persona */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck size={12} className="text-emerald-400" /> Coding Persona
        </div>
        <div className="space-y-1">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                updateEngineSettings({ persona: p.id });
                addToast(`Persona: ${p.name}`, 'info');
              }}
              className={clsx(
                "w-full p-2 rounded-lg text-left transition-all border flex items-center justify-between",
                engineSettings.persona === p.id
                  ? "bg-primary/20 border-primary/50 text-white shadow"
                  : "bg-white/5 border-transparent text-gray-400 hover:text-gray-200"
              )}
            >
              <div>
                <div className="text-xs font-semibold">{p.name}</div>
                <div className="text-[10px] text-gray-500">{p.desc}</div>
              </div>
              {engineSettings.persona === p.id && <Check size={13} className="text-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* Auto Context Injection Toggles */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={12} className="text-amber-400" /> Auto Injections
        </div>

        <label className="flex items-center justify-between cursor-pointer text-xs text-gray-300">
          <span>Auto-inject Git Diff in Prompt</span>
          <input
            type="checkbox"
            checked={engineSettings.autoInjectGitDiff}
            onChange={(e) => updateEngineSettings({ autoInjectGitDiff: e.target.checked })}
            className="rounded bg-white/10 border-white/20 text-primary focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer text-xs text-gray-300">
          <span>Auto-inject Diagnostics / Compiler Errors</span>
          <input
            type="checkbox"
            checked={engineSettings.autoInjectDiagnostics}
            onChange={(e) => updateEngineSettings({ autoInjectDiagnostics: e.target.checked })}
            className="rounded bg-white/10 border-white/20 text-primary focus:ring-0"
          />
        </label>
      </div>
    </div>
  );
};

export default EngineTab;
