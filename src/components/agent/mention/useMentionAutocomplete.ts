import { useState, useEffect, useMemo } from 'react';
import { MentionItem } from '../../../types/mention';
import { useAgentStore } from '../../../store/useAgentStore';
import { listWorkspaceFilesAndFolders, packFolderContext, WorkspaceFileItem } from '../../../services/workspace/workspaceFileService';
import { buildMentionItems } from './mentionItemsBuilder';

export const useMentionAutocomplete = () => {
  const {
    systemContext,
    activeFile,
    subagentPersonas,
    getActiveSubagentsForContext,
    addContextAttachment,
    addToast
  } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFileItem[]>([]);
  const [workspaceFolders, setWorkspaceFolders] = useState<WorkspaceFileItem[]>([]);

  const ws = systemContext.workspaces.find((w) => w.id === systemContext.activeWorkspaceId);
  const wsPath = ws?.folders?.[0] || systemContext.cwd;

  useEffect(() => {
    (async () => {
      const res = await listWorkspaceFilesAndFolders(wsPath);
      setWorkspaceFiles(res.files);
      setWorkspaceFolders(res.folders);
    })();
  }, [wsPath]);

  const allItems = useMemo<MentionItem[]>(() => {
    const subagents = getActiveSubagentsForContext
      ? getActiveSubagentsForContext(systemContext.activeWorkspaceId || undefined, wsPath)
      : subagentPersonas;

    return buildMentionItems({
      activeFilePath: activeFile?.path,
      activeFileName: activeFile?.name,
      workspaceFolders,
      workspaceFiles,
      subagents,
      workspaces: systemContext.workspaces,
      activeWorkspaceId: systemContext.activeWorkspaceId,
      cwd: systemContext.cwd
    });
  }, [workspaceFiles, workspaceFolders, activeFile, subagentPersonas, getActiveSubagentsForContext, systemContext.workspaces, systemContext.activeWorkspaceId, systemContext.cwd, wsPath]);

  const filteredItems = useMemo(() => {
    if (!query) return allItems.slice(0, 20);
    const q = query.toLowerCase().replace(/\\/g, '/');
    return allItems
      .filter((item) => {
        if (item.type !== 'file' && item.type !== 'folder') {
          return item.name.toLowerCase().includes(q) || item.path.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
        }
        const rel = (item.relativePath || item.path || '').toLowerCase().replace(/\\/g, '/');
        const name = item.name.toLowerCase();
        return name.includes(q) || rel.includes(q);
      })
      .slice(0, 25);
  }, [allItems, query]);

  const handleTextChange = (text: string, cursorPos: number) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_\-./\\]*)$/);
    if (atMatch) {
      const q = atMatch[1];
      setIsOpen(true);
      setQuery(q);
      setMentionStartIndex(textBeforeCursor.length - q.length - 1);
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
    const tagLabel = item.relativePath || item.name;

    if (item.type === 'agent') {
      addToast(`Tagged subagent: @${item.name}`, 'info');
    } else if (item.type === 'folder') {
      await packFolderContext(item.path, item.name.replace(/\/$/, ''));
    } else {
      let content = '';
      if (item.type === 'file') {
        try {
          // @ts-ignore
          const res = await window.lamApi?.fs?.readFile?.(item.path);
          content = res?.success && typeof res.data === 'string' ? res.data : '';
        } catch {}
      }

      addContextAttachment({
        id: `ctx-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: item.name,
        path: item.path,
        relativePath: item.relativePath,
        rootPath: item.rootPath,
        workspaceRepoTag: item.workspaceRepoTag,
        type: item.type === 'file' ? 'file' : (item.type === 'git' ? 'diff' : 'diagnostics'),
        tokenEstimate: Math.max(80, Math.ceil((content.length || 300) / 3.8)),
        pinned: true,
        snippet: content.slice(0, 4000)
      });
      addToast(`Attached context: @${tagLabel}`, 'info');
    }

    const before = currentText.slice(0, mentionStartIndex);
    const after = currentText.slice(cursorPos);
    const mentionTag = `@${tagLabel} `;
    setIsOpen(false);
    return { updatedText: before + mentionTag + after, newCursorPos: before.length + mentionTag.length };
  };

  return {
    isOpen, setIsOpen, query, selectedIndex, setSelectedIndex,
    filteredItems, handleTextChange, applySelection
  };
};
