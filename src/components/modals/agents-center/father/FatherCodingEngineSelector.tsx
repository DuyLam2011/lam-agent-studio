import React from 'react';
import { Terminal } from 'lucide-react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { getPackageAwareModelOptions } from '../../../../services/subagents/subagentPackageResolver';
import { SettingsSection, SettingsRow, SettingsChoiceCard, SettingsSegmentedControl } from '../../../ui/settings/SettingsPrimitives';

const CODING_ENGINES = [
  { id: 'codex', name: 'OpenAI Codex CLI', badge: 'codex-run', desc: 'Sandboxed automated code authoring, diffs, and test execution.' },
  { id: 'claudecode', name: 'Claude Code CLI', badge: 'claude CLI', desc: 'Anthropic terminal worker for multi-file refactoring and git tasks.' },
  { id: 'antigravity', name: 'Antigravity Worker', badge: 'agy worker', desc: 'Native parallel subagent swarm runtime.' },
  { id: 'ide', name: 'Direct IDE Editor', badge: 'Local Buffer', desc: 'Applies surgical edits directly through the workspace toolset.' }
];

export const FatherCodingEngineSelector: React.FC = () => {
  const store = useAgentStore();
  const { engineSettings, updateEngineSettings, addToast } = store;
  const strategy = engineSettings.executionStrategy || 'unified_chat_ai';
  const currentEngine = engineSettings.pairedCodingAgent || 'codex';
  const codingModel = engineSettings.codingModel || '';
  const modelOptions = getPackageAwareModelOptions(store).filter((m) => m.id !== 'auto-smart-router');

  const handleStrategyChange = (next: 'unified_chat_ai' | 'delegated_coding_engine') => {
    updateEngineSettings({ executionStrategy: next });
    window.lamApi?.settingsAPI?.saveSettings?.({ executionStrategy: next });
    addToast(next === 'unified_chat_ai' ? 'Using Chat AI model directly for coding' : 'Delegation to dedicated Coding Worker enabled', 'info');
  };

  const handleEngineSelect = (id: string) => {
    updateEngineSettings({ pairedCodingAgent: id });
    window.lamApi?.settingsAPI?.saveSettings?.({ pairedCodingAgent: id });
    addToast(`Paired coding worker: ${id.toUpperCase()}`, 'success');
  };

  const handleCodingModelChange = (modelId: string) => {
    const matched = modelOptions.find((m) => m.id === modelId);
    const codingProvider = matched?.packageId || '';
    updateEngineSettings({ codingModel: modelId, codingProvider });
    window.lamApi?.settingsAPI?.saveSettings?.({ codingModel: modelId, codingProvider });
    addToast(modelId ? `Assigned coding model: ${modelId}` : 'Coding model follows Primary Master Brain', 'info');
  };

  return (
    <SettingsSection
      title="Coding Execution & Worker Pairing"
      description="Choose whether your selected Chat AI model writes code directly or delegates coding tasks to a dedicated worker."
      icon={Terminal}
      divided
    >
      <SettingsRow
        title="Coding Execution Strategy"
        description="Direct Chat AI lets you code with OpenAI Chat, Claude, or Gemini directly. Delegated mode dispatches contracts to a coding worker."
      >
        <SettingsSegmentedControl
          value={strategy}
          onChange={handleStrategyChange}
          options={[
            { id: 'unified_chat_ai', label: 'Direct Chat AI' },
            { id: 'delegated_coding_engine', label: 'Delegate to Worker' }
          ]}
        />
      </SettingsRow>

      {strategy === 'delegated_coding_engine' && (
        <div className="p-3.5 sm:p-4 space-y-2">
          <div className="text-[11px] font-semibold text-secondary">Target Coding Worker</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-2.5">
            {CODING_ENGINES.map((eng) => (
              <SettingsChoiceCard
                key={eng.id}
                selected={currentEngine === eng.id}
                onClick={() => handleEngineSelect(eng.id)}
                title={eng.name}
                badge={eng.badge}
                description={eng.desc}
              />
            ))}
          </div>
        </div>
      )}

      <SettingsRow
        title="Model Used for Coding Tasks"
        description="Optional override: choose any integrated Chat AI or Coding model (e.g., OpenAI GPT-4o, Codex, Claude, Gemini) specifically for code generation."
      >
        <select
          value={codingModel}
          onChange={(e) => handleCodingModelChange(e.target.value)}
          className="w-full sm:w-64 surface-input border border-subtle rounded-xl px-3 py-1.5 text-xs text-app-text font-mono outline-none focus:border-primary"
        >
          <option value="">Follow Master Brain ({engineSettings.selectedModel || 'auto'})</option>
          {modelOptions.map((m) => (
            <option key={`${m.packageId}-${m.id}`} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </SettingsRow>
    </SettingsSection>
  );
};
