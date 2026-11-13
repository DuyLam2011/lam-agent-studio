import React, { useState } from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { Sparkles, CheckCircle2, LogOut, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import clsx from 'clsx';

const GoogleIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export const GoogleAccountCard: React.FC = () => {
  const { googleAccount, connectGoogleAccount, disconnectGoogleAccount, engineSettings, updateEngineSettings } = useAgentStore();
  const [emailInput, setEmailInput] = useState('lavender.mqeen@gmail.com');
  const [showInput, setShowInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isConnected = !!googleAccount?.connected;
  const isSelectedProvider = engineSettings.provider === 'antigravity';

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await connectGoogleAccount(emailInput.trim());
      setShowInput(false);
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
    <div className={clsx(
      "flex flex-col border rounded-xl overflow-hidden transition-all duration-200",
      isConnected ? "border-emerald-500/40 bg-emerald-500/[0.04] shadow-sm" : "border-white/10 bg-black/40"
    )}>
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={clsx("w-9 h-9 rounded-full flex items-center justify-center shrink-0", isConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5")}>
            {isConnected ? <Sparkles size={18} className="text-emerald-400" /> : <GoogleIcon size={18} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-gray-200 truncate">Google (Antigravity Engine)</span>
              {isConnected ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                  <CheckCircle2 size={10} /> Live
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-white/5 text-gray-400 border border-white/10">Not Connected</span>
              )}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 truncate">
              {isConnected ? (googleAccount?.email || googleAccount?.name) : 'Native Antigravity Runtime · High Quota · Zero 503'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            <div className="flex items-center gap-1.5">
              {!isSelectedProvider && (
                <button onClick={handleSetAsActiveProvider} className="text-[10px] font-semibold px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1">
                  <span>Use As Active</span> <ArrowRight size={11} />
                </button>
              )}
              <button onClick={handleDisconnect} disabled={isLoading} className="text-[10px] font-bold px-2.5 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1">
                <LogOut size={11} /> <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => (showInput ? handleConnect() : setShowInput(true))}
              disabled={isLoading}
              className="text-[11px] font-bold px-3.5 py-1.5 rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
              title="Sign in with your Google account"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-gray-900/60 border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon size={14} />
              )}
              <span>{isLoading ? 'Connecting...' : (showInput ? 'Confirm Sign In' : 'Sign in with Google')}</span>
            </button>
          )}
        </div>
      </div>

      {!isConnected && showInput && (
        <div className="px-3.5 pb-3 pt-1 border-t border-white/5 bg-white/[0.02] flex items-center gap-2">
          <div className="relative flex-1">
            <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="lavender.mqeen@gmail.com"
              className="w-full pl-7 pr-2.5 py-1 text-[11px] bg-black/40 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:border-emerald-500/50"
              onKeyDown={(e) => { if (e.key === 'Enter') handleConnect(); }}
            />
          </div>
          <button
            onClick={handleConnect}
            disabled={isLoading || !emailInput.trim()}
            className="px-3 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shrink-0 disabled:opacity-50"
          >
            Connect
          </button>
        </div>
      )}

      {isConnected && (
        <div className="px-3.5 pb-2.5 pt-0.5 flex items-center justify-between text-[9.5px] text-gray-400 border-t border-emerald-500/10 bg-emerald-500/[0.02]">
          <span className="flex items-center gap-1 text-emerald-300/90 font-medium">
            <ShieldCheck size={11} /> <span>High Quota Active (Zero API Key 503 Errors)</span>
          </span>
          <span className="font-mono text-gray-500">{googleAccount?.models?.length || 6} Models Loaded</span>
        </div>
      )}
    </div>
  );
};
