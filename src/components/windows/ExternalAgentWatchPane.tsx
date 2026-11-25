import React, { useEffect, useState } from 'react';
import { RefreshCw, Play, ArrowDownToLine, Terminal, Radio, CloudUpload } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import clsx from 'clsx';

interface ExternalSession {
  id: string;
  provider: string;
  title: string;
  cwd: string;
  model: string;
  originator: string;
  updated_at_ms: number;
  recent_commands: string[];
}

export const ExternalAgentWatchPane: React.FC = () => {
  const { systemContext, setPendingChatPrompt, addToast } = useAgentStore();
  const [sessions, setSessions] = useState<ExternalSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningCmd, setRunningCmd] = useState<string | null>(null);

  const scan = async () => {
    setLoading(true);
    try {
      const report = await window.lamApi?.externalAgents?.scan(4, true);
      setSessions(Array.isArray(report?.sessions) ? report.sessions : []);
    } catch (err: any) {
      addToast(err?.message || 'Failed to scan external agents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void scan(); }, []);

  const handleLoadContextPacket = async () => {
    const packet = await window.lamApi?.externalAgents?.getFatherContext(4);
    if (!packet?.markdown) return;
    setPendingChatPrompt(`[External Agent Context]\n${packet.markdown}\n\nSummarize current external agent activity and advise next actions.`);
    addToast(`Loaded ${packet.sessionsCount} external sessions into Father Agent`, 'success');
  };

  const handleExecuteAndCapture = async (cmd: string, cwd?: string) => {
    setRunningCmd(cmd);
    try {
      const res = await window.lamApi?.terminal?.executeAgentCommand({
        command: cmd,
        workspaceRoot: cwd || systemContext.cwd || '.',
        streamToTerminal: true,
        agentName: 'Father Window'
      });
      await window.lamApi?.gateway?.emitCallback?.('command-result', {
        windowId: 'father-window', command: cmd, exitCode: res?.exitCode, stdout: res?.stdout?.slice(0, 600)
      });
      setPendingChatPrompt(
        `[Captured Command Output (${res?.exitCode === 0 ? 'OK' : `Exit ${res?.exitCode}`})]\nCommand: \`${cmd}\`\n\`\`\`\n${(res?.stdout || res?.stderr || '(No output)').slice(0, 1200)}\n\`\`\`\nAnalyze this output and proceed.`
      );
      addToast(`Command finished (${res?.exitCode ?? 0}) & loaded into Father context`, res?.exitCode === 0 ? 'success' : 'info');
    } finally {
      setRunningCmd(null);
    }
  };

  const handlePushGateway = async () => {
    await window.lamApi?.externalAgents?.pushToGateway(systemContext.cwd);
    addToast('Pushed external agent telemetry to API Gateway', 'info');
  };

  return (
    <div className="flex flex-col h-full surface-panel border-l border-subtle overflow-hidden">
      <div className="p-3 border-b border-subtle surface-header flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Radio size={13} className="text-emerald-400 shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-app-text truncate">External Agents Monitor</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={handleLoadContextPacket} title="Inject all external context into Father Agent"
            className="px-2 py-1 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 text-[10px] font-semibold flex items-center gap-1 cursor-pointer">
            <ArrowDownToLine size={11} /><span>Inject All</span>
          </button>
          <button type="button" onClick={handlePushGateway} title="Report snapshot to Gateway callbacks"
            className="p-1.5 rounded-lg surface-input hover:bg-primary/10 text-secondary hover:text-primary border border-subtle cursor-pointer">
            <CloudUpload size={11} />
          </button>
          <button type="button" onClick={scan} title="Rescan Claude, Codex & Antigravity sessions"
            className="p-1.5 rounded-lg surface-input hover:bg-primary/10 text-secondary hover:text-app-text border border-subtle cursor-pointer">
            <RefreshCw size={11} className={clsx(loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-2.5">
        {sessions.length === 0 && (
          <div className="p-4 rounded-xl surface-card border border-subtle text-[11px] text-muted text-center">
            No external Claude Code, Codex, or Antigravity activity found on disk.
          </div>
        )}
        {sessions.map((s) => (
          <div key={`${s.provider}-${s.id}`} className="p-2.5 rounded-xl surface-card border border-subtle space-y-1.5">
            <div className="flex items-center justify-between gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-primary/15 text-primary border border-primary/25">
                {s.provider}
              </span>
              <span className="text-[9.5px] font-mono text-muted truncate">{s.model || s.originator}</span>
            </div>
            <div className="text-xs font-semibold text-app-text line-clamp-2">{s.title}</div>
            {s.cwd && <div className="text-[10px] font-mono text-muted truncate">{s.cwd}</div>}
            {s.recent_commands?.length > 0 && (
              <div className="pt-1 space-y-1">
                {s.recent_commands.slice(0, 3).map((cmd, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg surface-input border border-subtle text-[10px] font-mono">
                    <span className="truncate flex items-center gap-1 text-secondary">
                      <Terminal size={10} className="shrink-0 text-emerald-400" />
                      <span className="truncate">{cmd}</span>
                    </span>
                    <button
                      type="button"
                      disabled={runningCmd === cmd}
                      onClick={() => handleExecuteAndCapture(cmd, s.cwd)}
                      className="px-1.5 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[9px] font-sans font-semibold shrink-0 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Play size={8} /><span>Run</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
