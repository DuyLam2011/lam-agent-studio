import React from 'react';
import { PanelId } from '../../store/useAgentStore';
import { ExplorerPanel } from '../explorer/ExplorerPanel';
import { EditorPanel } from '../editor/EditorPanel';
import AgentPanel from '../agent/AgentPanel';
import { AgentsCenterPanel } from '../panels/AgentsCenterPanel';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { CornerDownLeft, Minus, Square, X, Bot, Terminal, Folder, Code2, Zap } from 'lucide-react';

interface DetachedWindowViewProps {
  panelId: PanelId;
}

export const DetachedWindowView: React.FC<DetachedWindowViewProps> = ({ panelId }) => {
  const handleRedock = () => {
    // @ts-ignore
    window.lamApi?.panel?.redock(panelId);
  };

  const handleMinimize = () => {
    // @ts-ignore
    window.lamApi?.minimizeWindow?.();
  };

  const handleMaximize = () => {
    // @ts-ignore
    window.lamApi?.maximizeWindow?.();
  };

  const handleClose = () => {
    // Closing detached window re-docks back into main window
    handleRedock();
  };

  const getPanelMeta = () => {
    switch (panelId) {
      case 'explorer':
        return { title: 'Explorer', icon: <Folder size={13} className="text-blue-400" /> };
      case 'editor':
        return { title: 'Code Editor', icon: <Code2 size={13} className="text-emerald-400" /> };
      case 'agent':
        return { title: 'AI Studio', icon: <Zap size={13} className="text-amber-400" /> };
      case 'agents-center':
        return { title: 'Agents Center', icon: <Bot size={13} className="text-purple-400" /> };
      case 'terminal':
        return { title: 'Agent Terminal', icon: <Terminal size={13} className="text-emerald-400" /> };
    }
  };

  const { title, icon } = getPanelMeta();

  const renderContent = () => {
    switch (panelId) {
      case 'explorer':
        return <ExplorerPanel isCenter={true} />;
      case 'editor':
        return <EditorPanel isCenter={true} />;
      case 'agent':
        return <AgentPanel isCenter={true} />;
      case 'agents-center':
        return <AgentsCenterPanel isCenter={true} />;
      case 'terminal':
        return <TerminalPanel isCenter={true} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-foreground overflow-hidden font-sans border border-white/10 rounded-2xl shadow-2xl">
      {/* Detached Frameless Title Bar */}
      <div className="h-10 w-full flex items-center justify-between select-none bg-black/60 border-b border-white/10 shrink-0 [-webkit-app-region:drag]">
        <div className="pl-4 flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold tracking-wider text-gray-200 uppercase">
            {title}
          </span>
          <span className="text-[10px] text-gray-500 font-mono px-1.5 py-0.5 rounded-full bg-white/5 border border-white/5">
            Detached Window
          </span>
        </div>

        {/* Controls */}
        <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex items-center h-full">
          <button
            onClick={handleRedock}
            className="h-full px-3 text-purple-300 hover:text-white hover:bg-purple-600/30 transition-colors flex items-center gap-1.5 text-xs font-medium border-r border-white/5"
            title="Re-dock to Main IDE Layout"
          >
            <CornerDownLeft size={13} />
            <span>Re-dock</span>
          </button>
          <button
            onClick={handleMinimize}
            className="h-full px-3.5 hover:bg-white/10 transition-colors flex items-center justify-center text-gray-400 hover:text-white"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={handleMaximize}
            className="h-full px-3.5 hover:bg-white/10 transition-colors flex items-center justify-center text-gray-400 hover:text-white"
          >
            <Square size={11} />
          </button>
          <button
            onClick={handleClose}
            className="h-full px-3.5 hover:bg-red-500 transition-colors flex items-center justify-center text-gray-400 hover:text-white"
            title="Close & Re-dock"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 flex overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};
