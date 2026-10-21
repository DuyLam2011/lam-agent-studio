import React, { useState, useEffect } from 'react';
import { TerminalView } from './TerminalView';
import { TerminalAgentBar } from './TerminalAgentBar';
import { TerminalShellSelector } from './TerminalShellSelector';
import { DynamicPanelHeader } from '../layout/DynamicPanelHeader';
import { Trash2, RotateCcw } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { runTerminalAnalysis } from '../../services/terminalAgentService';
import clsx from 'clsx';

export const TerminalPanel: React.FC<{ isCenter?: boolean }> = ({ isCenter = false }) => {
  const { terminalAgentConfig, subagentPersonas, addToast, setTerminalAgent } = useAgentStore();
  const [availableShells, setAvailableShells] = useState<{ name: string; path: string }[]>([]);
  const [selectedShell, setSelectedShell] = useState<string>('');
  const terminalId = 'term-main';

  useEffect(() => {
    // @ts-ignore
    window.lamApi?.terminal?.getAvailableShells?.().then((shells: { name: string; path: string }[]) => {
      if (Array.isArray(shells) && shells.length > 0) {
        setAvailableShells(shells);
        setSelectedShell(shells[0].path);
      }
    });
  }, []);

  const handleClear = () => {
    // @ts-ignore
    window.lamApi?.terminal?.write(terminalId, '\x1bc');
    setTerminalAgent({ lastDetectedError: undefined });
    addToast('Terminal cleared', 'info');
  };

  const handleRestart = () => {
    // @ts-ignore
    window.lamApi?.terminal?.spawn(terminalId, undefined, undefined, undefined, selectedShell);
    setTerminalAgent({ lastDetectedError: undefined });
    addToast('Terminal session restarted', 'info');
  };

  const handleAgentCommand = async (command: string) => {
    // @ts-ignore
    const api = window.lamApi?.terminal;
    if (!api) return;

    if (terminalAgentConfig.agentMode === 'autopilot') {
      api.write(terminalId, `${command}\r\n`);
      addToast(`Executed: ${command}`, 'success');
    } else {
      const selectedAgent = subagentPersonas.find(a => a.id === terminalAgentConfig.assignedAgentId) || subagentPersonas[0];
      if (selectedAgent) {
        runTerminalAnalysis({ agent: selectedAgent, terminalId, instruction: command });
      } else {
        api.write(terminalId, `${command}\r\n`);
      }
    }
  };

  const handleAnalyzeBuffer = async () => {
    const selectedAgent = subagentPersonas.find(a => a.id === terminalAgentConfig.assignedAgentId) || subagentPersonas[0];
    if (selectedAgent) {
      runTerminalAnalysis({ agent: selectedAgent, terminalId });
    } else {
      addToast('No agent persona available', 'info');
    }
  };

  return (
    <div className={clsx("flex flex-col h-full overflow-hidden bg-neutral-900/60 backdrop-blur-xl", isCenter && "w-full")}>
      <DynamicPanelHeader panelId="terminal">
        <div className="flex items-center gap-1.5">
          <TerminalShellSelector
            availableShells={availableShells}
            selectedShell={selectedShell}
            onSelectShell={(path) => {
              setSelectedShell(path);
              addToast(`Switched shell to ${availableShells.find(s => s.path === path)?.name}`, 'info');
            }}
          />
          <button
            onClick={handleClear}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Clear Terminal"
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={handleRestart}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Restart Terminal Session"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </DynamicPanelHeader>

      <TerminalAgentBar
        onAgentCommand={handleAgentCommand}
        onAnalyzeBuffer={handleAnalyzeBuffer}
      />

      <div className="flex-1 overflow-hidden relative">
        <TerminalView terminalId={terminalId} selectedShell={selectedShell} />
      </div>
    </div>
  );
};

export default TerminalPanel;
