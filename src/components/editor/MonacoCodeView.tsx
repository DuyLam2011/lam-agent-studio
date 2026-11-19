import React from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { ActiveFile } from '../../store/useAgentStore';

interface MonacoCodeViewProps {
  activeFile: ActiveFile;
  monacoTheme: string;
  onMount: (editor: any, monaco: any) => void;
}

const getLanguage = (file: string) => {
  const ext = file.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', html: 'html', css: 'css', md: 'markdown', yml: 'yaml', yaml: 'yaml'
  };
  return map[ext] || 'plaintext';
};

export const MonacoCodeView: React.FC<MonacoCodeViewProps> = ({
  activeFile,
  monacoTheme,
  onMount
}) => {
  const filename = activeFile.name || activeFile.path.split(/[/\\]/).pop() || '';

  if (activeFile.isDiff) {
    return (
      <DiffEditor
        height="100%"
        language={getLanguage(filename)}
        theme={monacoTheme}
        original={activeFile.originalContent?.replace(/\r\n/g, '\n') || ''}
        modified={activeFile.content?.replace(/\r\n/g, '\n') || ''}
        onMount={onMount}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "Consolas, 'Courier New', monospace",
          wordWrap: 'on',
          padding: { top: 8, bottom: 8 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          readOnly: true,
          renderSideBySide: true,
          ignoreTrimWhitespace: true,
          hideUnchangedRegions: { enabled: false }
        }}
      />
    );
  }

  return (
    <Editor
      height="100%"
      language={getLanguage(filename)}
      theme={monacoTheme}
      value={activeFile.content}
      onMount={onMount}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "Consolas, 'Courier New', monospace",
        wordWrap: 'on',
        padding: { top: 8, bottom: 8 },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        formatOnPaste: true,
        readOnly: true,
      }}
    />
  );
};
