import React, { useEffect, useState } from 'react';
import { GitBranch, FolderGit2, FileCode, ChevronDown, ChevronUp } from 'lucide-react';
import { useAgentStore } from '../../../../store/useAgentStore';

interface WorkspaceAndDiffSelectorProps {
  selectedWsId: string;
  onSelectWsId: (id: string) => void;
  selectedRepoPath: string;
  onSelectRepoPath: (path: string) => void;
  includeDiff: boolean;
  onToggleIncludeDiff: (val: boolean) => void;
  gitDiffSnippet: string;
  onUpdateDiffSnippet: (diff: string) => void;
}

export const WorkspaceAndDiffSelector: React.FC<WorkspaceAndDiffSelectorProps> = ({
  selectedWsId, onSelectWsId, selectedRepoPath, onSelectRepoPath,
  includeDiff, onToggleIncludeDiff, gitDiffSnippet, onUpdateDiffSnippet
}) => {
  const { systemContext } = useAgentStore();
  const [showPreview, setShowPreview] = useState(false);
  const [diffStats, setDiffStats] = useState({ additions: 0, deletions: 0, filesCount: 0 });

  const activeWs = systemContext.workspaces.find(w => w.id === selectedWsId) || systemContext.workspaces[0];
  const repos = activeWs?.folders || [];

  useEffect(() => {
    if (!selectedRepoPath && repos.length > 0) onSelectRepoPath(repos[0]);
  }, [activeWs, selectedRepoPath]);

  useEffect(() => {
    if (!selectedRepoPath) return;
    const fetchDiff = async () => {
      try {
        const git = (window as any).lamApi?.git;
        const res = await git?.diff?.(selectedRepoPath);
        if (res?.success && res.data) {
          const diffText = res.data;
          onUpdateDiffSnippet(diffText);
          const adds = (diffText.match(/^\+[^+]/gm) || []).length;
          const dels = (diffText.match(/^-[^-]/gm) || []).length;
          const files = (diffText.match(/^diff --git/gm) || []).length;
          setDiffStats({ additions: adds, deletions: dels, filesCount: Math.max(1, files) });
        } else {
          onUpdateDiffSnippet('');
          setDiffStats({ additions: 0, deletions: 0, filesCount: 0 });
        }
      } catch {
        onUpdateDiffSnippet('');
      }
    };
    fetchDiff();
  }, [selectedRepoPath]);

  return (
    <div className="surface-card rounded-xl p-3 border border-subtle flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <FolderGit2 size={14} className="text-primary shrink-0" />
          <select
            value={selectedWsId}
            onChange={(e) => onSelectWsId(e.target.value)}
            className="surface-input rounded-lg px-2.5 py-1 text-xs border border-subtle text-app-text outline-none flex-1 font-medium"
          >
            {systemContext.workspaces.map(w => (
              <option key={w.id} value={w.id}>Workspace: {w.name}</option>
            ))}
          </select>
        </div>

        {repos.length > 0 && (
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <GitBranch size={13} className="text-muted shrink-0" />
            <select
              value={selectedRepoPath}
              onChange={(e) => onSelectRepoPath(e.target.value)}
              className="surface-input rounded-lg px-2.5 py-1 text-xs border border-subtle text-app-text outline-none flex-1 font-mono"
            >
              {repos.map(r => (
                <option key={r} value={r}>{r.split(/[/\\]/).pop() || r}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-subtle text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeDiff}
            onChange={(e) => onToggleIncludeDiff(e.target.checked)}
            className="rounded border-subtle text-primary focus:ring-0 cursor-pointer"
          />
          <span className="text-[11px] font-medium text-app-text">Include active Git Diff for contextual grounding</span>
          {diffStats.filesCount > 0 ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              +{diffStats.additions} / -{diffStats.deletions} ({diffStats.filesCount} files)
            </span>
          ) : (
            <span className="text-[10px] text-muted font-mono">(Clean tree / No active diffs)</span>
          )}
        </label>

        {gitDiffSnippet && (
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-[10.5px] text-primary hover:underline flex items-center gap-1 font-medium"
          >
            <FileCode size={11} />
            <span>{showPreview ? 'Hide Diff' : 'View Diff'}</span>
            {showPreview ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        )}
      </div>

      {showPreview && gitDiffSnippet && (
        <pre className="max-h-28 overflow-y-auto custom-scrollbar p-2 bg-black/50 rounded-lg text-[10px] font-mono text-gray-300 border border-subtle leading-tight whitespace-pre-wrap">
          {gitDiffSnippet.slice(0, 2000)}
        </pre>
      )}
    </div>
  );
};
