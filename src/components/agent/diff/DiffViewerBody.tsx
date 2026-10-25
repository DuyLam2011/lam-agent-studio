import React from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { AgentFileDiffSnapshot, useAgentStore } from '../../../store/useAgentStore';

interface DiffViewerBodyProps {
  diff: AgentFileDiffSnapshot;
}

export const DiffViewerBody: React.FC<DiffViewerBodyProps> = ({ diff }) => {
  const { themeMode } = useAgentStore();
  const monacoTheme = themeMode === 'light' ? 'vs' : 'vs-dark';
  const getLanguage = (path: string) => {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  const language = getLanguage(diff.filePath);

  return (
    <div className="flex-1 h-full min-h-[360px] rounded-xl overflow-hidden border border-white/10 bg-black/60 relative">
      <div className="absolute top-2 right-4 z-10 flex items-center gap-2 bg-black/80 px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono">
        <span className="text-emerald-400 font-semibold">+{diff.linesAdded} lines</span>
        <span>•</span>
        <span className="text-rose-400 font-semibold">-{diff.linesRemoved} lines</span>
      </div>

      <DiffEditor
        original={diff.originalContent || ''}
        modified={diff.newContent || ''}
        language={language}
        theme={monacoTheme}
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 12,
          automaticLayout: true,
          lineNumbers: 'on',
          wordWrap: 'off'
        }}
      />
    </div>
  );
};
