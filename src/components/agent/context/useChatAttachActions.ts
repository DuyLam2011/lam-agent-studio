import { useAgentStore } from '../../../store/useAgentStore';
import { resolveWorkspaceRepoInfo } from '../../../services/workspace/workspaceRepoResolver';

export const useChatAttachActions = () => {
  const {
    activeFile,
    editorSelection,
    addContextAttachment,
    setAddContextModalOpen,
    systemContext,
    addToast
  } = useAgentStore();

  const handleAddActiveFile = () => {
    if (!activeFile?.path) {
      addToast('No active editor file open', 'info');
      return false;
    }
    const name = activeFile.name || activeFile.path.split(/[/\\]/).pop() || 'file';
    const info = resolveWorkspaceRepoInfo(
      activeFile.path,
      systemContext.workspaces,
      systemContext.activeWorkspaceId,
      systemContext.cwd
    );
    addContextAttachment({
      id: `ctx-${Date.now()}`,
      name,
      path: activeFile.path,
      relativePath: activeFile.path,
      rootPath: info.rootPath,
      workspaceRepoTag: info.tag,
      type: 'file',
      tokenEstimate: Math.max(150, Math.ceil((activeFile.content?.length || 0) / 3.8)),
      pinned: true,
      snippet: activeFile.content ? activeFile.content.slice(0, 4000) : undefined
    });
    addToast(`Attached ${name} (${info.tag}) to AI context`, 'success');
    return true;
  };

  const handleAddGitDiff = () => {
    addContextAttachment({
      id: 'git-diff-ctx',
      name: 'Uncommitted Git Diff',
      path: 'git:diff',
      type: 'diff',
      tokenEstimate: 420,
      pinned: true
    });
    addToast('Attached Git Diff to context', 'success');
    return true;
  };

  const handleAddSelection = () => {
    if (!editorSelection?.text) return false;
    addContextAttachment({
      id: `sel-${Date.now()}`,
      name: `Selection (L${editorSelection.startLine}-L${editorSelection.endLine})`,
      path: editorSelection.filePath || 'snippet',
      type: 'snippet',
      tokenEstimate: Math.ceil(editorSelection.text.length / 3.8),
      pinned: true,
      snippet: editorSelection.text,
      lineRange: { startLine: editorSelection.startLine, endLine: editorSelection.endLine }
    });
    addToast('Attached editor selection snippet', 'success');
    return true;
  };

  return {
    activeFile,
    editorSelection,
    handleAddActiveFile,
    handleAddGitDiff,
    handleAddSelection,
    openBrowseModal: () => setAddContextModalOpen(true)
  };
};
