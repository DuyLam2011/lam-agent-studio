import React, { useState, useEffect } from 'react';
import { Monitor, Terminal, Download, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

export const OllamaTargetDeployStep: React.FC = () => {
  const { addToast, setPanelVisible } = useAgentStore();
  const [target, setTarget] = useState<'windows' | 'wsl'>('windows');
  const [wslInfo, setWslInfo] = useState<{ hasWsl: boolean; wslDistro?: string } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; downloadedMb: number; totalMb: number; status: string } | null>(null);

  useEffect(() => {
    // @ts-ignore
    window.lamApi?.ollama?.getEnvironment?.().then((env: any) => { if (env) setWslInfo(env); });
    // @ts-ignore
    const cleanup = window.lamApi?.ollama?.onDownloadProgress?.((p: any) => {
      setProgress(p);
      if (p.percent === 100) {
        setDownloading(false);
        addToast('Download complete! Launching Ollama installer...', 'success');
      }
    });
    return () => cleanup?.();
  }, []);

  const handleDownloadWindows = async () => {
    setDownloading(true);
    try {
      // @ts-ignore
      const res = await window.lamApi?.ollama?.downloadInstaller?.();
      if (!res?.success) {
        addToast(`Error: ${res?.error || 'Failed to download installer'}`, 'error');
        setDownloading(false);
      }
    } catch (err: any) {
      addToast(err.message, 'error');
      setDownloading(false);
    }
  };

  const handleDeployWsl = () => {
    // @ts-ignore
    const terminalApi = window.lamApi?.terminal;
    if (terminalApi) {
      setPanelVisible('terminal', true);
      terminalApi.write('term-main', `wsl -e sh -c "curl -fsSL https://ollama.com/install.sh | sh"\r\n`);
      addToast('Dispatched install script to WSL Terminal', 'info');
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-primary" /> Choose Deployment Target
        </h4>
        <span className="text-[10px] text-gray-400">Automated Setup & Download</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setTarget('windows')}
          className={clsx(
            "p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between",
            target === 'windows' ? "bg-primary/20 border-primary text-white shadow-lg shadow-primary/20" : "bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20"
          )}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Monitor size={14} className="text-cyan-400" /> Windows Native
              </span>
              {target === 'windows' && <CheckCircle2 size={13} className="text-primary" />}
            </div>
            <p className="text-[11px] text-gray-300">Run natively on Windows. Auto-detects NVIDIA/AMD GPUs.</p>
          </div>
          <span className="text-[9px] font-mono text-cyan-300 mt-2 block">Recommended</span>
        </button>

        <button
          type="button"
          onClick={() => setTarget('wsl')}
          className={clsx(
            "p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between",
            target === 'wsl' ? "bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-500/20" : "bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20"
          )}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Terminal size={14} className="text-purple-400" /> WSL2 Linux
              </span>
              {target === 'wsl' && <CheckCircle2 size={13} className="text-purple-400" />}
            </div>
            <p className="text-[11px] text-gray-300">Run inside Linux Ubuntu/WSL for maximum performance.</p>
          </div>
          <span className="text-[9px] font-mono text-purple-300 mt-2 block">
            {wslInfo?.hasWsl ? `Detected: ${wslInfo.wslDistro}` : 'WSL Not Installed'}
          </span>
        </button>
      </div>

      <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
        {target === 'windows' ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-white">Install Directly on Windows</span>
              {downloading && <Loader2 size={13} className="animate-spin text-primary" />}
            </div>
            {downloading && progress ? (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-gray-300">
                  <span>{progress.status}</span>
                  <span>{progress.downloadedMb}MB / {progress.totalMb}MB</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-150" style={{ width: `${progress.percent}%` }} />
                </div>
              </div>
            ) : (
              <button
                onClick={handleDownloadWindows}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-lg shadow-primary/20 transition-all"
              >
                <Download size={14} /> Download & Install Ollama on Windows (1-Click)
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-white block">Deploy in WSL Environment</span>
            <p className="text-[11px] text-gray-300">Automatically provisions Ollama in your WSL Linux distribution.</p>
            <button
              onClick={handleDeployWsl}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/25 transition-all"
            >
              <Terminal size={14} /> Execute Install Script in WSL Terminal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
