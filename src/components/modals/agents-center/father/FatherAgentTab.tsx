import React from 'react';
import { SettingsPage } from '../../../ui/settings/SettingsPrimitives';
import { FatherHeroBanner } from './FatherHeroBanner';
import { FatherBrainSelector } from './FatherBrainSelector';
import { FatherCodingEngineSelector } from './FatherCodingEngineSelector';
import { FatherDelegationGateCard } from './FatherDelegationGateCard';
import { FatherReasoningSliderCard } from './FatherReasoningSliderCard';

export const FatherAgentTab: React.FC = () => (
  <SettingsPage>
    <FatherHeroBanner />
    <FatherBrainSelector />
    <FatherCodingEngineSelector />
    <FatherDelegationGateCard />
    <FatherReasoningSliderCard />
  </SettingsPage>
);

export default FatherAgentTab;
