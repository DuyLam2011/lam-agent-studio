import React, { useState, useEffect } from 'react';
import { MousePointerClick, FileCode, Hash } from 'lucide-react';
import { useAgentStore, ContextAttachment } from '../../../store/useAgentStore';

interface ContextLineRangeTabProps {
  onAttach: (attachment: ContextAttachment) => void;
}

export const ContextLineRangeTab: React.FC<ContextLineRangeTabProps> = ({ onAttach }) => {
  const { activeFile, editorSelection, addToast } = useAgentStore();
  const [filePath, setFilePath] = useState(activeFile?.path || '');
  const [startLine, setStartLine] = useState<number>(1);
  const [endLine, setEndLine] = useState<number>(10);
  const [snippetPreview, setSnippetPreview] = useState<string>('');

  useEffect(() => {
    if (editorSelection && editorSelection.text) {
      setStartLine(editorSelection.startLine);
      setEndLine(editorSelection.endLine);
      setSnippetPreview(editorSelection.text);
      if (editorSelection.filePath) setFilePath(editorSelection.filePath);
    } else if (activeFile?.content) {
      const lines = activeFile.content.split('\n');
      const slice = lines.slice(Math.max(0, startLine - 1), endLine).join('\n');
      setSnippetPreview(slice);
    }
  }, [editorSelection, activeFile?.content, startLine, endLine]);

  const handleGrabEditorSelection = () => {
    if (!editorSelection || !editorSelection.text) {
      addToast('No code currently selected in editor. Highlight code in editor first.', 'info');
      return;
    }
    setStartLine(editorSelection.startLine);
    setEndLine(editorSelection.endLine);
    setSnippetPreview(editorSelection.text);
    if (editorSelection.filePath) setFilePath(editorSelection.filePath);
    addToast(`Grabbed lines ${editorSelection.startLine}-${editorSelection.endLine} from editor`, 'success');
  };

  const handleAttachSnippet = () => {
    if (!filePath.trim()) {
      addToast('Please select or specify a file path', 'error');
      return;
    }
    const name = filePath.split(/[/\\]/).pop() || filePath;
    const tokenEstimate = Math.max(80, Math.ceil((snippetPreview.length || 200) / 3.8));
    onAttach({
      id: `ctx-snippet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: `${name}:${startLine}-${endLine}`,
      path: filePath,
      type: 'snippet',
      tokenEstimate,
      pinned: true,
      lineRange: { startLine, endLine },
      snippet: snippetPreview
    });
  };

  return (
    <div className="space-y-3 text-xs">
      {/* 1-Click Grab Selection Banner */}
      <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MousePointerClick size={14} className="text-purple-400 shrink-0" />
          <span className="text-[11px] text-purple-200 truncate">
            {editorSelection?.text ? `Selection ready (${editorSelection.startLine}-${editorSelection.endLine})` : 'Highlight code in Editor to grab'}
          </span>
        </div>
        <button
          onClick={handleGrabEditorSelection}
          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-[10px] shrink-0 transition-colors shadow-sm"
        >
          Grab Selection
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-400 block mb-1">Start Line</label>
          <div className="relative">
            <Hash size={12} className="absolute left-2.5 top-2.5 text-gray-500" />
            <input
              type="number"
              min={1}
              value={startLine}
              onChange={(e) => setStartLine(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-1.5 pl-7 pr-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 block mb-1">End Line</label>
          <div className="relative">
            <Hash size={12} className="absolute left-2.5 top-2.5 text-gray-500" />
            <input
              type="number"
              min={startLine}
              value={endLine}
              onChange={(e) => setEndLine(Math.max(startLine, parseInt(e.target.value) || startLine))}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-1.5 pl-7 pr-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-gray-400 block mb-1">Snippet Preview</label>
        <pre className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-[10px] font-mono text-gray-300 max-h-32 overflow-y-auto custom-scrollbar whitespace-pre-wrap select-text">
          {snippetPreview || '// Selected line snippet preview will appear here'}
        </pre>
      </div>

      <button
        onClick={handleAttachSnippet}
        className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5"
      >
        <FileCode size={13} />
        <span>Attach Line Range ({startLine}-{endLine})</span>
      </button>
    </div>
  );
};
