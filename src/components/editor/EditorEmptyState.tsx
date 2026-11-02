import React from 'react';
import { Play } from 'lucide-react';

interface EditorEmptyStateProps {
  workflowStatus: string;
}

export const EditorEmptyState: React.FC<EditorEmptyStateProps> = ({ workflowStatus }) => {
  return (
    <div className="flex-1 p-8 flex items-center justify-center relative z-10 select-none">
      <div className="text-center max-w-md">
        <div className="mb-6 relative inline-block group">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all duration-500" />
          <div className="w-20 h-20 surface-card border border-white/10 rounded-2xl flex items-center justify-center relative shadow-2xl overflow-hidden group-hover:-translate-y-1 transition-transform duration-300">
            <Play size={32} className="text-primary ml-1" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2 tracking-tight">System Ready</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          The Agent-First architecture has been scaffolded successfully. Select a file to view its contents.
        </p>

        <div className="surface-card border border-white/10 rounded-xl p-4 text-left shadow-lg backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 uppercase font-semibold">Workflow Status</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          </div>
          <div className="font-mono text-sm text-green-400 truncate">
            {workflowStatus === 'idle' ? '> Waiting for tasks...' : '> Executing...'}
          </div>
        </div>
      </div>
    </div>
  );
};
