import { useAgentStore, ActiveFile, ContextAttachment } from '../../store/useAgentStore';
import { resolveWorkspaceRepoInfo } from './workspaceRepoResolver';

export const addActiveFileToChatContext = (file: ActiveFile): ContextAttachment => {
  const store = useAgentStore.getState();
  const fileName = file.name || file.path.split(/[/\\]/).pop() || 'file';
  const info = resolveWorkspaceRepoInfo(
    file.path,
    store.systemContext.workspaces,
    store.systemContext.activeWorkspaceId,
    store.systemContext.cwd
  );
  const attachment: ContextAttachment = {
    id: `ctx-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    name: fileName,
    path: file.path,
    relativePath: file.path,
    rootPath: info.rootPath,
    workspaceRepoTag: info.tag,
    type: 'file',
    tokenEstimate: Math.max(120, Math.ceil((file.content?.length || 400) / 3.8)),
    pinned: true,
    snippet: file.content ? file.content.slice(0, 4000) : undefined
  };

  store.addContextAttachment(attachment);
  store.addToast(`Attached ${fileName} (${info.tag}) to Chat Context`, 'success');
  return attachment;
};

export const addSelectionToChatContext = (
  selection: { text: string; startLine: number; endLine: number; filePath?: string },
  file?: ActiveFile | null
): ContextAttachment => {
  const store = useAgentStore.getState();
  const fileName = file?.name || (selection.filePath ? selection.filePath.split(/[/\\]/).pop() : 'selection') || 'selection';
  const name = `${fileName}#L${selection.startLine}-L${selection.endLine}`;

  const basePath = selection.filePath || file?.path || 'snippet';
  const info = resolveWorkspaceRepoInfo(
    basePath,
    store.systemContext.workspaces,
    store.systemContext.activeWorkspaceId,
    store.systemContext.cwd
  );
  const attachment: ContextAttachment = {
    id: `ctx-sel-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    name,
    path: `${basePath}#L${selection.startLine}-L${selection.endLine}`,
    relativePath: file?.path || selection.filePath,
    rootPath: `${info.rootPath}#L${selection.startLine}-L${selection.endLine}`,
    workspaceRepoTag: info.tag,
    type: 'snippet',
    tokenEstimate: Math.max(60, Math.ceil(selection.text.length / 3.8)),
    pinned: true,
    lineRange: { startLine: selection.startLine, endLine: selection.endLine },
    snippet: selection.text
  };

  store.addContextAttachment(attachment);
  store.addToast(`Attached selection (${selection.startLine}-${selection.endLine}) (${info.tag}) to Context`, 'success');
  return attachment;
};

export const triggerExplainInChat = (
  file?: ActiveFile | null,
  selection?: { text: string; startLine: number; endLine: number; filePath?: string } | null
) => {
  const store = useAgentStore.getState();
  let prompt = '';
  const fileName = file?.name || file?.path?.split(/[/\\]/).pop() || 'file';

  if (selection && selection.text.trim()) {
    addSelectionToChatContext(selection, file);
    prompt = `Hãy giải thích chi tiết đoạn mã sau trong file ${fileName} (dòng ${selection.startLine}-${selection.endLine}):\n\`\`\`\n${selection.text}\n\`\`\`\nPhân tích mục đích, luồng hoạt động logic và các lưu ý khi triển khai.`;
  } else if (file) {
    addActiveFileToChatContext(file);
    prompt = `Hãy giải thích kiến trúc tổng thể, mục đích và luồng xử lý của file ${fileName} (${file.path}).`;
  } else {
    store.addToast('Không có file hoặc đoạn mã nào được chọn để giải thích', 'info');
    return;
  }

  store.setRightPanelTab('chat');
  store.setPanelVisible?.('agent', true);
  store.setPendingChatPrompt(prompt);
};

export const triggerReviewInChat = (
  file?: ActiveFile | null,
  selection?: { text: string; startLine: number; endLine: number; filePath?: string } | null
) => {
  const store = useAgentStore.getState();
  let prompt = '';
  const fileName = file?.name || file?.path?.split(/[/\\]/).pop() || 'file';

  if (selection && selection.text.trim()) {
    addSelectionToChatContext(selection, file);
    prompt = `Hãy review chi tiết đoạn mã sau trong file ${fileName} (dòng ${selection.startLine}-${selection.endLine}):\n\`\`\`\n${selection.text}\n\`\`\`\nĐánh giá theo các tiêu chí: Clean code, Modularization (<150 dòng), Security vulnerabilities, và Đề xuất cải tiến cụ thể.`;
  } else if (file) {
    addActiveFileToChatContext(file);
    prompt = `Hãy review chi tiết toàn bộ file ${fileName} (${file.path}):\nĐánh giá theo các tiêu chí: Kiến trúc, Clean code, Giới hạn modularization (<150 dòng), Rủi ro bảo mật/ngoại lệ, và Đề xuất cải tiến cụ thể.`;
  } else {
    store.addToast('Không có file hoặc đoạn mã nào được chọn để review', 'info');
    return;
  }

  store.setRightPanelTab('chat');
  store.setPanelVisible?.('agent', true);
  store.setPendingChatPrompt(prompt);
};
