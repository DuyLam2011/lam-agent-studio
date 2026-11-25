import React from 'react';
import { Gauge, RotateCcw, Download } from 'lucide-react';
import { useAgentStore, ReasoningEffort } from '../../../../store/useAgentStore';
import { serializeCloudProfilesPayload } from '../../../../services/agent-profile/agentProfileStorageService';
import { SettingsSection, SettingsRow, SettingsSegmentedControl, SettingsToggle } from '../../../ui/settings/SettingsPrimitives';

export const FatherReasoningSliderCard: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast, updateAgentProfile, getAgentProfile, agentProfiles } = useAgentStore();
  const fatherProfile = getAgentProfile('father-agent');
  const currentEffort = (engineSettings.reasoningEffort || 'high') as ReasoningEffort;
  const temperature = engineSettings.temperature ?? 0.2;
  const maxTokens = engineSettings.maxTokens || fatherProfile.maxOutputTokens || 8192;

  const handleEffort = (effort: ReasoningEffort) => {
    updateEngineSettings({ reasoningEffort: effort });
    updateAgentProfile('father-agent', { reasoningEffort: effort === 'off' ? 'low' : effort });
    window.lamApi?.settingsAPI?.saveSettings?.({ reasoningEffort: effort });
    addToast(`Reasoning Effort: ${effort.toUpperCase()}`, 'info');
  };

  const handleResetDefaults = () => {
    updateEngineSettings({
      reasoningEffort: 'high', hardworkLevel: 'deep', temperature: 0.2, maxTokens: 8192,
      agentDecisionLevel: 'balanced', executionStrategy: 'unified_chat_ai',
      pairedCodingAgent: 'codex', codingModel: '', delegationMode: 'interactive_gate'
    });
    updateAgentProfile('father-agent', {
      reasoningEffort: 'high', temperature: 0.2, maxOutputTokens: 8192, autoApproveTools: true
    });
    addToast('Restored recommended Father Agent defaults', 'info');
  };

  const handleExportJson = () => {
    const payload = serializeCloudProfilesPayload(agentProfiles);
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    addToast('Copied Father Agent profile JSON to clipboard', 'success');
  };

  const rightTools = (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleExportJson}
        className="px-2 py-1 rounded-lg surface-input hover:bg-primary/10 border border-subtle text-[10.5px] font-medium text-secondary hover:text-app-text flex items-center gap-1 cursor-pointer"
      >
        <Download size={11} />
        <span>Export JSON</span>
      </button>
      <button
        type="button"
        onClick={handleResetDefaults}
        className="px-2 py-1 rounded-lg surface-input hover:bg-primary/10 border border-subtle text-[10.5px] font-medium text-secondary hover:text-app-text flex items-center gap-1 cursor-pointer"
      >
        <RotateCcw size={11} />
        <span>Reset</span>
      </button>
    </div>
  );

  return (
    <SettingsSection
      title="Inference & Safety Tuning"
      description="Unified controls for reasoning depth, token limits, sampling temperature, and safe tool automation."
      icon={Gauge}
      rightSlot={rightTools}
      divided
    >
      <SettingsRow title="Reasoning Effort" description="Controls thinking token allocation for multi-step planning and analysis.">
        <SettingsSegmentedControl
          size="xs"
          value={currentEffort}
          onChange={handleEffort}
          options={[
            { id: 'off', label: 'Off' },
            { id: 'low', label: 'Low' },
            { id: 'medium', label: 'Medium' },
            { id: 'high', label: 'High' }
          ]}
        />
      </SettingsRow>

      <SettingsRow title="Temperature" badge={temperature.toFixed(2)} description="0.00 enforces strict deterministic code; higher values widen ideation.">
        <div className="w-full sm:w-52 flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted">0.0</span>
          <input
            type="range" min="0" max="1" step="0.05"
            value={temperature}
            onChange={(e) => {
              const t = parseFloat(e.target.value);
              updateEngineSettings({ temperature: t });
              updateAgentProfile('father-agent', { temperature: t });
            }}
            className="flex-1 accent-primary cursor-pointer"
          />
          <span className="text-[10px] font-mono text-muted">1.0</span>
        </div>
      </SettingsRow>

      <SettingsRow title="Max Output Tokens" description="Maximum token ceiling per response before handoff or continuation.">
        <select
          value={maxTokens}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            updateEngineSettings({ maxTokens: val });
            updateAgentProfile('father-agent', { maxOutputTokens: val });
            window.lamApi?.settingsAPI?.saveSettings?.({ maxTokens: val });
          }}
          className="surface-input border border-subtle rounded-xl px-3 py-1.5 text-xs text-app-text font-mono outline-none focus:border-primary"
        >
          <option value={2048}>2,048 tokens (Budget)</option>
          <option value={4096}>4,096 tokens (Standard)</option>
          <option value={8192}>8,192 tokens (Extended)</option>
          <option value={16384}>16,384 tokens (Maximum)</option>
        </select>
      </SettingsRow>

      <SettingsRow
        title="Auto-Approve Safe Tools"
        description="Allow read-only file inspection, AST search, and non-destructive validation checks automatically."
      >
        <SettingsToggle
          label="Auto-Approve Safe Tools"
          checked={fatherProfile.autoApproveTools}
          onChange={(next) => {
            updateAgentProfile('father-agent', { autoApproveTools: next });
            addToast(`Auto-Approve Safe Tools: ${next ? 'Enabled' : 'Disabled'}`, 'info');
          }}
        />
      </SettingsRow>
    </SettingsSection>
  );
};
