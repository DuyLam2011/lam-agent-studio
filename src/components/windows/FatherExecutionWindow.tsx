import React, { useEffect, useState } from 'react';
import { Crown, Minus, Square, X, Radio, Globe } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { AgentHeader } from '../agent/AgentHeader';
import ChatTab from '../agent/ChatTab';
import { ExternalAgentWatchPane } from './ExternalAgentWatchPane';
import { ToastContainer } from '../core/ToastContainer';
import clsx from 'clsx';

export const FatherExecutionWindow: React.FC<{ initialPrompt?: string }> = ({ initialPrompt }) => {
  const { setPendingChatPrompt, engineSettings } = useAgentStore();
  const [showMonitor, setShowMonitor] = useState(true);
  const [gatewayOnline, setGatewayOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (initialPrompt) setPendingChatPrompt(initialPrompt);
    const unsub = window.lamApi?.fatherWindow?.onPrompt?.((prompt: string) => {
      if (prompt) setPendingChatPrompt(prompt);
    });
    window.lamApi?.gateway?.getHealth?.().then((res: any) => setGatewayOnline(Boolean(res?.ok))).catch(() => setGatewayOnline(false));
    return () => { unsub?.(); };
  }, [initialPrompt, setPendingChatPrompt]);

  return (
    <div className="flex flex-col h-screen bg-transparent text-app-text overflow-hidden font-sans border border-subtle shadow-2xl">
      <div className="h-10 w-full flex items-center justify-between select-none surface-header shrink-0 [-webkit-app-region:drag]">
        <div className="pl-3.5 flex items-center gap-2 min-w-0">
          <Crown size={14} className="text-primary shrink-0" />
          <span className="text-xs font-bold tracking-wider uppercase text-app-text">Father Agent Execution Window</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full surface-card border border-subtle text-primary truncate max-w-[160px]">
            {engineSettings.selectedModel || 'auto-smart-router'}
          </span>
          <span className={clsx('text-[9.5px] font-mono px-1.5 py-0.5 rounded-full border flex items-center gap-1',
            gatewayOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-muted border-subtle')}>
            <Globe size={9} />{gatewayOnline ? 'Gateway Live' : 'Standalone'}
          </span>
        </div>

        <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex items-center h-full">
          <button type="button" onClick={() => setShowMonitor(!showMonitor)}
            className={clsx('h-full px-3 text-[11px] font-semibold flex items-center gap-1 border-r border-subtle cursor-pointer transition-colors',
              showMonitor ? 'text-primary bg-primary/10' : 'text-secondary hover:text-app-text')}>
            <Radio size={12} /><span>External Watch</span>
          </button>
          <button type="button" onClick={() => window.lamApi?.minimizeWindow?.()} className="h-full px-3 text-muted hover:text-app-text hover:bg-white/10 cursor-pointer"><Minus size={12} /></button>
          <button type="button" onClick={() => window.lamApi?.maximizeWindow?.()} className="h-full px-3 text-muted hover:text-app-text hover:bg-white/10 cursor-pointer"><Square size={10} /></button>
          <button type="button" onClick={() => window.lamApi?.closeWindow?.()} className="h-full px-3 text-muted hover:text-white hover:bg-rose-600/80 cursor-pointer"><X size={13} /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden surface-panel">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AgentHeader />
          <div className="flex-1 overflow-hidden">
            <ChatTab />
          </div>
        </div>
        {showMonitor && (
          <div className="w-80 shrink-0 hidden md:block">
            <ExternalAgentWatchPane />
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};
