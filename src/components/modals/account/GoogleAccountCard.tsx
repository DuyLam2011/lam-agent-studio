import React, { useState } from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { Sparkles, CheckCircle2, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

export const GoogleAccountCard: React.FC = () => {
  const { googleAccount, connectGoogleAccount, disconnectGoogleAccount, engineSettings, updateEngineSettings } = useAgentStore();
  const [isLoading, setIsLoading] = useState(false);

  const isConnected = !!googleAccount?.connected;
  const isSelectedProvider = engineSettings.provider === 'antigravity';

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await connectGoogleAccount();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await disconnectGoogleAccount();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetAsActiveProvider = () => {
    updateEngineSettings({
      provider: 'antigravity',
      selectedModel: googleAccount?.models?.[0]?.id || 'gemini-3.8-flash-high'
    });
  };

  return (
    <div
      className={clsx(
        "flex flex-col border rounded-xl overflow-hidden transition-all duration-200",
        isConnected
          ? "border-emerald-500/40 bg-emerald-500/[0.04] shadow-sm"
          : "border-white/10 hover:border-white/20 bg-black/40"
      )}
    >
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={clsx(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors",
              isConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-300"
            )}
          >
            <Sparkles size={18} className={isConnected ? "text-emerald-400" : "text-gray-400"} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-gray-200 truncate">Google (Antigravity Engine)</span>
              {isConnected && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                  <CheckCircle2 size={10} /> Live
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 truncate">
              {isConnected ? googleAccount?.email : 'Bypass 503 limits • Gemini 3.8 & Claude 4.6'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            <div className="flex items-center gap-1.5">
              {!isSelectedProvider && (
                <button
                  onClick={handleSetAsActiveProvider}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1"
                  title="Make Antigravity your primary AI engine"
                >
                  <span>Use As Active</span>
                  <ArrowRight size={11} />
                </button>
              )}
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="text-[10px] font-bold px-2.5 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1"
                title="Disconnect Google Antigravity session"
              >
                <LogOut size={11} />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className={clsx(
                "text-[10px] font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1.5 shadow-sm",
                isLoading
                  ? "bg-white/10 text-gray-400 cursor-wait"
                  : "bg-primary hover:bg-primary-hover text-white"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-2.5 h-2.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Connect Session</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isConnected && (
        <div className="px-3.5 pb-2.5 pt-0.5 flex items-center justify-between text-[9.5px] text-gray-400 border-t border-emerald-500/10 bg-emerald-500/[0.02]">
          <span className="flex items-center gap-1 text-emerald-300/90 font-medium">
            <ShieldCheck size={11} />
            <span>High Quota Active (Zero API Key 503 Errors)</span>
          </span>
          <span className="font-mono text-gray-500">
            {googleAccount?.models?.length || 6} Models Loaded
          </span>
        </div>
      )}
    </div>
  );
};
