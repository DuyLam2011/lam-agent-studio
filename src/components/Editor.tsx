import React, { useRef, useEffect } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { Play, X } from 'lucide-react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import clsx from 'clsx';

const FileEditor: React.FC = () => {
  const { activeFile, workflow, openTabs, activeTabIndex, closeTab, setActiveTabIndex, pinTab } = useAgentStore();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    applyHighlightsAndScroll();
  };

  useEffect(() => {
    if (editorRef.current && activeFile) {
      applyHighlightsAndScroll();
    }
  }, [activeFile?.path, activeFile?.line, activeFile?.searchQuery]);

  const applyHighlightsAndScroll = () => {
    if (!editorRef.current || !activeFile) return;

    // Check if it's a DiffEditor (has getModifiedEditor) or regular Editor
    const isDiffEditor = typeof editorRef.current.getModifiedEditor === 'function';
    const targetEditor = isDiffEditor ? editorRef.current.getModifiedEditor() : editorRef.current;

    if (activeFile.line) {
      targetEditor.revealLineInCenter(activeFile.line);
      targetEditor.setPosition({ lineNumber: activeFile.line, column: 1 });

      if (activeFile.searchQuery && monacoRef.current) {
        const matches = targetEditor.getModel()?.findMatches(
          activeFile.searchQuery,
          false,
          false,
          false,
          null,
          true
        );

        const matchOnLine = matches?.find((m: any) => m.range.startLineNumber === activeFile.line);

        if (matchOnLine) {
          decorationsRef.current = targetEditor.deltaDecorations(decorationsRef.current, [
            {
              range: matchOnLine.range,
              options: { inlineClassName: 'bg-primary/50 text-white font-bold rounded-sm' }
            }
          ]);
        } else {
          decorationsRef.current = targetEditor.deltaDecorations(decorationsRef.current, []);
        }
      }
    } else {
      if (typeof targetEditor.deltaDecorations === 'function') {
        decorationsRef.current = targetEditor.deltaDecorations(decorationsRef.current, []);
      }
    }
  };

  if (!activeFile) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center relative z-10">
        <div className="text-center max-w-md">
          <div className="mb-6 relative inline-block group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all duration-500"></div>
            <div className="w-20 h-20 bg-black/20 border border-white/10 rounded-2xl flex items-center justify-center relative shadow-2xl overflow-hidden group-hover:-translate-y-1 transition-transform duration-300">
              <Play size={32} className="text-primary ml-1" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2 tracking-tight">System Ready</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            The Agent-First architecture has been scaffolded successfully. Select a file to view its contents.
          </p>

          <div className="bg-black/20 border border-white/10 rounded-xl p-4 text-left shadow-lg backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500 uppercase font-semibold">Workflow Status</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </div>
            <div className="font-mono text-sm text-green-400 truncate">
              {workflow.status === 'idle' ? '> Waiting for tasks...' : '> Executing...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filename = activeFile.path.split(/[/\\]/).pop() || '';
  
  const getLanguage = (file: string) => {
    const ext = file.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': case 'tsx': return 'typescript';
      case 'js': case 'jsx': return 'javascript';
      case 'json': return 'json';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'md': return 'markdown';
      case 'yml': case 'yaml': return 'yaml';
      default: return 'plaintext';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] relative z-10 overflow-hidden rounded-b-3xl">
      <div className="flex overflow-x-auto custom-scrollbar bg-black/40 border-b border-white/5 shrink-0 min-h-[40px]">
        {openTabs.map((tab, index) => {
          const tabFilename = tab.path.split(/[/\\]/).pop() || '';
          const isActive = index === activeTabIndex;
          return (
            <div 
              key={`${tab.path}-${index}`}
              onClick={() => setActiveTabIndex(index)}
              onDoubleClick={() => pinTab(index)}
              className={clsx(
                "group flex items-center h-10 px-3 border-r border-white/5 cursor-pointer shrink-0 transition-colors border-t-2",
                isActive ? "bg-[#1e1e1e] border-t-primary" : "hover:bg-white/5 border-t-transparent text-gray-400"
              )}
            >
              <span className={clsx(
                "w-2 h-2 rounded-full mr-2 shrink-0",
                tab.isDiff ? "bg-purple-500/50" : "bg-blue-500/50"
              )}></span>
              <span className={clsx(
                "text-xs tracking-wide mr-2 select-none",
                tab.isPreview ? "italic" : "",
                isActive ? "text-gray-200 font-medium" : "text-gray-400 font-normal"
              )}>
                {tabFilename}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); closeTab(index); }}
                className={clsx(
                  "p-0.5 rounded transition-colors",
                  isActive ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-transparent group-hover:text-gray-500 hover:text-white hover:bg-white/10"
                )}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex-1 overflow-hidden pt-2">
        {activeFile.isDiff ? (
          <DiffEditor
            height="100%"
            language={getLanguage(filename)}
            theme="vs-dark"
            original={activeFile.originalContent?.replace(/\r\n/g, '\n') || ''}
            modified={activeFile.content?.replace(/\r\n/g, '\n') || ''}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "Consolas, 'Courier New', monospace",
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
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
            theme="vs-dark"
            value={activeFile.content}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "Consolas, 'Courier New', monospace",
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              formatOnPaste: true,
              readOnly: true, // Read-only for now until file saving is implemented
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FileEditor;
