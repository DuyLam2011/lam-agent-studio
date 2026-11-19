import React from 'react';
import { FileCode, Cpu, Brain, Zap } from 'lucide-react';
import { CodeGraphStats } from '../../../types/code-graph';

interface GraphStatsCardsProps {
  stats: CodeGraphStats;
}

export const GraphStatsCards: React.FC<GraphStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-4 gap-3 p-4 shrink-0">
      <div className="surface-card p-2.5 rounded-xl border border-subtle flex items-center gap-2.5">
        <FileCode size={16} className="text-cyan-400" />
        <div>
          <div className="text-sm font-bold text-app-text">{stats.totalFiles}</div>
          <div className="text-[10px] text-muted">Parsed Source Files</div>
        </div>
      </div>
      <div className="surface-card p-2.5 rounded-xl border border-subtle flex items-center gap-2.5">
        <Cpu size={16} className="text-emerald-400" />
        <div>
          <div className="text-sm font-bold text-app-text">{stats.totalSymbols}</div>
          <div className="text-[10px] text-muted">AST Code Symbols</div>
        </div>
      </div>
      <div className="surface-card p-2.5 rounded-xl border border-subtle flex items-center gap-2.5">
        <Brain size={16} className="text-purple-400" />
        <div>
          <div className="text-sm font-bold text-app-text">{stats.totalMemories}</div>
          <div className="text-[10px] text-muted">Connected Memories</div>
        </div>
      </div>
      <div className="surface-card p-2.5 rounded-xl border border-subtle flex items-center gap-2.5">
        <Zap size={16} className="text-amber-400" />
        <div>
          <div className="text-sm font-bold text-amber-300">~85% Saved</div>
          <div className="text-[10px] text-muted">Token Budget Savings</div>
        </div>
      </div>
    </div>
  );
};
