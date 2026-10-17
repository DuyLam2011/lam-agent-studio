import React, { useState, useEffect } from 'react';
import { TerminalView } from './TerminalView';
import { TerminalAgentBar } from './TerminalAgentBar';
import { DynamicPanelHeader } from '../layout/DynamicPanelHeader';
import { Trash2, RotateCcw, Terminal } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import clsx from 'clsx';

export const TerminalPanel: React.FC<{ isCenter?: boolean }> = ({ isCenter = false }) => {
  const { terminalAgentConfig, addToast, setTerminalAgent } = useAgentStore();
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
      // @ts-ignore
      const ai = window.lamApi?.ai;
      if (ai) {
        addToast(`Agent ${terminalAgentConfig.agentName} analyzing request...`, 'info');
        const buffer = await api.getBuffer(terminalId);
        const res = await ai.sendPrompt(`Terminal task: "${command}". Last terminal context: ${buffer.slice(-500)}`);
        if (res?.text) addToast(res.text.slice(0, 80), 'info');
      } else {
        api.write(terminalId, `${command}\r\n`);
      }
    }
  };

  const handleAnalyzeBuffer = async () => {
    // @ts-ignore
    const api = window.lamApi?.terminal;
    // @ts-ignore
    const ai = window.lamApi?.ai;
    if (!api || !ai) return;

    addToast('Analyzing recent terminal output...', 'info');
    const buffer = await api.getBuffer(terminalId);
    if (!buffer.trim()) {
      addToast('Terminal buffer is currently empty.', 'info');
      return;
    }

    const res = await ai.sendPrompt(`Analyze this terminal output and provide actionable fixes:\n${buffer.slice(-1000)}`);
    if (res?.text) {
      addToast(`Agent Insight: ${res.text.slice(0, 100)}...`, 'success');
    }
  };

  return (
    <div className={clsx("flex flex-col h-full overflow-hidden bg-neutral-900/60 backdrop-blur-xl", isCenter && "w-full")}>
      <DynamicPanelHeader panelId="terminal">
        <div className="flex items-center gap-1.5">
          {/* System Shell Selector */}
          {availableShells.length > 0 && (
            <div className="flex items-center gap-1 bg-white/5 rounded-md px-1.5 py-0.5 border border-white/5 text-[10px]">
              <Terminal size={10} className="text-gray-400" />
              <select
                value={selectedShell}
                onChange={(e) => {
                  setSelectedShell(e.target.value);
                  addToast(`Switched shell to ${availableShells.find(s => s.path === e.target.value)?.name}`, 'info');
                }}
                className="bg-transparent text-gray-300 font-mono focus:outline-none cursor-pointer"
              >
                {availableShells.map((sh) => (
                  <option key={sh.path} value={sh.path} className="bg-neutral-900 text-gray-200">
                    {sh.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
