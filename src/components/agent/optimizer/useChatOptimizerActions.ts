import { useMemo } from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { calculateTokenBudget } from '../../../services/tokenBudgetCalculator';
import { ContextOptimizationAction, TokenEstimationReport } from '../../../services/chatPromptOptimizerService';
import { resolveWorkspaceRepoInfo } from '../../../services/workspaceRepoResolver';

export const useChatOptimizerActions = (
  input: string,
  setInput: React.Dispatch<React.SetStateAction<string>>
) => {
  const {
    contextAttachments,
    removeContextAttachment,
    addContextAttachment,
    activeFile,
    systemContext,
    addToast
  } = useAgentStore();

  const report: TokenEstimationReport = useMemo(() => {
    return calculateTokenBudget(
      input,
      contextAttachments,
      activeFile?.content,
      /concise|ngắn gọn|tối giản|tinh gọn/i.test(input)
    );
  }, [input, contextAttachments, activeFile?.content]);

  const handleApplyAction = (action: ContextOptimizationAction) => {
    switch (action.actionType) {
      case 'attach_git': {
        addContextAttachment({
          id: `git-diff-${Date.now()}`,
          name: 'Uncommitted Git Diff',
          path: 'git:diff',
          type: 'diff',
          tokenEstimate: 400,
          pinned: true
        });
        addToast(`Grounding in @GitDiff (saved ~${action.estimatedSavingsTokens} tokens)`, 'success');
        break;
      }
      case 'use_active_file_only': {
        contextAttachments.filter(a => a.type === 'folder').forEach(a => removeContextAttachment(a.id));
        if (activeFile?.path) {
          const info = resolveWorkspaceRepoInfo(activeFile.path, systemContext.workspaces, systemContext.activeWorkspaceId, systemContext.cwd);
          addContextAttachment({
            id: `ctx-${Date.now()}`,
            name: activeFile.name || 'active-file',
            path: activeFile.path,
            relativePath: activeFile.path,
            rootPath: info.rootPath,
            workspaceRepoTag: info.tag,
            type: 'file',
            tokenEstimate: Math.max(150, Math.ceil((activeFile.content?.length || 0) / 3.8)),
            pinned: true
          });
        }
        addToast(`Trimmed to active file (saved ~${action.estimatedSavingsTokens} tokens)`, 'success');
        break;
      }
      case 'enable_concise_mode': {
        const concisePill = ' [Concise Mode: Direct code patch, minimal token explanation]';
        if (!input.includes('Concise Mode')) {
          setInput(prev => prev.trim() + concisePill);
        }
        addToast(`Enabled concise mode (saved ~${action.estimatedSavingsTokens} tokens)`, 'success');
        break;
      }
      case 'window_active_file': {
        if (activeFile?.path) {
          addContextAttachment({
            id: `ctx-win-${Date.now()}`,
            name: `${activeFile.name || 'file'} (L1-100)`,
            path: activeFile.path,
            type: 'snippet',
            tokenEstimate: 350,
            pinned: true,
            snippet: activeFile.content ? activeFile.content.split('\n').slice(0, 100).join('\n') : undefined
          });
          addToast(`Windowed active file to 100 lines (saved ~${action.estimatedSavingsTokens} tokens)`, 'success');
        }
        break;
      }
      default:
        break;
    }
  };

  const handleInsertTag = (tag: string) => {
    if (!input.includes(tag)) {
      setInput(prev => `${tag} ${prev}`.trim());
      addToast(`Tagged ${tag} into prompt`, 'info');
    }
  };

  const handleSelectPattern = (template: string) => {
    setInput(template);
    addToast('Prompt pattern loaded', 'info');
  };

  return {
    report,
    handleApplyAction,
    handleInsertTag,
    handleSelectPattern
  };
};
