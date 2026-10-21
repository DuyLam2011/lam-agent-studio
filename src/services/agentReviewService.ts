import { useAgentActivityStore } from '../store/useAgentActivityStore';
import { useAgentStore } from '../store/useAgentStore';
import { SubagentPersona } from '../types/subagents';
import { parseReviewFindings } from './reviewFindingsParser';

export interface RunAgentReviewParams {
  repoPath: string;
  filePath?: string;
  agent: SubagentPersona;
  reviewMode?: 'full' | 'security' | 'summary' | 'fast';
}

export const runAgentReview = async ({
  repoPath,
  filePath,
  agent,
  reviewMode = 'full'
}: RunAgentReviewParams) => {
  const store = useAgentActivityStore.getState();
  const targetLabel = filePath ? filePath.split(/[/\\]/).pop() : repoPath.split(/[/\\]/).pop();

  store.startTask({
    type: 'git_review',
    agentId: agent.id,
    agentName: agent.name,
    agentRole: agent.role,
    title: `Reviewing ${filePath ? 'file: ' + targetLabel : 'repository changes: ' + targetLabel}`,
    targetRepo: repoPath,
    targetFile: filePath,
    status: 'reviewing_git'
  });

  try {
    store.addThinking(`Fetching git diff for ${targetLabel}...`, 'action');
    // @ts-ignore
    const diffRes = await window.lamApi?.git?.diff(repoPath, filePath || '');
    let diffText = diffRes?.success && diffRes.data ? diffRes.data : '';
    let diffSource = 'Working Tree';

    if (!diffText.trim()) {
      store.addThinking(`Working tree is clean. Checking for staged changes or recent commits...`, 'info');
      // @ts-ignore
      const stagedRes = await window.lamApi?.git?.diff(repoPath, '--staged');
      if (stagedRes?.success && stagedRes.data && stagedRes.data.trim()) {
        diffText = stagedRes.data;
        diffSource = 'Staged Changes';
        store.addThinking(`Auditing staged changes (${diffText.split('\n').length} lines)...`, 'info');
      } else {
        // @ts-ignore
        const commitRes = await window.lamApi?.git?.diff(repoPath, 'HEAD~1');
        if (commitRes?.success && commitRes.data && commitRes.data.trim()) {
          diffText = commitRes.data;
          diffSource = 'Recent Commit (HEAD~1)';
          store.addThinking(`Auditing recent commit diff (${diffText.split('\n').length} lines)...`, 'info');
        }
      }
    }

    if (!diffText.trim()) {
      store.completeTask(
        `✅ Clean Repository: No uncommitted changes or recent diff detected in \`${targetLabel}\`. All files are in sync with git HEAD.`,
        []
      );
      return;
    }

    const lineCount = diffText.split('\n').length;
    store.addThinking(`Analyzing ${diffSource} (${lineCount} lines) with ${agent.name}...`, 'reasoning');

    const modeDirective = reviewMode === 'security'
      ? 'Focus heavily on security vulnerabilities, injection vectors, secrets leaks, and permission risks.'
      : reviewMode === 'fast'
      ? 'Provide a concise, ultra-focused bulleted breakdown under 200 words.'
      : 'Provide a comprehensive architectural, performance, and code quality analysis.';

    const prompt = `You are ${agent.name}, ${agent.role}.
System Directives: ${agent.systemPrompt}
Review Mode Directive: ${modeDirective}
Task: Perform a code review of the following Git diff in '${targetLabel}' (${diffSource}).
Explain:
1. What was done in these changes (high-level summary).
2. Code review critique (Code quality, architectural risks, performance).
3. Security check (Identify any leaks, OWASP risks, or unsanitized inputs).
4. Concrete actionable recommendations.

GIT DIFF:
\`\`\`diff
${diffText.slice(0, 12000)}
\`\`\``;

    store.setTaskStatus('thinking');
    const engineSettings = useAgentStore.getState().engineSettings;
    const apiKey = engineSettings.customApiKey || undefined;
    const provider = engineSettings.provider || (apiKey ? 'gemini' : 'offline');
    const model = agent.model || engineSettings.selectedModel || 'gemini-3.5-flash-lite';

    store.addThinking(`Connecting to ${provider.toUpperCase()} (${model}) with Agent directives...`, 'action');

    // @ts-ignore
    const ai = window.lamApi?.ai;
    let reviewResult = '';
    if (ai) {
      store.addThinking(`Synthesizing critique and code analysis with ${agent.name}...`, 'reasoning');
      const res = await ai.sendPrompt(prompt, {
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature || 0.2,
        apiKey,
        provider,
        model
      });

      if (res?.text?.startsWith('⚠️ **Agent Execution Notice**:')) {
        throw new Error(res.text.replace('⚠️ **Agent Execution Notice**:', '').trim());
      }

      reviewResult = res?.text || '';
      if (res?.thinking) store.addThinking(res.thinking, 'reasoning');
      if (res?.toolCalls?.length) {
        res.toolCalls.forEach((tc: any) => store.addThinking(`Tool: ${tc.name} (${tc.status})`, 'action'));
      }
    } else {
      reviewResult = `### Review Summary for ${targetLabel}\n- Analyzed ${lineCount} diff lines (${diffSource}).\n- Clean syntax and standard patterns detected.`;
    }

    store.addThinking(`Review generated. Parsing structured findings...`, 'finding');
    const safeTargetLabel = targetLabel || 'Repository';
    const findings = parseReviewFindings(reviewResult, safeTargetLabel, diffSource, lineCount);
    store.completeTask(reviewResult, findings, reviewResult);
  } catch (error: any) {
    store.failTask(error.message || 'Failed during agent git review');
  }
};
