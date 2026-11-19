import React, { useState, useEffect } from 'react';
import { Terminal, CheckCircle2, AlertTriangle, Clock, Copy, Play, RefreshCw } from 'lucide-react';
import { AgentTerminalRunRecord } from '../../types/execution-environment';
import { useAgentStore } from '../../store/useAgentStore';
import clsx from 'clsx';

interface AgentTerminalLogViewProps {
  terminalId?: string;
}

export const AgentTerminalLogView: React.FC<AgentTerminalLogViewProps> = ({ terminalId = 'term-main' }) => {
  const [runs, setRuns] = useState<AgentTerminalRunRecord[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const { addToast } = useAgentStore();

  const fetchRuns = async () => {
    // @ts-ignore
    const api = window.lamApi?.terminal;
    if (!api?.getRecentAgentRuns) return;
    try {
      const records = await api.getRecentAgentRuns();
      if (Array.isArray(records)) {
        setRuns(records);
        if (records.length > 0 && !selectedRunId) setSelectedRunId(records[0].id);
      }
    } catch {}
  };

  useEffect(() => {
    void fetchRuns();
    const interval = setInterval(fetchRuns, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied output to clipboard', 'success');
  };

  const handleSendToTerminal = (cmd: string) => {
    // @ts-ignore
    window.lamApi?.terminal?.write?.(terminalId, `${cmd}\r\n`);
    addToast(`Sent command to terminal: ${cmd}`, 'info');
  };

  const selectedRun = runs.find((r) => r.id === selectedRunId) || runs[0];

  if (runs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none text-xs">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2 shadow-md"><Terminal size={20} /></div>
        <h3 className="text-xs font-bold text-app-text mb-1">Agent Terminal Stream</h3>
        <p className="text-muted max-w-xs text-[10.5px] leading-relaxed mb-3">Built-in agents stream commands, tool calls, and diagnostics through Git Bash, WSL, or Docker.</p>
        <button onClick={fetchRuns} className="text-xs font-semibold px-3 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 flex items-center gap-1.5"><RefreshCw size={11} /><span>Refresh Logs</span></button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden text-xs">
      {/* Left List of Runs */}
      <div className="w-64 border-r border-border overflow-y-auto custom-scrollbar flex flex-col p-1.5 gap-1 shrink-0 bg-black/20">
        <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-muted uppercase tracking-wider">
          <span>Agent Runs ({runs.length})</span>
          <button onClick={fetchRuns} className="hover:text-app-text"><RefreshCw size={10} /></button>
        </div>
        {runs.map((r) => {
          const isSelected = selectedRun?.id === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedRunId(r.id)}
              className={clsx(
                "p-2 rounded-xl text-left transition-all border flex flex-col gap-1 cursor-pointer",
                isSelected ? "border-primary bg-primary/15 shadow-sm" : "border-subtle hover:border-white/20 surface-card"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/5 border border-white/10 text-primary uppercase font-bold">{r.environment}</span>
                <span className={clsx("flex items-center gap-1 text-[9px] font-semibold", r.exitCode === 0 ? "text-emerald-400" : "text-rose-400")}>
                  {r.exitCode === 0 ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                  <span>{r.exitCode === 0 ? 'EXIT 0' : `ERR ${r.exitCode}`}</span>
                </span>
              </div>
              <div className="font-mono text-[10.5px] text-app-text truncate">{r.command}</div>
              <div className="text-[9px] text-muted flex items-center gap-1">
                <Clock size={9} />
                <span>{r.durationMs}ms</span>
                <span className="ml-auto opacity-70">{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right Detail Viewer */}
      <div className="flex-1 flex flex-col overflow-hidden bg-black/40 p-3">
        {selectedRun && (
          <div className="flex flex-col h-full gap-2">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase">{selectedRun.environment}</span>
                  <span className="text-xs font-mono font-bold text-app-text truncate">{selectedRun.command}</span>
                </div>
                <div className="text-[10px] text-muted mt-0.5">Executed by {selectedRun.agentName || 'Built-in Agent'} · Duration: {selectedRun.durationMs}ms</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleSendToTerminal(selectedRun.command)}
                  className="text-[10.5px] font-medium px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-app-text border border-border flex items-center gap-1"
                  title="Send this command into the interactive terminal"
                >
                  <Play size={10} /> <span>Re-run in PTY</span>
                </button>
                <button
                  onClick={() => handleCopy(selectedRun.stdout || selectedRun.stderr)}
                  className="p-1 rounded-lg hover:bg-white/10 text-muted hover:text-app-text"
                  title="Copy log output"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>

            <pre className="flex-1 font-mono text-[11px] p-2.5 rounded-xl bg-black/70 border border-subtle overflow-y-auto custom-scrollbar select-text leading-relaxed text-app-text whitespace-pre-wrap">
              {selectedRun.stdout || (selectedRun.stderr ? `[STDERR]\n${selectedRun.stderr}` : '(No output generated)')}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
