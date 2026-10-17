import React, { useState } from 'react';
import ChatTab from './ChatTab';
import { AgentHeader } from './AgentHeader';
import { AgentSettingsDrawer } from './AgentSettingsDrawer';
import { DynamicPanelHeader } from '../layout/DynamicPanelHeader';
import clsx from 'clsx';

export const AgentPanel: React.FC<{ isCenter?: boolean }> = ({ isCenter = false }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className={clsx("flex flex-col h-full overflow-hidden relative", isCenter && "w-full")}>
      {/* Dynamic Positioning Header */}
      <DynamicPanelHeader panelId="agent" />

      {/* Sleek Model & Mode Controls */}
      <AgentHeader
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
      />

      {/* Chat & Vibecoding Canvas */}
      <div className="flex-1 overflow-hidden h-full relative">
        <ChatTab />
        <AgentSettingsDrawer
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </div>
  );
};

export default AgentPanel;
