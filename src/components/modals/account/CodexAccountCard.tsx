import React, { useState } from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { CheckCircle2, LogOut, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

const OpenAIIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
    <path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9 6.07 6.07 0 0 0-5.27 2.17 5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.52 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07zm-9.02 12.61a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76c.24-.14.39-.4.39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.49 4.5zm-9.66-4.13a4.47 4.47 0 0 1-.53-3.01l.14.08 4.78 2.76c.24.14.54.14.78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.06L9.74 19.95a4.5 4.5 0 0 1-6.14-1.65zM2.34 7.9a4.49 4.49 0 0 1 2.37-1.97v5.67c0 .28.15.54.39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0l-4.83-2.79A4.5 4.5 0 0 1 2.34 7.87zm16.6 3.85L13.1 8.36 15.12 7.2a.08.08 0 0 1 .07 0l4.83 2.79a4.5 4.5 0 0 1-.68 8.1v-5.67c0-.28-.15-.53-.4-.67zm2.01-3.02l-.14-.08-4.77-2.78a.78.78 0 0 0-.79 0L9.41 9.23V6.9a.07.07 0 0 1 .03-.06l4.83-2.79a4.5 4.5 0 0 1 6.68 4.66zM8.31 12.86l-2.02-1.16a.08.08 0 0 1-.04-.06V6.07a4.5 4.5 0 0 1 7.38-3.45l-.14.08-4.79 2.76a.8.8 0 0 0-.39.68v6.72zm1.14-2.62l2.55-1.47 2.55 1.47v2.95l-2.55 1.47-2.55-1.47z" />
  </svg>
);

export const CodexAccountCard: React.FC = () => {
  const { codexAccount, connectCodexAccount, disconnectCodexAccount, openCodexApp, engineSettings, updateEngineSettings } = useAgentStore();
  const [isLoading, setIsLoading] = useState(false);

  const isConnected = !!codexAccount?.connected;
  const isSelectedProvider = engineSettings.provider === 'codex';

  const handleConnect = async () => {
    setIsLoading(true);
    try { await connectCodexAccount(); } finally { setIsLoading(false); }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try { await disconnectCodexAccount(); } finally { setIsLoading(false); }
  };

  const handleSetAsActiveProvider = () => {
    updateEngineSettings({ provider: 'codex', selectedModel: codexAccount?.models?.[0]?.id || 'gpt-6.2-sol' });
  };

  return (
    <div className={clsx(
      "flex flex-col border rounded-xl overflow-hidden transition-all duration-200 surface-card",
      isConnected ? "border-emerald-500/40 bg-emerald-500/[0.04] shadow-sm" : "border-subtle hover:border-primary/40"
    )}>
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={clsx("w-9 h-9 rounded-full flex items-center justify-center shrink-0", isConnected ? "bg-emerald-500/15 text-emerald-500" : "surface-input text-app-sub")}>
            <OpenAIIcon size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-app-text truncate">OpenAI Codex (ChatGPT Subscription)</span>
              {isConnected ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-0.5">
                  <CheckCircle2 size={10} /> {codexAccount?.planType || 'ACTIVE'}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium surface-input text-app-muted border border-subtle">Not Connected</span>
              )}
            </div>
            <div className="text-[10px] text-app-muted mt-0.5 truncate">
              {isConnected ? `${codexAccount?.name || 'User'} (${codexAccount?.email})` : 'Sign in with your ChatGPT account for Codex models without API keys'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            <div className="flex items-center gap-1.5">
              {!isSelectedProvider && (
                <button onClick={handleSetAsActiveProvider} className="text-[10px] font-semibold px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer">
                  <span>Use As Active</span> <ArrowRight size={11} />
                </button>
              )}
              <button onClick={() => openCodexApp?.()} className="text-[10px] font-medium px-2 py-1 rounded surface-input hover:bg-primary/10 text-app-sub border border-subtle transition-colors flex items-center gap-1 cursor-pointer" title="Open Codex Desktop App">
                <span>App</span> <ExternalLink size={10} />
              </button>
              <button onClick={handleDisconnect} disabled={isLoading} className="text-[10px] font-bold px-2.5 py-1 rounded bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 transition-colors flex items-center gap-1 cursor-pointer">
                <LogOut size={11} /> <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="text-[11px] font-bold px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              title="Open ChatGPT sign-in interface in browser"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              ) : (
                <OpenAIIcon size={13} />
              )}
              <span>{isLoading ? 'Opening ChatGPT...' : 'Sign in with ChatGPT'}</span>
              {!isLoading && <ExternalLink size={11} className="text-white/70 ml-0.5" />}
            </button>
          )}
        </div>
      </div>

      {isConnected && (
        <div className="px-3.5 pb-2.5 pt-0.5 flex items-center justify-between text-[9.5px] text-gray-400 border-t border-emerald-500/10 bg-emerald-500/[0.02]">
          <span className="flex items-center gap-1 text-emerald-300/90 font-medium">
            <ShieldCheck size={11} /> <span>Billed to ChatGPT Plan Quota (Zero API Key Overhead)</span>
          </span>
          <span className="font-mono text-gray-500">{codexAccount?.models?.length || 5} Models Available</span>
        </div>
      )}
    </div>
  );
};
