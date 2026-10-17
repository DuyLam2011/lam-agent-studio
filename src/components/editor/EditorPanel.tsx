import React from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import FileEditor from './Editor';
import { DynamicPanelHeader } from '../layout/DynamicPanelHeader';

export const EditorPanel: React.FC<{ isCenter?: boolean }> = () => {
  const { openTabs, activeFile } = useAgentStore();

  return (
    <div className="flex flex-col h-full overflow-hidden w-full relative">
      <DynamicPanelHeader panelId="editor">
        {activeFile && (
          <span className="text-[10px] text-gray-500 font-mono truncate max-w-[140px]">
            {activeFile.name || activeFile.path.split(/[/\\]/).pop()}
          </span>
        )}
        {openTabs.length > 0 && (
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-gray-400 font-mono">
            {openTabs.length} tabs
          </span>
        )}
      </DynamicPanelHeader>

      <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">
        <FileEditor />
      </div>
    </div>
  );
};
