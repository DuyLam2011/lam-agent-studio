import React from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { Sparkles, Check } from 'lucide-react';
import clsx from 'clsx';

export const ClaudeModelSelectorPills: React.FC = () => {
  const { claudeAccount, engineSettings, updateEngineSettings, addToast } = useAgentStore();
  const models = claudeAccount?.models || [];
  const currentModel = engineSettings.selectedModel;
  const isClaudeProvider = engineSettings.provider === 'claudecode';

  const handleSelect = (modelId: string, modelName: string) => {
    updateEngineSettings({
      provider: 'claudecode',
      selectedModel: modelId
    });
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings?.({ aiProvider: 'claudecode', aiModel: modelId });
    addToast(`Switched active Claude model to ${modelName}`, 'success');
  };

  if (!models.length) return null;

  return (
    <div className="flex flex-col gap-1.5 pt-2 border-t border-amber-500/15">
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-semibold text-amber-200/90 flex items-center gap-1">
          <Sparkles size={11} className="text-amber-400" />
          <span>Claude Code Models Catalog</span>
        </span>
        <span className="text-[9px] text-gray-400 font-mono">
          {models.length} Frontier Models
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {models.map((m) => {
          const isSelected = isClaudeProvider && (currentModel === m.id || (!currentModel && m.id === 'claude-3-7-sonnet'));
          return (
            <button
              key={m.id}
              onClick={() => handleSelect(m.id, m.name)}
              className={clsx(
                "flex items-center justify-between px-2 py-1.5 rounded-lg border text-left transition-all text-[10.5px]",
                isSelected
                  ? "bg-amber-500/25 border-amber-400/60 text-amber-100 shadow-sm ring-1 ring-amber-500/30"
                  : "bg-black/30 border-white/5 hover:border-amber-500/30 text-gray-300 hover:text-white"
              )}
              title={`${m.name} (${m.badge})`}
            >
              <div className="min-w-0 pr-1">
                <div className="font-medium truncate flex items-center gap-1">
                  {isSelected && <Check size={11} className="text-amber-300 shrink-0" />}
                  <span className="truncate">{m.name}</span>
                </div>
                <div className="text-[8.5px] text-gray-400 truncate mt-0.5">{m.badge}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
