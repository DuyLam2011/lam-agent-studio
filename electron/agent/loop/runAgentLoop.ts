import { AgentPromptBuilder } from '../../services/AgentPromptBuilder';
import { AgentCancelledError } from '../types';
import type { AgentPromptOptions, AgentResponse, ModelSession, ToolCallResult } from '../types';
import type { ToolExecutor } from '../tools/ToolExecutor';
import type { AgentRunStatus, AgentStreamEvent } from '../../../src/types/agent-stream';
import { executeBatch } from './agentLoopBatchExecutor';
import { ThoughtSteeringEngine } from '../thought/ThoughtSteeringEngine';

export const DEFAULT_MAX_TURNS = 16;
const TRUNCATION_REASONS = new Set(['MAX_TOKENS', 'length']);

export interface AgentLoopParams {
  session: ModelSession;
  executor: ToolExecutor;
  userText: string;
  options: AgentPromptOptions;
  signal: AbortSignal;
}

const synthesisPrompt = (userText: string, hitTurnLimit: boolean) => `${hitTurnLimit
  ? 'You have reached the tool-call budget. Stop calling tools.'
  : 'You have completed all tool executions above.'} Answer the user's request: "${userText}".
- Lead with the outcome in 1-2 sentences. List every file modified and what was verified.
- Do not call any further tools.`;

export const runAgentLoop = async ({ session, executor, userText, options, signal }: AgentLoopParams): Promise<AgentResponse> => {
  const emit = (event: AgentStreamEvent) => options.onEvent?.(event);
  const started = Date.now();
  const maxTurns = Math.max(1, options.maxTurns ?? DEFAULT_MAX_TURNS);
  const autoApproved = options.securityMode === 'turbo' || (options.securityMode !== 'restricted' && options.autonomyLevel !== 'ask-all');
  const executed: ToolCallResult[] = [];
  const readCounts = new Map<string, number>();
  let finalText = '';
  let thinking = '';
  let status: AgentRunStatus = 'completed';
  let lastFinishReason: string | undefined;

  const appendText = (delta: string, turn: number) => {
    finalText += delta;
    emit({ type: 'text_delta', turn, text: delta });
  };

  const streamTurn = (turn: number, allowTools: boolean) => {
    let firstText = true;
    let firstThought = true;
    return session.streamTurn({
      onText: (delta: string) => {
        if (firstText && finalText.trim()) appendText('\n\n', turn);
        firstText = false;
        appendText(delta, turn);
      },
      onThinking: (delta: string) => {
        if (firstThought && thinking) thinking += '\n\n';
        firstThought = false;
        thinking += delta;
        emit({ type: 'thinking_delta', turn, text: delta });
      }
    }, signal, { allowTools });
  };

  emit({ type: 'run_started', model: session.model, provider: session.provider });

  try {
    let hitTurnLimit = false;
    for (let turn = 0; turn < maxTurns; turn++) {
      emit({ type: 'turn_started', turn, label: AgentPromptBuilder.getTurnStepLabel(turn, session.model, userText, executed[executed.length - 1]) });
      const result = await streamTurn(turn, true);
      lastFinishReason = result.finishReason;

      const intervention = ThoughtSteeringEngine.evaluateTurn({
        turn, maxTurns, userText, currentThinkingChunk: result.thinking || '',
        allThinking: thinking, currentText: finalText, toolCalls: result.toolCalls, executedHistory: executed
      });

      if (intervention) {
        emit({ type: 'thought_steered', turn, anomalyType: intervention.anomalyType, reason: intervention.reason, correctiveDirective: intervention.correctiveDirective });
        session.appendUserText(`[THOUGHT_STEERING_INTERVENTION: ${intervention.anomalyType}]: ${intervention.correctiveDirective}`);
        if (intervention.forceNextTurn) continue;
      }

      if (result.toolCalls.length === 0) { hitTurnLimit = false; break; }
      hitTurnLimit = true;

      const batchCtx = { executor, securityMode: options.securityMode, autoApproved, signal, emit, readCounts, executed };
      session.appendToolResults(await executeBatch(result.toolCalls, turn, batchCtx));
      if (signal.aborted) throw new AgentCancelledError();
    }

    if (hitTurnLimit || (!finalText.trim() && executed.length > 0)) {
      emit({ type: 'synthesis_started', label: hitTurnLimit ? 'Tool budget reached — summarizing progress...' : 'Synthesizing findings into a final answer...' });
      session.appendUserText(synthesisPrompt(userText, hitTurnLimit));
      const synth = await streamTurn(maxTurns, false);
      lastFinishReason = synth.finishReason;
    }
  } catch (err: any) {
    if (err instanceof AgentCancelledError || signal.aborted) {
      status = 'cancelled';
    } else if (executed.length === 0 && !finalText.trim()) {
      throw err;
    } else {
      status = 'failed';
      finalText += `${finalText ? '\n\n' : ''}⚠️ **Run interrupted:** ${err?.message || err}`;
    }
  }

  if (status === 'completed' && lastFinishReason && TRUNCATION_REASONS.has(lastFinishReason)) {
    finalText += '\n\n_⚠️ The response hit the model output limit and may be incomplete._';
  }
  if (status === 'completed' && !finalText.trim()) {
    finalText = executed.length > 0
      ? AgentPromptBuilder.generateFallbackReport(userText, executed, executor.getDiffSnapshots())
      : 'The model returned an empty response. Please rephrase or try another model.';
  }

  return {
    text: finalText, thinking: thinking || undefined, toolCalls: executed.length > 0 ? executed : undefined,
    diffSnapshots: executor.getDiffSnapshots().length > 0 ? executor.getDiffSnapshots() : undefined,
    status, model: session.model, durationMs: Date.now() - started
  };
};
