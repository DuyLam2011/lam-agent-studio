import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAgentStore, AgentDecisionLevel } from '../../../../store/useAgentStore';
import { SettingsSection, SettingsRow, SettingsSegmentedControl } from '../../../ui/settings/SettingsPrimitives';

export const FatherDelegationGateCard: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast } = useAgentStore();
  const currentMode = (engineSettings.delegationMode || 'interactive_gate') as 'interactive_gate' | 'auto_dispatch';
  const currentDecision = (engineSettings.agentDecisionLevel || 'balanced') as AgentDecisionLevel;

  const handleModeChange = (mode: 'interactive_gate' | 'auto_dispatch') => {
    updateEngineSettings({ delegationMode: mode });
    window.lamApi?.settingsAPI?.saveSettings?.({ delegationMode: mode });
    addToast(mode === 'interactive_gate' ? 'Safeguard Gate set to Interactive Approval' : 'Safeguard Gate set to Auto-Dispatch', 'info');
  };

  const handleDecisionChange = (level: AgentDecisionLevel) => {
    updateEngineSettings({ agentDecisionLevel: level });
    window.lamApi?.settingsAPI?.saveSettings?.({ agentDecisionLevel: level });
    addToast(`Decision Level: ${level.toUpperCase()}`, 'info');
  };

  return (
    <SettingsSection
      title="Governance & Safeguard Gates"
      description="Control confirmation gates before code changes and Socratic clarification depth."
      icon={ShieldCheck}
      divided
    >
      <SettingsRow
        title="Delegation Approval Gate"
        description="Interactive Gate requires a 1-click approval card before executing code modifications."
      >
        <SettingsSegmentedControl
          value={currentMode}
          onChange={handleModeChange}
          options={[
            { id: 'interactive_gate', label: 'Interactive Gate' },
            { id: 'auto_dispatch', label: 'Auto-Dispatch' }
          ]}
        />
      </SettingsRow>

      <SettingsRow
        title="Decision & Clarification Level"
        description="Balances autonomous assumptions against structured clarification questions."
      >
        <SettingsSegmentedControl
          value={currentDecision}
          onChange={handleDecisionChange}
          options={[
            { id: 'autonomous', label: 'Autonomous' },
            { id: 'balanced', label: 'Balanced' },
            { id: 'inquisitive', label: 'Inquisitive' },
            { id: 'rigorous', label: 'Rigorous' }
          ]}
        />
      </SettingsRow>
    </SettingsSection>
  );
};
