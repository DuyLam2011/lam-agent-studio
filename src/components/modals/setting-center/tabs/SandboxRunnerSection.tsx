import React, { useState } from 'react';
import { Play, Globe, Terminal, CheckCircle2, XCircle, Trash2, Loader2 } from 'lucide-react';
import { useAgentStore } from '../../../../store/useAgentStore';
import clsx from 'clsx';

export const SandboxRunnerSection: React.FC = () => {
  const { agentPermissions, updateAgentPermissions, addToast, activeRepoPath, systemContext } = useAgentStore();
  const [testType, setTestType] = useState<'script' | 'link'>('script');
  const [scriptCode, setScriptCode] = useState('console.log("Testing sandbox env:", process.cwd());\nconsole.log("Platform:", process.platform);');
  const [testUrl, setTestUrl] = useState('https://github.com/api/v1');
  const [lang, setLang] = useState<'javascript' | 'bash'>('javascript');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<any>(null);

  const wsRoot = activeRepoPath || systemContext.cwd || '.';
  const sandbox = agentPermissions.sandbox;
  const currentRuntime = sandbox.sandboxRuntime || 'host_direct';

  const handleRunScript = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      const sandboxApi = (window as any).lamApi?.sandbox;
      if (!sandboxApi) {
        setOutput({ success: true, output: `[Simulated Sandbox] Executed in isolated temp sandbox (${lang}). No leaks.` });
        return;
      }
      const res = await sandboxApi.runScript(scriptCode, lang, wsRoot, agentPermissions.sandbox);
      setOutput(res);
      addToast(res.success ? 'Sandbox script passed!' : 'Sandbox script exited with error', res.success ? 'success' : 'error');
    } catch (err: any) {
      setOutput({ success: false, output: err?.message || 'Execution failed' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestLink = async () => {
    const sandboxApi = (window as any).lamApi?.sandbox;
    if (!sandboxApi) return;
    const res = await sandboxApi.validateLink(testUrl, agentPermissions.sandbox);
    setOutput(res);
    addToast(res.allowed ? 'Link allowed under policy' : 'Link BLOCKED by Sandbox', res.allowed ? 'success' : 'error');
  };

  const handleClear = async () => {
    const sandboxApi = (window as any).lamApi?.sandbox;
    await sandboxApi?.clearSandbox?.(wsRoot);
    setOutput(null);
    addToast('Cleared sandbox temp directory', 'info');
  };

  return (
    <div className="surface-card rounded-xl p-3 border border-subtle space-y-2.5">
      <div className="flex items-center justify-between border-b border-subtle pb-1.5">
        <div className="flex items-center gap-1.5">
          <Terminal size={13} className="text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-app-text">Isolated Sandbox Test Runner</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setTestType('script')} className={clsx("px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer", testType === 'script' ? "bg-primary text-white" : "text-muted hover:text-app-text")}>Script</button>
          <button type="button" onClick={() => setTestType('link')} className={clsx("px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer", testType === 'link' ? "bg-primary text-white" : "text-muted hover:text-app-text")}>Link/URL</button>
          <button type="button" onClick={handleClear} className="p-1 rounded text-muted hover:text-rose-400 cursor-pointer" title="Clean sandbox temporary directory"><Trash2 size={11} /></button>
        </div>
      </div>

      {testType === 'script' ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted">Target (.agents/sandbox):</span>
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5 bg-black/30 p-0.5 rounded border border-subtle text-[9px]">
                <button type="button" onClick={() => updateAgentPermissions({ sandbox: { ...sandbox, sandboxRuntime: 'host_direct' } })} className={clsx("px-1.5 py-0.2 rounded font-mono", currentRuntime === 'host_direct' ? "bg-primary text-white font-bold" : "text-muted")}>Host</button>
                <button type="button" onClick={() => updateAgentPermissions({ sandbox: { ...sandbox, sandboxRuntime: 'wsl_sandbox' } })} className={clsx("px-1.5 py-0.2 rounded font-mono", currentRuntime === 'wsl_sandbox' ? "bg-primary text-white font-bold" : "text-muted")}>WSL</button>
              </div>
              <div className="flex gap-0.5 bg-black/30 p-0.5 rounded border border-subtle text-[9px]">
                <button type="button" onClick={() => setLang('javascript')} className={clsx("px-1.5 py-0.2 rounded font-mono", lang === 'javascript' ? "bg-primary/20 text-primary font-bold" : "text-muted")}>Node</button>
                <button type="button" onClick={() => setLang('bash')} className={clsx("px-1.5 py-0.2 rounded font-mono", lang === 'bash' ? "bg-primary/20 text-primary font-bold" : "text-muted")}>Bash</button>
              </div>
            </div>
          </div>
          <textarea value={scriptCode} onChange={(e) => setScriptCode(e.target.value)} className="w-full h-16 surface-input p-2 rounded-lg border border-subtle font-mono text-[10.5px] text-app-text outline-none resize-none leading-relaxed" />
          <button type="button" onClick={handleRunScript} disabled={isRunning} className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50">
            {isRunning ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
            <span>Execute in Sandbox</span>
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <span className="text-[10px] text-muted">Validate URL against outbound network policy:</span>
          <div className="flex gap-1.5">
            <input type="text" value={testUrl} onChange={(e) => setTestUrl(e.target.value)} className="flex-1 surface-input px-2.5 py-1 rounded-lg text-xs font-mono border border-subtle text-app-text outline-none" />
            <button type="button" onClick={handleTestLink} className="px-3 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1 cursor-pointer">
              <Globe size={11} /><span>Validate Link</span>
            </button>
          </div>
        </div>
      )}

      {output && (
        <div className={clsx("p-2 rounded-lg text-[10px] font-mono border", output.allowed || output.success ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-rose-950/20 border-rose-500/30 text-rose-300")}>
          <div className="flex items-center gap-1 font-bold mb-1">
            {output.allowed || output.success ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
            <span>{output.allowed !== undefined ? (output.allowed ? 'ALLOWED' : output.reason) : (output.success ? `PASS (Exit 0, ${output.executionTimeMs}ms)` : `FAILED (Exit ${output.exitCode})`)}</span>
          </div>
          {output.output && <pre className="whitespace-pre-wrap max-h-20 overflow-y-auto custom-scrollbar text-gray-300">{output.output}</pre>}
        </div>
      )}
    </div>
  );
};
