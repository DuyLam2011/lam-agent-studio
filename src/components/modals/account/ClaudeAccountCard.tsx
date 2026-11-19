import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { Terminal, CheckCircle2, LogOut, ArrowRight, ShieldCheck, ExternalLink, RefreshCw, Cloud, Laptop } from 'lucide-react';
import { ClaudeModelSelectorPills } from './ClaudeModelSelectorPills';
import { ClaudeDirectKeyInput } from './ClaudeDirectKeyInput';
import clsx from 'clsx';

export const ClaudeAccountCard: React.FC = () => {
  const { claudeAccount, connectClaudeAccount, disconnectClaudeAccount, syncClaudeStatus, engineSettings, updateEngineSettings, addToast } = useAgentStore();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'direct' | 'cli'>('direct');

  useEffect(() => { void syncClaudeStatus(); }, [syncClaudeStatus]);

  const isConnected = !!claudeAccount?.connected;
  const isSelectedProvider = engineSettings.provider === 'claudecode';
  const isDirectApi = claudeAccount?.authMethod === 'direct_api';

  const handleConnectCli = async () => {
    setLoading(true);
    try { await connectClaudeAccount(); } finally { setLoading(false); }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncClaudeStatus();
      addToast(res?.connected ? `Claude verified: ${res.subscriptionType || 'Active'} Plan` : 'No active Claude session found.', res?.connected ? 'success' : 'info');
    } finally { setSyncing(false); }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try { await disconnectClaudeAccount(); } finally { setLoading(false); }
  };

  const handleSetActive = () => {
    updateEngineSettings({ provider: 'claudecode', selectedModel: claudeAccount?.models?.[0]?.id || 'claude-3-7-sonnet' });
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings?.({ aiProvider: 'claudecode' });
    addToast('Claude set as primary Father Agent engine', 'success');
  };

  return (
    <div className={clsx("flex flex-col border rounded-xl overflow-hidden transition-all duration-200", isConnected ? "border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-neutral-900/60 to-black/80 shadow-md" : "border-white/10 hover:border-white/20 bg-black/40")}>
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={clsx("w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm", isConnected ? "bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/40" : "bg-white/5 text-gray-300")}>
            <Terminal size={18} className={isConnected ? "text-amber-300" : "text-gray-400"} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-gray-200 truncate">Claude Code & Cloud</span>
              {isConnected ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isDirectApi ? 'CLOUD API' : (claudeAccount?.subscriptionType || 'TEAM')}</span>
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-white/5 text-gray-400 border border-white/10">Not Connected</span>
              )}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 truncate">
              {isConnected ? (isDirectApi ? 'Direct Anthropic Cloud REST API (Zero Install)' : `Local CLI Runtime (${claudeAccount?.rateLimitTier || 'standard'})`) : 'Direct Cloud REST API or Local CLI Session'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={handleSync} disabled={syncing} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors" title="Re-check credentials">
            <RefreshCw size={12} className={syncing ? "animate-spin text-amber-300" : ""} />
          </button>
          {isConnected && (
            <div className="flex items-center gap-1.5">
              {!isSelectedProvider ? (
                <button onClick={handleSetActive} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1">
                  <span>Use As Active</span>
                  <ArrowRight size={11} />
                </button>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Active
                </span>
              )}
              <button onClick={handleDisconnect} disabled={loading} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">
                <LogOut size={11} />
              </button>
            </div>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="px-3.5 pb-3">
          <div className="flex items-center gap-1 p-0.5 bg-black/40 border border-white/5 rounded-lg mb-2">
            <button
              onClick={() => setActiveTab('direct')}
              className={clsx("flex-1 text-[10px] font-medium py-1 px-2 rounded flex items-center justify-center gap-1 transition-all", activeTab === 'direct' ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-gray-400 hover:text-gray-200")}
            >
              <Cloud size={11} /> Direct Cloud Key (Zero-Install)
            </button>
            <button
              onClick={() => setActiveTab('cli')}
              className={clsx("flex-1 text-[10px] font-medium py-1 px-2 rounded flex items-center justify-center gap-1 transition-all", activeTab === 'cli' ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-gray-400 hover:text-gray-200")}
            >
              <Laptop size={11} /> Local CLI Session
            </button>
          </div>
          {activeTab === 'direct' ? (
            <ClaudeDirectKeyInput />
          ) : (
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Requires Claude Code CLI installed locally</span>
              <button onClick={handleConnectCli} disabled={loading} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-sm">
                <ExternalLink size={11} />
                <span>{loading ? 'Launching...' : 'Authenticate CLI'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {isConnected && (
        <div className="px-3.5 pb-3">
          <ClaudeModelSelectorPills />
        </div>
      )}

      <div className="px-3.5 py-1.5 flex items-center justify-between text-[9.5px] text-gray-400 border-t border-amber-500/15 bg-amber-500/[0.03]">
        <span className="flex items-center gap-1 text-amber-300/90 font-medium">
          <ShieldCheck size={11} />
          <span>Anthropic Official Protocol · Direct REST</span>
        </span>
        <span className="font-mono text-gray-400">{claudeAccount?.models?.length || 7} Models Ready</span>
      </div>
    </div>
  );
};
