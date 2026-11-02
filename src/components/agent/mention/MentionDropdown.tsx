import React, { useEffect, useRef } from 'react';
import { FileCode, Folder, GitBranch, Terminal, Activity, AtSign, Star, Bot, Globe, Layers } from 'lucide-react';
import { MentionItem } from '../../../types/mention';
import clsx from 'clsx';

interface MentionDropdownProps {
  items: MentionItem[];
  selectedIndex: number;
  onSelect: (item: MentionItem) => void;
  onClose: () => void;
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  items,
  selectedIndex,
  onSelect
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (items.length === 0) return null;

  const renderIcon = (item: MentionItem) => {
    if (item.badge === 'ACTIVE') return <Star size={13} className="text-amber-400 shrink-0" />;
    switch (item.type) {
      case 'agent': return <Bot size={13} className="text-purple-400 shrink-0" />;
      case 'combo': return <Layers size={13} className="text-amber-400 shrink-0" />;
      case 'browser': return <Globe size={13} className="text-sky-400 shrink-0" />;
      case 'git': return <GitBranch size={13} className="text-emerald-400 shrink-0" />;
      case 'terminal': return <Terminal size={13} className="text-amber-400 shrink-0" />;
      case 'diagnostics': return <Activity size={13} className="text-purple-400 shrink-0" />;
      case 'folder': return <Folder size={13} className="text-amber-400 shrink-0" />;
      case 'file':
      default:
        return <FileCode size={13} className="text-primary shrink-0" />;
    }
  };

  return (
    <div className="surface-dropdown shadow-2xl overflow-hidden mb-2 animate-in fade-in slide-in-from-bottom-2 duration-150 z-50">
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-border bg-white/[0.02] flex items-center justify-between text-[10px] text-app-muted">
        <span className="flex items-center gap-1.5 font-semibold text-app-text">
          <AtSign size={12} className="text-primary" /> Mention Context
        </span>
        <span className="font-mono">{items.length} suggestions</span>
      </div>

      {/* Suggestion List */}
      <div ref={listRef} className="max-h-52 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
        {items.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={clsx(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors group",
                isSelected
                  ? "bg-primary/20 text-app-text border border-primary/30"
                  : "text-app-muted hover:bg-white/5 hover:text-app-text border border-transparent"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {renderIcon(item)}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-medium text-app-text truncate">{item.name}</span>
                    {item.workspaceRepoTag && (
                      <span
                        className="text-[9px] font-mono font-semibold px-1 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0"
                        title={`Workspace & Repo: (${item.workspaceRepoTag})`}
                      >
                        ({item.workspaceRepoTag})
                      </span>
                    )}
                    {item.badge && (
                      <span className={clsx(
                        "text-[8px] font-mono font-bold px-1 py-0.2 rounded uppercase",
                        item.badge === 'SUBAGENT' || item.badge === 'AGENT'
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : (item.badge === 'ACTIVE'
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-primary/20 text-primary border border-primary/30")
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {(item.rootPath || item.description) && (
                    <span className="text-[10px] text-app-muted truncate block font-mono" title={item.rootPath || item.description}>
                      {item.rootPath || item.description}
                    </span>
                  )}
                </div>
              </div>

              <span className="text-[9px] font-mono text-app-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                ↵ Attach
              </span>
            </button>
          );
        })}
      </div>

      {/* Keyboard Shortcuts Footer */}
      <div className="px-3 py-1 border-t border-border bg-black/40 flex items-center justify-between text-[9px] font-mono text-app-muted">
        <span>[↑/↓] Navigate</span>
        <span>[Enter/Tab] Attach</span>
        <span>[Esc] Dismiss</span>
      </div>
    </div>
  );
};
