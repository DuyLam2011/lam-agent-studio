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
        <div className="flex items-center justify-between text-[10px] text-app-muted font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Brain size={12} className="text-primary" /> Reasoning Effort
          </span>
          <span className="text-primary font-mono capitalize">{engineSettings.reasoningEffort}</span>
        </div>
        <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg surface-input border border-subtle">
          {reasoningLevels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => updateEngineSettings({ reasoningEffort: lvl })}
              className={clsx(
                "py-1 rounded-md text-center text-xs font-semibold capitalize transition-all border cursor-pointer",
                engineSettings.reasoningEffort === lvl
                  ? "bg-primary border-primary text-white shadow-sm"
                  : "border-transparent text-app-muted hover:text-app-text hover:bg-primary/10"
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-app-muted font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Thermometer size={12} className="text-primary" /> Temperature
          </span>
          <span className="font-mono text-primary">{engineSettings.temperature.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={engineSettings.temperature}
          onChange={(e) => updateEngineSettings({ temperature: parseFloat(e.target.value) })}
          className="w-full h-1.5 surface-input rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
};
