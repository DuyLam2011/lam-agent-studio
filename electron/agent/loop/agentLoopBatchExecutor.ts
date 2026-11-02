import { AgentPromptBuilder } from '../../services/AgentPromptBuilder';
import { isReadOnlyTool } from '../tools/definitions';
import { clipText, MODEL_OUTPUT_LIMIT, stringifyOutput, UI_OUTPUT_LIMIT } from '../tools/clip';
import type { ToolExecutor } from '../tools/ToolExecutor';
import { AgentCancelledError } from '../types';
import type { ModelToolCall, ModelToolResult, ToolCallResult, ToolExecutionOutcome } from '../types';
import type { AgentStreamEvent, AgentStreamToolCall } from '../../../src/types/agent-stream';

const MAX_IDENTICAL_READS = 2;

export const callSignature = (call: ModelToolCall) => {
  const args = call.args || {};
  return `${call.name}:${JSON.stringify(args, Object.keys(args).sort())}`;
};

export interface BatchExecutorContext {
  executor: ToolExecutor;
  securityMode: any;
  autoApproved: boolean;
  signal: AbortSignal;
  emit: (event: AgentStreamEvent) => void;
  readCounts: Map<string, number>;
  executed: ToolCallResult[];
}

export const executeCall = async (
  call: ModelToolCall,
  turn: number,
  ctx: BatchExecutorContext
): Promise<{ record: ToolCallResult; modelResult: ModelToolResult }> => {
  const { executor, securityMode, autoApproved, signal, emit, readCounts } = ctx;
  const label = AgentPromptBuilder.formatToolStepLabel(call.name, call.args);
  const base: AgentStreamToolCall = { id: call.id, name: call.name, args: call.args, label, turn, status: 'running' };
  emit({ type: 'tool_started', toolCall: base });

  const signature = callSignature(call);
  const priorReads = readCounts.get(signature) || 0;
  let outcome: ToolExecutionOutcome;
  if (call.argsError) {
    outcome = { status: 'failed', result: call.argsError, executionTimeMs: 0 };
  } else if (isReadOnlyTool(call.name) && priorReads >= MAX_IDENTICAL_READS) {
    outcome = {
      status: 'failed',
      result: `Skipped: this exact ${call.name} call already ran ${priorReads} times. Reuse earlier result or change approach.`,
      executionTimeMs: 0
    };
  } else {
    outcome = await executor.execute(call.name, call.args, securityMode, signal);
  }

  if (isReadOnlyTool(call.name)) readCounts.set(signature, priorReads + 1);
  else if (outcome.status === 'success') readCounts.clear();

  const fullOutput = stringifyOutput(outcome.result);
  const uiResult = clipText(fullOutput, UI_OUTPUT_LIMIT);
  emit({ type: 'tool_finished', toolCall: { ...base, status: outcome.status, result: uiResult, executionTimeMs: outcome.executionTimeMs } });

  return {
    record: { id: call.id, name: call.name, args: call.args, label, turn, status: outcome.status, result: uiResult, executionTimeMs: outcome.executionTimeMs, autoApproved },
    modelResult: { id: call.id, name: call.name, output: clipText(fullOutput, MODEL_OUTPUT_LIMIT), failed: outcome.status === 'failed' }
  };
};

export const executeBatch = async (
  calls: ModelToolCall[],
  turn: number,
  ctx: BatchExecutorContext
): Promise<ModelToolResult[]> => {
  let outputs: Array<{ record: ToolCallResult; modelResult: ModelToolResult }>;
  if (calls.every((c) => isReadOnlyTool(c.name))) {
    outputs = await Promise.all(calls.map((c) => executeCall(c, turn, ctx)));
  } else {
    outputs = [];
    for (const call of calls) {
      if (ctx.signal.aborted) throw new AgentCancelledError();
      outputs.push(await executeCall(call, turn, ctx));
    }
  }
  ctx.executed.push(...outputs.map((o) => o.record));
  return outputs.map((o) => o.modelResult);
};
