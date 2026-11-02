import React, { useState, useEffect } from 'react';
import { Terminal, Palette, Blocks, CheckCircle2, ShieldAlert, X, RefreshCw, Cpu, Layers, Code2 } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { ContextBatchReviewCard } from './ContextBatchReviewCard';
import clsx from 'clsx';

export const ContextBatchSwarmModal: React.FC = () => {
  const {
    isSwarmModalOpen, setSwarmModalOpen, systemContext, subagentPersonas,
    addChatMessage, setRightPanelTab, setPanelVisible, addToast
  } = useAgentStore();
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
    if (isSwarmModalOpen) fetchBatch();
  }, [isSwarmModalOpen, systemContext.activeWorkspaceId]);

  if (!isSwarmModalOpen) return null;

  const handleSendToMainAgent = (review: any) => {
    if (!review) return;
    const issues = (review.findings || []).map((f: any, idx: number) =>
      `${idx + 1}. [${(f.severity || 'ISSUE').toUpperCase()}] **${f.title}**${f.filePath ? ` (\`${f.filePath}\`)` : ''}\n   ${f.description}${f.suggestion ? `\n   *Suggested fix*: ${f.suggestion}` : ''}`
    ).join('\n\n');

    const prompt = `Please remediate the following backend review findings from the Backend Review Specialist for **${review.target}**:\n\n**Executive Summary**:\n${review.summary}\n\n### Identified Issues:\n${issues || 'Review and optimize backend architecture.'}\n\nPlease inspect the code and apply the necessary patches using \`patch_file\` to resolve these issues.`;

    addChatMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      text: prompt,
      timestamp: Date.now()
    });

    setRightPanelTab('chat');
    setPanelVisible('agent', true);
    setSwarmModalOpen(false);
    addToast('Sent backend review findings to Father Agent for code remediation!', 'success');
  };

  const subagentPills = [
    { id: 'subagent-backend-reviewer', name: 'Backend Reviewer', icon: Code2, color: 'text-sky-400', role: 'Backend APIs, logic & code review', status: batchData?.backendReview ? `${batchData.backendReview.findingsCount} Findings` : 'Active' },
    { id: 'subagent-log-analyzer', name: 'Log Diagnostician', icon: Terminal, color: 'text-emerald-400', role: 'Runtime error stream & diagnostics', status: 'Active' },
    { id: 'subagent-ui-inspector', name: 'UI/UX Inspector', icon: Palette, color: 'text-purple-400', role: 'Design system & glassmorphism auditor', status: 'Aligned' },
    { id: 'subagent-mcp-bridge', name: 'MCP Bridge Protocol', icon: Blocks, color: 'text-cyan-400', role: 'Model context protocol & tool host', status: `${batchData?.mcpActiveCount || 2} Connected` },
    { id: 'subagent-qa-reviewer', name: 'QA & Diff Reviewer', icon: CheckCircle2, color: 'text-blue-400', role: 'Code integrity & patch verification', status: `${batchData?.gitStatus?.modified || 0} Diffs` },
    { id: 'subagent-security-harness', name: 'RedTeam Security', icon: ShieldAlert, color: 'text-amber-400', role: 'OWASP sandbox & execution guardrails', status: 'Hardened' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-panel w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <Cpu size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-100">Context Batch Swarm</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {subagentPersonas.length || 6} Agents Unified
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Unified live workspace intelligence distilled across subagents</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBatch}
              disabled={isLoading}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              title="Refresh Swarm Telemetry"
            >
              <RefreshCw size={13} className={clsx(isLoading && "animate-spin text-primary")} />
            </button>
            <button onClick={() => setSwarmModalOpen(false)} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* 6 Unified Agent Badges & Backend Review Card */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {subagentPills.map(({ id, name, icon: Icon, color, role, status }) => (
              <div key={id} className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-white/5 shrink-0"><Icon size={14} className={color} /></div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-200 truncate">{name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{role}</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-300 font-mono shrink-0">{status}</span>
              </div>
            ))}
          </div>

          {/* Backend Review Intelligence Feed */}
          <ContextBatchReviewCard backendReview={batchData?.backendReview} onSendToMainAgent={handleSendToMainAgent} />

          {/* Distilled Context Preview */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Layers size={13} className="text-cyan-400" />
                Live Distilled Context Injected into LLM
              </span>
              <span className="font-mono text-[10px] text-gray-500">Workspace: {systemContext.activeWorkspaceId ? 'Scoped' : 'Global'}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/50 border border-white/5 font-mono text-xs text-gray-300 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar select-text">
              {batchData?.distilledContext || 'Scanning workspace telemetry, active git diffs, and MCP servers...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
