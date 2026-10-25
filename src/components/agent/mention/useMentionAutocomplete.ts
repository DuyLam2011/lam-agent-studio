import { useState, useEffect, useMemo } from 'react';
import { MentionItem } from '../../../types/mention';
import { useAgentStore } from '../../../store/useAgentStore';

export const useMentionAutocomplete = () => {
  const { systemContext, activeFile, addContextAttachment, addToast } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [workspaceFiles, setWorkspaceFiles] = useState<string[]>([]);

  // Fetch workspace files
  useEffect(() => {
    const fetchFiles = async () => {
      const ws = systemContext.workspaces.find(w => w.id === systemContext.activeWorkspaceId);
      const rootPath = ws?.folders?.[0] || systemContext.cwd;
      try {
        // @ts-ignore
        const res = await window.lamApi?.file?.search?.(rootPath, '', 150);
        if (res?.success && Array.isArray(res.files)) {
          setWorkspaceFiles(res.files.map((f: any) => typeof f === 'string' ? f : f.path || f.name));
        } else if (activeFile?.path) {
          setWorkspaceFiles([activeFile.path]);
        }
      } catch {
        if (activeFile?.path) setWorkspaceFiles([activeFile.path]);
      }
    };
    fetchFiles();
  }, [systemContext.activeWorkspaceId, activeFile?.path]);

  // Build candidate items
  const allItems = useMemo<MentionItem[]>(() => {
    const items: MentionItem[] = [
      { id: 'ctx-git', name: 'git', path: 'git:status', type: 'git', description: 'Workspace git status & modified diffs', badge: 'GIT' },
      { id: 'ctx-term', name: 'terminal', path: 'terminal:buffer', type: 'terminal', description: 'Recent terminal output & errors', badge: 'PTY' },
      { id: 'ctx-diag', name: 'diagnostics', path: 'system:diagnostics', type: 'diagnostics', description: 'System health & security finding audit', badge: 'DIAG' }
    ];

    if (activeFile?.path) {
      items.unshift({
        id: `file-active-${activeFile.path}`,
        name: activeFile.name || activeFile.path.split(/[/\\]/).pop() || 'active-file',
        path: activeFile.path,
        type: 'file',
        description: 'Currently focused in editor',
        badge: 'ACTIVE'
      });
    }

    workspaceFiles.forEach((f) => {
      if (activeFile?.path === f) return;
      const fileName = f.split(/[/\\]/).pop() || f;
      items.push({
        id: `file-${f}`,
        name: fileName,
        path: f,
        type: 'file',
        description: f.length > 40 ? `...${f.slice(-37)}` : f
      });
    });

    return items;
  }, [workspaceFiles, activeFile]);

  // Filter items by query
  const filteredItems = useMemo(() => {
    if (!query) return allItems.slice(0, 15);
    const q = query.toLowerCase();
    return allItems
      .filter(item => item.name.toLowerCase().includes(q) || item.path.toLowerCase().includes(q))
      .slice(0, 15);
  }, [allItems, query]);

  // Handle input text changes to detect `@`
  const handleTextChange = (text: string, cursorPos: number) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_\-./\\]*)$/);

    if (atMatch) {
      const q = atMatch[1];
      const startIdx = textBeforeCursor.length - q.length - 1;
      setIsOpen(true);
      setQuery(q);
      setMentionStartIndex(startIdx);
      setSelectedIndex(0);
    } else {
      setIsOpen(false);
    }
  };

  const applySelection = async (
    item: MentionItem,
    currentText: string,
    cursorPos: number
  ): Promise<{ updatedText: string; newCursorPos: number }> => {
    let content = '';
    if (item.type === 'file') {
      try {
        // @ts-ignore
        const res = await window.lamApi?.file?.read?.(item.path);
        content = res?.content || res || '';
      } catch {}
    }

    addContextAttachment({
      id: `ctx-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: item.name,
      path: item.path,
      type: item.type === 'file' ? 'file' : (item.type === 'git' ? 'diff' : 'diagnostics'),
      tokenEstimate: Math.max(80, Math.ceil((content.length || 300) / 3.8)),
      pinned: true,
      snippet: content.slice(0, 3000)
    });

    addToast(`Attached context: @${item.name}`, 'info');

    // Replace @query with @name
    const before = currentText.slice(0, mentionStartIndex);
    const after = currentText.slice(cursorPos);
    const mentionTag = `@${item.name} `;
    const updatedText = before + mentionTag + after;
    const newCursorPos = before.length + mentionTag.length;

    setIsOpen(false);
    return { updatedText, newCursorPos };
  };

  return {
    isOpen,
    setIsOpen,
    query,
    selectedIndex,
    setSelectedIndex,
    filteredItems,
    handleTextChange,
    applySelection
  };
};
