import React from 'react';
import { Brain, Thermometer } from 'lucide-react';
import clsx from 'clsx';
import { useAgentStore, ReasoningEffort } from '../../store/useAgentStore';

export const AgentInferenceConfig: React.FC = () => {
  const { engineSettings, updateEngineSettings } = useAgentStore();
  const reasoningLevels: ReasoningEffort[] = ['off', 'low', 'medium', 'high'];

  return (
    <div className="space-y-3">
      {/* Reasoning Effort */}
      <div className="space-y-1.5">
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
      </div>
    </div>
  );
};
