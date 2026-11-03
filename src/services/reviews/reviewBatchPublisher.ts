import { SubagentPersona } from '../../types/subagents';
import { AgentFindingItem } from '../../types/agent-activity';
import { useAgentStore } from '../../store/useAgentStore';

export const publishReviewToBatch = async (
  agent: SubagentPersona,
  targetLabel: string,
  reviewResult: string,
  findings: AgentFindingItem[]
) => {
  const criticalCount = findings.filter(f => f.category === 'security' || f.category === 'bug').length;
  const reviewPayload = {
    id: `rev-${Date.now()}`,
    agentId: agent.id,
    agentName: agent.name,
    timestamp: Date.now(),
    target: targetLabel,
    summary: reviewResult.slice(0, 350).replace(/\n+/g, ' '),
    findingsCount: findings.length,
    criticalCount,
    findings: findings.map(f => ({
      id: f.id,
      title: f.title,
      category: f.category,
      severity: f.category === 'security' ? 'critical' : f.category === 'bug' ? 'high' : 'medium',
      filePath: f.filePath,
      lineNumber: f.lineNumber,
      description: f.description,
      suggestion: f.suggestion
    })),
    rawCritique: reviewResult
  };

  try {
    // @ts-ignore
    await window.lamApi?.contextBatch?.publishReview?.(reviewPayload);
    useAgentStore.getState().addToast(
      `Published ${findings.length} review findings to Context Batch Swarm`,
      'info'
    );
  } catch (err: any) {
    console.warn('Failed to publish review to context batch:', err);
  }
};
