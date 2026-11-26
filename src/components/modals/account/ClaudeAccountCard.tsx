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
    <div className={clsx("flex flex-col border rounded-xl overflow-hidden transition-all duration-200 surface-card", isConnected ? "border-amber-500/40 bg-amber-500/[0.05] shadow-sm" : "border-subtle hover:border-primary/40")}>
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={clsx("w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm", isConnected ? "bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/40" : "surface-input text-app-sub")}>
            <Terminal size={18} className={isConnected ? "text-amber-500" : "text-app-muted"} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-app-text truncate">Claude Code & Cloud</span>
              {isConnected ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{isDirectApi ? 'CLOUD API' : (claudeAccount?.subscriptionType || 'TEAM')}</span>
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium surface-input text-app-muted border border-subtle">Not Connected</span>
              )}
            </div>
            <div className="text-[10px] text-app-muted mt-0.5 truncate">
              {isConnected ? (isDirectApi ? 'Direct Anthropic Cloud REST API (Zero Install)' : `Local CLI Runtime (${claudeAccount?.rateLimitTier || 'standard'})`) : 'Direct Cloud REST API or Local CLI Session'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={handleSync} disabled={syncing} className="p-1.5 rounded-lg text-app-muted hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer" title="Re-check credentials">
            <RefreshCw size={12} className={syncing ? "animate-spin text-amber-500" : ""} />
          </button>
          {isConnected && (
            <div className="flex items-center gap-1.5">
              {!isSelectedProvider ? (
                <button onClick={handleSetActive} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer">
                  <span>Use As Active</span>
                  <ArrowRight size={11} />
                </button>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/40 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Active
                </span>
              )}
              <button onClick={handleDisconnect} disabled={loading} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 transition-colors cursor-pointer">
                <LogOut size={11} />
              </button>
            </div>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="px-3.5 pb-3">
          <div className="flex items-center gap-1 p-0.5 surface-input border border-subtle rounded-lg mb-2">
            <button
              onClick={() => setActiveTab('direct')}
              className={clsx("flex-1 text-[10px] font-medium py-1 px-2 rounded flex items-center justify-center gap-1 transition-all cursor-pointer", activeTab === 'direct' ? "bg-amber-500/15 text-amber-500 font-semibold" : "text-app-muted hover:text-app-text")}
            >
              <Cloud size={11} /> Direct Cloud Key (Zero-Install)
            </button>
            <button
              onClick={() => setActiveTab('cli')}
              className={clsx("flex-1 text-[10px] font-medium py-1 px-2 rounded flex items-center justify-center gap-1 transition-all cursor-pointer", activeTab === 'cli' ? "bg-amber-500/15 text-amber-500 font-semibold" : "text-app-muted hover:text-app-text")}
            >
              <Laptop size={11} /> Local CLI Session
            </button>
          </div>
          {activeTab === 'direct' ? (
            <ClaudeDirectKeyInput />
          ) : (
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] text-app-muted">Requires Claude Code CLI installed locally</span>
              <button onClick={handleConnectCli} disabled={loading} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-sm cursor-pointer">
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
