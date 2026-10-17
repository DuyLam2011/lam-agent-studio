import React from 'react';
import { X, Sliders, Zap, Thermometer, Brain } from 'lucide-react';
import { useAgentStore, ReasoningEffort } from '../../store/useAgentStore';
import { AVAILABLE_MODELS } from './agentConstants';
import clsx from 'clsx';

interface AgentSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentSettingsDrawer: React.FC<AgentSettingsDrawerProps> = ({ isOpen, onClose }) => {
  const { engineSettings, updateEngineSettings, globalConfig, toggleGlobalConfig, addToast } = useAgentStore();

  if (!isOpen) return null;

  const reasoningLevels: ReasoningEffort[] = ['off', 'low', 'medium', 'high'];

  return (
    <div className="absolute inset-0 z-40 bg-neutral-950/90 backdrop-blur-xl flex flex-col p-4 overflow-y-auto custom-scrollbar animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Sliders size={14} className="text-primary" />
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Agent Settings</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <div className="py-3 space-y-4 flex-1 text-xs">
        {/* Model Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Active Model</label>
          <select
            value={engineSettings.selectedModel}
            onChange={(e) => {
              updateEngineSettings({ selectedModel: e.target.value });
              addToast(`Model changed to ${e.target.value}`, 'info');
            }}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-gray-200 outline-none focus:border-primary/50 transition-colors"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id} className="bg-neutral-900 text-gray-200">
                {m.name} ({m.provider}) {m.recommended ? '★ Recommended' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Autonomy Level ("Say Yes to All") */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
              <Zap size={12} className="text-amber-400" /> Autonomy Policy
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
              Auto Approve: ON
            </span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            All code modifications and terminal commands run autonomously without interrupting modal popups.
          </p>
        </div>

        {/* Reasoning Effort */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Brain size={12} className="text-purple-400" /> Reasoning Effort</span>
            <span className="text-purple-300 font-mono capitalize">{engineSettings.reasoningEffort}</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {reasoningLevels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => updateEngineSettings({ reasoningEffort: lvl })}
                className={clsx(
                  "py-1 rounded-md text-center text-xs font-semibold capitalize transition-all border",
                  engineSettings.reasoningEffort === lvl
                    ? "bg-purple-600/30 border-purple-500/50 text-white"
                    : "bg-white/5 border-transparent text-gray-400 hover:text-gray-200"
                )}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Temperature */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Thermometer size={12} className="text-cyan-400" /> Temperature</span>
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
        </div>

        {/* Active Skills Toggles */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Core Skills</span>
          <div className="space-y-1">
            {globalConfig.slice(0, 4).map((skill) => (
              <div key={skill.id} className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5 text-xs">
                <span className="text-gray-300 truncate font-medium">{skill.name}</span>
                <button
                  type="button"
                  onClick={() => toggleGlobalConfig(skill.id, !skill.active)}
                  className={clsx("w-8 h-4 rounded-full relative transition-colors duration-200 shrink-0 p-0.5 cursor-pointer", skill.active ? "bg-primary" : "bg-white/10")}
                >
                  <div className={clsx("w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-200", skill.active ? "translate-x-4" : "translate-x-0")} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-lg transition-colors shrink-0"
      >
        Save & Return to Chat
      </button>
    </div>
  );
};
