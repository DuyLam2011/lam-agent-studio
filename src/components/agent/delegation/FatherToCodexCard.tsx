import React, { useState } from 'react';
import { TaskContractSpec } from '../../../types/delegation';
import { Bot, ChevronDown, CheckCircle2, Play, Shield, Terminal, FileCode2 } from 'lucide-react';
import clsx from 'clsx';

interface FatherToCodexCardProps {
  contract: TaskContractSpec;
  onAuthorize?: (contractId: string) => void;
  isExecuting?: boolean;
}

export const FatherToCodexCard: React.FC<FatherToCodexCardProps> = ({
  contract,
  onAuthorize,
  isExecuting = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPending = contract.status === 'pending_approval';
  const isCompleted = contract.status === 'completed';

  return (
    <div className="surface-card my-2.5 rounded-2xl border border-primary/20 overflow-hidden shadow-lg backdrop-blur-xl text-xs">
      {/* Header Banner */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-primary/10 via-emerald-500/5 to-transparent border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <Bot size={14} />
          </div>
          <div>
            <div className="font-bold text-gray-200 flex items-center gap-1.5">
              <span>Father Agent</span>
              <span className="text-gray-500 font-mono">➔</span>
              <span className="text-emerald-400">Coding Agent (Codex)</span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono">Contract: {contract.contract_id}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={clsx(
            "px-2 py-0.5 rounded-full text-[9.5px] font-semibold border flex items-center gap-1",
            isPending && "bg-amber-500/15 text-amber-300 border-amber-500/30",
            contract.status === 'executing' && "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 animate-pulse",
            isCompleted && "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
          )}>
            {isCompleted ? <CheckCircle2 size={10} /> : <Terminal size={10} />}
            <span>{isPending ? 'Pending Approval' : contract.status === 'executing' ? 'Executing...' : 'Verified'}</span>
          </span>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            title={isExpanded ? 'Collapse details' : 'View handoff details'}
          >
            <ChevronDown size={14} className={clsx("transition-transform", isExpanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Cleared Requirements & Action Gate */}
      <div className="p-3.5 space-y-2.5">
        <div className="text-gray-300 font-medium">📋 <span className="font-semibold text-gray-200">Handoff Specification (Cleared Requirements):</span></div>
        <ul className="space-y-1 pl-4 list-disc text-gray-300 text-[11px]">
          {contract.cleared_requirements.map((req, idx) => (
            <li key={idx} className="leading-relaxed">{req}</li>
          ))}
        </ul>

        {/* Target Files Preview */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono pt-1">
          <span className="text-gray-400 flex items-center gap-1"><FileCode2 size={11} /> Target:</span>
          {contract.target_files.map((f, i) => (
            <span key={i} className="px-1.5 py-0.2 rounded bg-black/40 border border-white/10 text-cyan-300">{f}</span>
          ))}
        </div>

        {/* 2A: One-Click Proceed Button */}
        {isPending && onAuthorize && (
          <div className="pt-2 flex items-center justify-between border-t border-white/5">
            <span className="text-[10px] text-gray-400 italic">Father Agent cleared the context and is ready to delegate execution.</span>
            <button
              type="button"
              onClick={() => onAuthorize(contract.contract_id)}
              disabled={isExecuting}
              className="px-3.5 py-1.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play size={12} className="fill-white" />
              <span>{isExecuting ? 'Worker executing...' : 'Authorize Coding Execution'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 1A: Collapsible Detailed Invariants & Verification Section */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-2 border-t border-white/5 bg-black/20 space-y-2 text-[10.5px]">
          <div className="font-semibold text-gray-300 flex items-center gap-1.5">
            <Shield size={12} className="text-primary" />
            <span>Architectural Invariants &amp; Acceptance Gates:</span>
          </div>
          <div className="space-y-1 font-mono text-gray-400 pl-4 border-l-2 border-primary/30">
            {contract.invariants.map((inv, idx) => (
              <div key={idx}>• {inv}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
