import React from 'react';
import { Brain, Globe, Folder, GitBranch } from 'lucide-react';
import { SubagentPersona } from '../../../types/subagents';
import clsx from 'clsx';

export const ScopeBadge: React.FC<{ scope: SubagentPersona['scope'] }> = ({ scope }) => {
  switch (scope) {
    case 'global':
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono flex items-center gap-1">
          <Globe size={9} /> GLOBAL
        </span>
      );
    case 'workspace':
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono flex items-center gap-1">
          <Folder size={9} /> WORKSPACE
        </span>
      );
    case 'repo':
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono flex items-center gap-1">
          <GitBranch size={9} /> REPO
        </span>
      );
  }
};

export const ReasoningBadge: React.FC<{ effort: SubagentPersona['reasoningEffort'] }> = ({ effort }) => {
  const colors: Record<string, string> = {
    high: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    medium: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    low: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    off: 'text-neutral-500 bg-white/5 border-white/5'
  };
  return (
    <span className={clsx("text-[9px] px-1.5 py-0.5 rounded-full border font-mono flex items-center gap-1", colors[effort] || colors.medium)}>
      <Brain size={9} /> {effort.toUpperCase()} REASONING
    </span>
  );
};
