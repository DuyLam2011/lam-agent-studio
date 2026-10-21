import React, { useState, useEffect } from 'react';
import { Server, RefreshCw, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface OllamaStatusCardProps {
  onSelectModel: (modelTag: string) => void;
}

export const OllamaStatusCard: React.FC<OllamaStatusCardProps> = ({ onSelectModel }) => {
  const { engineSettings, updateEngineSettings, addToast } = useAgentStore();
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{ running: boolean; baseUrl: string; models: string[]; error?: string }>({
    running: false,
    baseUrl: engineSettings.baseUrl || 'http://localhost:11434',
    models: []
  });

  const checkConnection = async (targetUrl?: string) => {
    setChecking(true);
    const host = targetUrl || status.baseUrl;
    try {
      // @ts-ignore
      const res = await window.lamApi?.ollama?.checkStatus?.(host);
      if (res?.running) {
        setStatus({ running: true, baseUrl: res.baseUrl || host, models: res.models || [] });
        addToast(`Connected to Ollama (${res.models?.length || 0} models detected)`, 'success');
      } else {
        setStatus({ running: false, baseUrl: host, models: [], error: res?.error || 'Ollama service not detected' });
      }
    } catch (err: any) {
      setStatus({ running: false, baseUrl: host, models: [], error: err.message });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleApplyModel = (modelTag: string) => {
    updateEngineSettings({
      provider: 'ollama',
      selectedModel: modelTag,
      baseUrl: status.baseUrl
    });
    onSelectModel(modelTag);
    addToast(`Selected model ${modelTag} for Agent Studio`, 'success');
  };

  return (
    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server size={15} className="text-primary" />
          <h4 className="text-xs font-bold text-white tracking-wide">Ollama Service Status</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
            status.running
              ? "text-emerald-300 bg-emerald-500/20 border-emerald-500/40"
              : "text-amber-300 bg-amber-500/20 border-amber-500/40"
          )}>
            {status.running ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
            {status.running ? 'Ollama Online' : 'Disconnected'}
          </span>
          <button
            onClick={() => checkConnection()}
            disabled={checking}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Refresh Connection"
          >
            <RefreshCw size={12} className={clsx(checking && "animate-spin text-primary")} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={status.baseUrl}
          onChange={(e) => setStatus(prev => ({ ...prev, baseUrl: e.target.value }))}
          placeholder="http://localhost:11434"
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-primary/50"
        />
        <button
          onClick={() => checkConnection(status.baseUrl)}
          disabled={checking}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
        >
          {checking ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {status.running && status.models.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-white/5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
            Installed Models ({status.models.length}):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {status.models.map(m => (
              <button
                key={m}
                onClick={() => handleApplyModel(m)}
                className={clsx(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all border",
                  engineSettings.selectedModel === m && engineSettings.provider === 'ollama'
                    ? "bg-primary/25 border-primary/50 text-white font-bold"
                    : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <Cpu size={10} className="text-purple-400" />
                <span>{m}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!status.running && (
        <p className="text-[11px] text-amber-300/80 leading-relaxed bg-amber-950/20 p-2 rounded-xl border border-amber-500/20">
          Ollama service not detected on port 11434. Ensure Ollama is running or use the 1-click deployment options below.
        </p>
      )}
    </div>
  );
};
