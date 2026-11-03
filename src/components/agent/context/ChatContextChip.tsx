import React from 'react';
import { FileCode, Folder, GitCommit, MousePointerClick, X, Globe, Crosshair } from 'lucide-react';
import { ContextAttachment } from '../../../store/useAgentStore';
import { openFileInEditor } from '../../../services/workspace/workspaceFileService';

interface ChatContextChipProps {
  item: ContextAttachment;
  onRemove: (id: string) => void;
}

export const ChatContextChip: React.FC<ChatContextChipProps> = ({ item, onRemove }) => {
  const renderIcon = () => {
    if (item.type === 'dom_element') return <Crosshair size={10} className="text-sky-400" />;
    if (item.type === 'browser') return <Globe size={10} className="text-sky-400" />;
    if (item.type === 'snippet') return <MousePointerClick size={10} className="text-purple-400" />;
    if (item.type === 'diff') return <GitCommit size={10} className="text-amber-400" />;
    if (item.type === 'folder') return <Folder size={10} className="text-amber-400" />;
    return <FileCode size={10} className="text-cyan-400" />;
  };

  const titleText = `${item.workspaceRepoTag ? `(${item.workspaceRepoTag}) ` : ''}Root: ${item.rootPath || item.path} (Click to open)`;

  return (
    <div
      onClick={() => openFileInEditor(item.path, item.name, item.lineRange?.startLine)}
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-gray-200 shrink-0 group cursor-pointer transition-colors"
      title={titleText}
    >
      {renderIcon()}
      <span className="font-mono text-[10px] font-medium max-w-[120px] truncate group-hover:text-primary transition-colors">
        {item.name}
      </span>
      {item.workspaceRepoTag && (
        <span className="text-[8px] font-mono text-cyan-300 bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-500/20">
          ({item.workspaceRepoTag})
        </span>
      )}
      <span className="text-[9px] text-gray-500 font-mono">~{item.tokenEstimate}t</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        className="text-gray-400 hover:text-rose-400 ml-0.5 transition-colors"
        title="Remove Context"
      >
        <X size={10} />
      </button>
    </div>
  );
};
