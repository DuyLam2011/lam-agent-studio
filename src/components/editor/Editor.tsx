import React, { useRef, useEffect } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { EditorEmptyState } from './EditorEmptyState';
import { EditorTabBar } from './EditorTabBar';
import { EditorActionBar } from './EditorActionBar';

const getLanguage = (file: string) => {
  const ext = file.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', html: 'html', css: 'css', md: 'markdown', yml: 'yaml', yaml: 'yaml'
  };
  return map[ext] || 'plaintext';
};

const FileEditor: React.FC = () => {
  const {
    activeFile, workflow, openTabs, activeTabIndex, closeTab,
    setActiveTabIndex, pinTab, setEditorSelection, themeMode
  } = useAgentStore();
  const monacoTheme = themeMode === 'light' ? 'vs' : 'vs-dark';
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    applyHighlightsAndScroll();

    const target = typeof editor.getModifiedEditor === 'function' ? editor.getModifiedEditor() : editor;
    target.onDidChangeCursorSelection(() => {
      const sel = target.getSelection();
      if (!sel || sel.isEmpty()) {
        setEditorSelection(null);
      } else {
        const model = target.getModel();
        setEditorSelection({
          text: model ? model.getValueInRange(sel) : '',
          startLine: sel.startLineNumber,
          endLine: sel.endLineNumber,
          filePath: activeFile?.path
        });
      }
    });
  };

  useEffect(() => {
    if (editorRef.current && activeFile) {
      applyHighlightsAndScroll();
    }
  }, [activeFile?.path, activeFile?.line, activeFile?.searchQuery]);

  const applyHighlightsAndScroll = () => {
    if (!editorRef.current || !activeFile) return;
    const target = typeof editorRef.current.getModifiedEditor === 'function'
      ? editorRef.current.getModifiedEditor()
      : editorRef.current;

    if (activeFile.line) {
      target.revealLineInCenter(activeFile.line);
      target.setPosition({ lineNumber: activeFile.line, column: 1 });

      if (activeFile.searchQuery && monacoRef.current) {
        const matches = target.getModel()?.findMatches(activeFile.searchQuery, false, false, false, null, true);
        const match = matches?.find((m: any) => m.range.startLineNumber === activeFile.line);
        decorationsRef.current = target.deltaDecorations(decorationsRef.current, match ? [
          { range: match.range, options: { inlineClassName: 'bg-primary/50 text-white font-bold rounded-sm' } }
        ] : []);
      }
    } else if (typeof target.deltaDecorations === 'function') {
      decorationsRef.current = target.deltaDecorations(decorationsRef.current, []);
    }
  };

  if (!activeFile) {
    return <EditorEmptyState workflowStatus={workflow.status} />;
  }

  const filename = activeFile.name || activeFile.path.split(/[/\\]/).pop() || '';

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative z-10 overflow-hidden">
      <EditorTabBar
        openTabs={openTabs}
        activeTabIndex={activeTabIndex}
        onSelectTab={setActiveTabIndex}
        onPinTab={pinTab}
        onCloseTab={closeTab}
      />
      <EditorActionBar />
      <div className="flex-1 overflow-hidden pt-0.5">
        {activeFile.isDiff ? (
          <DiffEditor
            height="100%"
            language={getLanguage(filename)}
            theme={monacoTheme}
            original={activeFile.originalContent?.replace(/\r\n/g, '\n') || ''}
            modified={activeFile.content?.replace(/\r\n/g, '\n') || ''}
            onMount={handleEditorDidMount}
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
        ) : (
          <Editor
            height="100%"
            language={getLanguage(filename)}
            theme={monacoTheme}
            value={activeFile.content}
            onMount={handleEditorDidMount}
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
        )}
      </div>
    </div>
  );
};

export default FileEditor;
