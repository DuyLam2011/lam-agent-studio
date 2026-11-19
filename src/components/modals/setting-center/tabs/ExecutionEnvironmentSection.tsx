import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { Terminal, CheckCircle2, Play, Loader2 } from 'lucide-react';
import { EnvironmentInfo, AgentExecutionEnvironment } from '../../../../types/execution-environment';
import clsx from 'clsx';

const FALLBACK_ENVS: EnvironmentInfo[] = [
  { id: 'gitbash', name: 'Git Bash', detected: true, path: 'bash.exe', badge: 'MSYS2', description: 'Unix toolchains & Node runtime (Default)' },
  { id: 'wsl', name: 'WSL (Ubuntu)', detected: true, path: 'wsl.exe', badge: 'Linux Kernel', versionInfo: 'Ubuntu', description: 'Full native Linux subsystem' },
  { id: 'powershell', name: 'PowerShell', detected: true, path: 'powershell.exe', badge: 'Windows', description: 'Windows native automation' },
  { id: 'docker', name: 'Docker Sandbox', detected: false, path: 'docker', badge: 'Container', description: 'Isolated ephemeral container' }
];

export const ExecutionEnvironmentSection: React.FC = () => {
  const { agentPermissions, updateAgentPermissions, addToast, systemContext } = useAgentStore();
  const [envs, setEnvs] = useState<EnvironmentInfo[]>(FALLBACK_ENVS);
  const [testing, setTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  const term = agentPermissions.terminal;
  const currentEnv = term.defaultEnvironment || 'gitbash';

  useEffect(() => {
    // @ts-ignore
    window.lamApi?.terminal?.getEnvironments?.().then((res: EnvironmentInfo[]) => {
      if (Array.isArray(res) && res.length > 0) setEnvs(res);
    }).catch(() => {});
  }, []);

  const selectEnv = (id: AgentExecutionEnvironment) => {
    updateAgentPermissions({ terminal: { ...term, defaultEnvironment: id } });
    addToast(`Agent execution environment set to ${id.toUpperCase()}`, 'info');
  };

  const handleTestRun = async () => {
    setTesting(true);
    setTestOutput(null);
    try {
      // @ts-ignore
      const res = await window.lamApi?.terminal?.executeAgentCommand?.({
        command: 'echo "L.A.M Agent Execution Probe" && (uname -a 2>/dev/null || cmd.exe /c ver)',
        environment: currentEnv,
        workspaceRoot: systemContext.cwd || process.cwd(),
        wslDistro: term.wslDistro || 'Ubuntu',
        streamToTerminal: Boolean(term.streamToTerminal),
        agentName: 'Diagnostics Probe'
      });
      if (res) {
        setTestOutput(`[${res.environment.toUpperCase()}] Exit ${res.exitCode} (${res.durationMs}ms):\n${res.stdout || res.stderr}`);
        addToast(`Execution probe passed in ${res.environment}`, 'success');
      }
    } catch (e: any) {
      setTestOutput(`Probe failed: ${e.message}`);
      addToast(`Execution probe failed: ${e.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Terminal size={13} className="text-primary" />
          <span>Agent Execution Shell Environment</span>
        </label>
        <button
          type="button"
          onClick={handleTestRun}
          disabled={testing}
          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 flex items-center gap-1 transition-all"
        >
          {testing ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
          <span>Test Selected Environment</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {envs.map((e) => {
          const isSelected = currentEnv === e.id;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => selectEnv(e.id)}
              className={clsx(
                "p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer",
                isSelected ? "border-primary bg-primary/10 shadow-sm" : "border-subtle surface-card hover:border-white/20"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-white/5 border border-white/10 text-muted">{e.badge}</span>
                  {e.detected ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Detected & Available" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" title="Not Detected" />
                  )}
                </div>
                <div className="text-xs font-bold text-app-text">{e.name}</div>
                <div className="text-[9.5px] text-muted line-clamp-1 mt-0.5">{e.description}</div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[9px]">
                <span className={clsx("font-semibold", isSelected ? "text-primary" : "text-muted")}>
                  {isSelected ? 'Active' : 'Select'}
                </span>
                {isSelected && <CheckCircle2 size={11} className="text-primary" />}
              </div>
            </button>
          );
        })}
      </div>

      {testOutput && (
        <pre className="text-[10px] font-mono p-2 rounded-lg bg-black/60 border border-subtle text-emerald-300 max-h-24 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
          {testOutput}
        </pre>
      )}

      <div className="flex items-center justify-between pt-1 text-[11px] text-muted">
        <span>Stream agent tool executions live into interactive terminal</span>
        <button
          type="button"
          onClick={() => updateAgentPermissions({ terminal: { ...term, streamToTerminal: !term.streamToTerminal } })}
          className={clsx("w-8 h-4 rounded-full transition-colors relative cursor-pointer", term.streamToTerminal !== false ? "bg-primary" : "bg-neutral-700")}
        >
          <span className={clsx("block w-3 h-3 rounded-full bg-white transition-transform transform", term.streamToTerminal !== false ? "translate-x-4" : "translate-x-0.5")} />
        </button>
      </div>
    </div>
  );
};
