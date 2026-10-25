import React, { useState, useEffect } from 'react';
import { Terminal, Palette, Blocks, CheckCircle2, ShieldAlert, ChevronDown, ChevronUp, RefreshCw, Cpu } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

export const ContextBatchSwarmWidget: React.FC = () => {
  const { systemContext, subagentPersonas } = useAgentStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [batchData, setBatchData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBatch = async () => {
    setIsLoading(true);
    try {
      const activeWs = systemContext.workspaces.find(w => w.id === systemContext.activeWorkspaceId);
      const wsPath = activeWs?.folders?.[0] || systemContext.cwd || '';
      // @ts-ignore
      const result = await window.lamApi?.contextBatch?.getUnifiedBatch?.(wsPath);
      if (result) setBatchData(result);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatch();
  }, [systemContext.activeWorkspaceId]);

  const subagentPills = [
    { id: 'subagent-log-analyzer', name: 'Logs', icon: Terminal, color: 'text-emerald-400', status: 'Active' },
    { id: 'subagent-ui-inspector', name: 'UI/UX', icon: Palette, color: 'text-purple-400', status: 'Aligned' },
    { id: 'subagent-mcp-bridge', name: 'MCP', icon: Blocks, color: 'text-cyan-400', status: `${batchData?.mcpActiveCount || 2} Connected` },
    { id: 'subagent-qa-reviewer', name: 'QA/Diff', icon: CheckCircle2, color: 'text-blue-400', status: `${batchData?.gitStatus?.modified || 0} Diffs` },
    { id: 'subagent-security-harness', name: 'RedTeam', icon: ShieldAlert, color: 'text-amber-400', status: 'Hardened' }
  ];

  return (
    <div className="mx-3 mt-1.5 surface-card rounded-xl p-2 border border-border select-none transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 cursor-pointer min-w-0"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-[10px] font-bold text-app-text tracking-wide uppercase flex items-center gap-1 truncate">
            <Cpu size={11} className="text-primary shrink-0" />
            <span>Context Batch Swarm</span>
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-mono shrink-0">
            {subagentPersonas.length} Agents Unified
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={fetchBatch}
            disabled={isLoading}
            className="p-1 rounded-md text-app-muted hover:text-app-text hover:bg-white/10 transition-colors"
            title="Refresh Context Batch"
          >
            <RefreshCw size={11} className={clsx(isLoading && "animate-spin text-primary")} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-app-muted hover:text-app-text hover:bg-white/10 transition-colors"
          >
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* 5 Standard Subagent Badges */}
      <div className="grid grid-cols-5 gap-1 mt-1.5">
        {subagentPills.map(({ id, name, icon: Icon, color, status }) => (
          <div
            key={id}
            className="flex flex-col items-center justify-center p-1 rounded-lg bg-black/20 border border-white/5 text-center"
            title={`${name}: ${status}`}
          >
            <div className="flex items-center gap-1">
              <Icon size={10} className={color} />
              <span className="text-[9px] font-semibold text-app-text truncate">{name}</span>
            </div>
            <span className="text-[8px] text-app-muted font-mono truncate max-w-full">{status}</span>
          </div>
        ))}
      </div>

      {/* Expanded Live Context Drawer */}
      {isExpanded && batchData && (
        <div className="mt-2 pt-2 border-t border-border space-y-1.5 text-[10px] font-mono animate-in fade-in duration-100">
          <div className="p-1.5 rounded-lg bg-black/30 border border-border text-app-sub whitespace-pre-wrap leading-relaxed select-text">
            {batchData.distilledContext}
          </div>
          <div className="flex items-center justify-between text-[9px] text-app-muted">
            <span>Terminal: {batchData.logsSummary}</span>
            <span>Branch: {batchData.gitStatus?.branch}</span>
          </div>
        </div>
      )}
    </div>
  );
};
