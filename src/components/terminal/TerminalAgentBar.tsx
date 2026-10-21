import React, { useState } from 'react';
import { Bot, Play, Sparkles, AlertCircle, Eye } from 'lucide-react';
import { useAgentStore, TerminalAgentMode } from '../../store/useAgentStore';
import { useAgentActivityStore } from '../../store/useAgentActivityStore';
import clsx from 'clsx';

interface TerminalAgentBarProps {
  onAgentCommand: (command: string) => void;
  onAnalyzeBuffer: () => void;
}

export const TerminalAgentBar: React.FC<TerminalAgentBarProps> = ({ onAgentCommand, onAnalyzeBuffer }) => {
  const { terminalAgentConfig, setTerminalAgent, subagentPersonas } = useAgentStore();
  const { isInspectorOpen, setInspectorOpen } = useAgentActivityStore();
  const [promptInput, setPromptInput] = useState('');

  const activeAgents = subagentPersonas.length > 0 ? subagentPersonas : [
    { id: 'terminal-devops', name: 'DevOps Automator', role: 'CI/CD' },
    { id: 'terminal-watchdog', name: 'Watchdog', role: 'Monitor' },
  ];

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    onAgentCommand(promptInput.trim());
    setPromptInput('');
  };

  return (
    <div className="bg-black/50 border-b border-white/5 p-2 flex flex-col gap-1.5 shrink-0 text-xs">
      {/* Top Controls Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Bot size={13} />
          </div>

          {/* Dynamic Agent Selection */}
          <select
            value={terminalAgentConfig.assignedAgentId || activeAgents[0]?.id}
            onChange={(e) => {
              const selected = activeAgents.find(a => a.id === e.target.value);
              setTerminalAgent({
                assignedAgentId: e.target.value,
                agentName: selected?.name || 'Assigned Agent'
              });
            }}
            className="bg-white/5 text-gray-200 text-[11px] font-medium rounded-lg px-2 py-0.5 border border-white/10 focus:outline-none focus:border-emerald-500/50 max-w-[150px] truncate"
          >
            {activeAgents.map(a => (
              <option key={a.id} value={a.id} className="bg-neutral-900 text-gray-200">
                {a.name} ({a.role})
              </option>
            ))}
          </select>

          {/* Mode Switcher */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/5 text-[10px]">
            {(['monitor', 'suggest', 'autopilot'] as TerminalAgentMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setTerminalAgent({ agentMode: mode })}
                className={clsx(
                  "px-2 py-0.5 rounded-md font-medium transition-all capitalize",
                  terminalAgentConfig.agentMode === mode
                    ? "bg-emerald-500 text-black font-semibold shadow-sm"
                    : "text-gray-400 hover:text-white"
                )}
                title={`Agent Mode: ${mode}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons: Analyze + Inspector window */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onAnalyzeBuffer}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium transition-all"
            title="Request assigned agent to analyze terminal log output"
          >
            <Sparkles size={11} />
            <span>Analyze Log</span>
          </button>

          <button
            onClick={() => setInspectorOpen(!isInspectorOpen)}
            className={clsx(
              "flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-medium transition-all",
              isInspectorOpen
                ? "bg-purple-500/20 border-purple-500/40 text-purple-200 shadow-sm"
                : "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
            )}
            title="Open dedicated Agent Inspector to monitor thinking stream & captured logs"
          >
            <Eye size={11} />
            <span>Agent View</span>
          </button>
        </div>
      </div>

      {/* Detected Error Alert Banner */}
      {terminalAgentConfig.lastDetectedError && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] animate-in fade-in">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle size={12} className="text-rose-400 shrink-0" />
            <span className="truncate font-mono">{terminalAgentConfig.lastDetectedError.text}</span>
          </div>
          {terminalAgentConfig.lastDetectedError.suggestion && (
            <button
              onClick={() => onAgentCommand(`Fix this terminal error: ${terminalAgentConfig.lastDetectedError?.suggestion}`)}
              className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded text-[10px] font-bold shrink-0"
            >
              Fix Error
            </button>
          )}
        </div>
      )}

      {/* Agent Command Input */}
      <form onSubmit={handleSendPrompt} className="flex items-center gap-1.5">
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder={`Instruct ${terminalAgentConfig.agentName || 'Agent'} (e.g. "Run test suite and inspect error logs")...`}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
        />
        <button
          type="submit"
          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 shadow-md transition-all shrink-0"
        >
          <Play size={10} />
          <span>Execute</span>
        </button>
      </form>
    </div>
  );
};
