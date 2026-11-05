import React, { useState } from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { Bot, CheckCircle2, LogOut, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import clsx from 'clsx';

export const CodexAccountCard: React.FC = () => {
  const { codexAccount, connectCodexAccount, disconnectCodexAccount, engineSettings, updateEngineSettings } = useAgentStore();
  const [isLoading, setIsLoading] = useState(false);

  const isConnected = !!codexAccount?.connected;
  const isSelectedProvider = engineSettings.provider === 'codex';

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await connectCodexAccount();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await disconnectCodexAccount();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetAsActiveProvider = () => {
    updateEngineSettings({
      provider: 'codex',
      selectedModel: codexAccount?.models?.[0]?.id || 'gpt-6.1-sol'
    });
  };

  return (
    <div
      className={clsx(
        "flex flex-col border rounded-xl overflow-hidden transition-all duration-200",
        isConnected
          ? "border-teal-500/40 bg-teal-500/[0.04] shadow-sm"
          : "border-white/10 hover:border-white/20 bg-black/40"
      )}
    >
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={clsx(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors",
              isConnected ? "bg-teal-500/20 text-teal-300" : "bg-white/5 text-gray-300"
            )}
          >
            <Bot size={18} className={isConnected ? "text-teal-300" : "text-gray-400"} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-gray-200 truncate">OpenAI Codex (Sign in with ChatGPT)</span>
              {isConnected && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-0.5">
                  <CheckCircle2 size={10} /> {codexAccount?.planType || 'PLAN'}
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 truncate">
              {isConnected ? `${codexAccount?.name || 'User'} (${codexAccount?.email})` : 'Use ChatGPT/Codex subscription without API keys'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            <div className="flex items-center gap-1.5">
              {!isSelectedProvider && (
                <button
                  onClick={handleSetAsActiveProvider}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 transition-colors flex items-center gap-1"
                  title="Make OpenAI Codex your primary AI engine"
                >
                  <span>Use As Active</span>
                  <ArrowRight size={11} />
                </button>
              )}
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="text-[10px] font-bold px-2.5 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1"
                title="Disconnect ChatGPT plan session"
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
                  : "bg-teal-600 hover:bg-teal-500 text-white"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-2.5 h-2.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Zap size={11} />
                  <span>Sign in with ChatGPT</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isConnected && (
        <div className="px-3.5 pb-2.5 pt-0.5 flex items-center justify-between text-[9.5px] text-gray-400 border-t border-teal-500/10 bg-teal-500/[0.02]">
          <span className="flex items-center gap-1 text-teal-300/90 font-medium">
            <ShieldCheck size={11} />
            <span>Directly billed to your ChatGPT Plan quota (No API Key Required)</span>
          </span>
          <span className="font-mono text-gray-500">
            {codexAccount?.models?.length || 5} Models Available
          </span>
        </div>
      )}
    </div>
  );
};
