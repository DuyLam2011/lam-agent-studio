import { useAgentActivityStore } from '../store/useAgentActivityStore';
import { useAgentStore } from '../store/useAgentStore';
import { SubagentPersona } from '../types/subagents';
import { AgentFindingItem } from '../types/agent-activity';

export interface RunTerminalAnalysisParams {
  agent: SubagentPersona;
  terminalId?: string;
  instruction?: string;
}

export const runTerminalAnalysis = async ({
  agent,
  terminalId = 'term-main',
  instruction
}: RunTerminalAnalysisParams) => {
  const store = useAgentActivityStore.getState();
  const agentStore = useAgentStore.getState();

  // @ts-ignore
  const api = window.lamApi?.terminal;
  // @ts-ignore
  const ai = window.lamApi?.ai;

  if (!api || !ai) {
    agentStore.addToast('Terminal API or AI Engine unavailable', 'error');
    return;
  }

  const rawBuffer = await api.getBuffer(terminalId);
  const cleanBuffer = (rawBuffer || '').trim();

  if (!cleanBuffer) {
    agentStore.addToast('Terminal buffer is currently empty. Run commands first.', 'info');
    return;
  }

  store.startTask({
    type: 'terminal_monitor',
    agentId: agent.id,
    agentName: agent.name,
    agentRole: agent.role,
    title: instruction ? `Terminal Task: ${instruction}` : `Terminal Log Analysis & Diagnostics`,
    terminalBuffer: cleanBuffer,
    status: 'analyzing_terminal'
  });

  try {
    store.addThinking(`Captured ${cleanBuffer.length} characters of terminal log output.`, 'action');
    store.addThinking(`Scanning for stack traces, non-zero exits, compilation errors, and dependency alerts...`, 'reasoning');

    const engineSettings = agentStore.engineSettings;
    const apiKey = engineSettings.customApiKey || undefined;
    const provider = engineSettings.provider || (apiKey ? 'gemini' : 'offline');
    const model = agent.model || engineSettings.selectedModel || 'gemini-1.5-flash';

    store.addThinking(`Invoking ${provider.toUpperCase()} (${model}) under persona "${agent.name}"...`, 'action');

    const prompt = `You are ${agent.name}, ${agent.role}.
System Directives: ${agent.systemPrompt}
Task: ${instruction ? `Address user instruction: "${instruction}" regarding this terminal log.` : 'Perform deep diagnostic analysis of the following terminal log.'}

Instructions:
1. Provide a concise summary of what was executed and final outcome.
2. If there are errors, explain root causes (missing deps, syntax, permissions, path errors).
3. Provide exact, copy-pasteable terminal commands or code patches to resolve issues.

TERMINAL LOG:
\`\`\`text
${cleanBuffer.slice(-10000)}
\`\`\``;

    store.setTaskStatus('thinking');
    const res = await ai.sendPrompt(prompt, {
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature || 0.2,
      apiKey,
      provider,
      model
    });

    const analysisText = res?.text || 'Analysis completed with no significant errors detected.';
    if (res?.thinking) store.addThinking(res.thinking, 'reasoning');
    if (res?.toolCalls?.length) {
      res.toolCalls.forEach((tc: any) => store.addThinking(`Executed tool: ${tc.name} (${tc.status})`, 'action'));
    }

    store.addThinking('Parsing actionable findings and shell command suggestions...', 'finding');

    const isErrorLog = cleanBuffer.toLowerCase().includes('error') || 
                       cleanBuffer.toLowerCase().includes('failed') || 
                       cleanBuffer.toLowerCase().includes('exception');

    const findings: AgentFindingItem[] = [
      {
        id: `tf-${Date.now()}-1`,
        category: isErrorLog ? 'bug' : 'summary',
        title: isErrorLog ? 'Terminal Execution Diagnostics' : 'Terminal Status Summary',
        description: analysisText.slice(0, 300) + (analysisText.length > 300 ? '...' : ''),
        severity: isErrorLog ? 'high' : 'info'
      }
    ];

    // Check for suggested commands in markdown code blocks
    const cmdMatch = analysisText.match(/```(?:bash|sh|cmd)?\n([^\`]+)\n```/);
    if (cmdMatch && cmdMatch[1]) {
      const suggestedCmd = cmdMatch[1].trim();
      findings.push({
        id: `tf-${Date.now()}-2`,
        category: 'quality',
        title: 'Suggested Terminal Command Fix',
        description: 'Agent identified a corrective shell command to run in this terminal session.',
        suggestion: suggestedCmd,
        severity: 'medium'
      });
    }

    store.completeTask(analysisText, findings, cleanBuffer);
    agentStore.addToast(`Terminal analysis completed by ${agent.name}`, 'success');
  } catch (error: any) {
    store.failTask(error.message || 'Terminal analysis failed');
  }
};
