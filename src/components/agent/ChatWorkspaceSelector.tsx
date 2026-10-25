import React, { useState, useRef, useEffect } from 'react';
import { Folder, ChevronDown, Check } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';

export const ChatWorkspaceSelector: React.FC = () => {
  const { systemContext, setActiveWorkspace } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = systemContext.workspaces.find(
    (w) => w.id === systemContext.activeWorkspaceId
  );
  const displayName = activeWorkspace ? activeWorkspace.name : 'Default Workspace';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="surface-card flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-app-text hover:text-primary transition-all max-w-[150px]"
        title={`Active Workspace: ${displayName}`}
      >
        <Folder size={12} className="text-blue-400 shrink-0" />
        <span className="truncate font-medium">{displayName}</span>
        <ChevronDown size={11} className="text-app-muted shrink-0" />
      </button>

      {isOpen && (
        <div className="surface-panel absolute top-full left-0 mt-1 w-56 p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[10px] font-semibold text-app-muted uppercase tracking-wider">
            Select Workspace
          </div>
          <button
            onClick={() => {
              setActiveWorkspace(null);
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 text-app-text text-left transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <Folder size={13} className="text-app-muted" />
              <span className="truncate">Default / Current Dir</span>
            </div>
            {!systemContext.activeWorkspaceId && <Check size={12} className="text-primary shrink-0" />}
          </button>

          {systemContext.workspaces.map((ws) => {
            const isSelected = ws.id === systemContext.activeWorkspaceId;
            return (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 text-left transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Folder size={13} className="text-blue-400 shrink-0" />
                  <div className="truncate">
                    <div className="truncate font-medium">{ws.name}</div>
                    {ws.folders[0] && (
                      <div className="text-[10px] text-gray-500 truncate font-mono">{ws.folders[0]}</div>
                    )}
                  </div>
                </div>
                {isSelected && <Check size={12} className="text-primary shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
