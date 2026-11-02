import React from 'react';
import { PanelId } from '../../types/panel';
import { ExplorerPanel } from '../explorer/ExplorerPanel';
import { EditorPanel } from '../editor/EditorPanel';
import AgentPanel from '../agent/AgentPanel';
import { AgentsCenterPanel } from '../panels/AgentsCenterPanel';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { BrowserPanel } from '../browser/BrowserPanel';

interface PanelRendererProps {
  id: PanelId;
  isCenter: boolean;
}

export const PanelRenderer: React.FC<PanelRendererProps> = ({ id, isCenter }) => {
  switch (id) {
    case 'explorer': return <ExplorerPanel isCenter={isCenter} />;
    case 'editor': return <EditorPanel isCenter={isCenter} />;
    case 'agent': return <AgentPanel isCenter={isCenter} />;
    case 'agents-center': return <AgentsCenterPanel isCenter={isCenter} />;
    case 'terminal': return <TerminalPanel isCenter={isCenter} />;
    case 'browser': return <BrowserPanel isCenter={isCenter} />;
    default: return null;
  }
};
