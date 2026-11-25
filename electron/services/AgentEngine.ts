import { AgentPromptBuilder } from './AgentPromptBuilder';
import { ToolExecutor } from '../agent/tools/ToolExecutor';
import { assembleContext } from '../agent/context/ContextAssembler';
import { normalizeHistory } from '../agent/context/historyBuilder';
import { AgentSessionFactory } from './AgentSessionFactory';
import { runAgentLoop } from '../agent/loop/runAgentLoop';
import { runOfflineAgent } from '../agent/offline/runOfflineAgent';
import { ApiGatewayClient } from './ApiGatewayClient';
import { AgentCancelledError } from '../agent/types';
import type { AgentPromptOptions, AgentResponse, ProviderId } from '../agent/types';

export type { AgentPromptOptions, AgentResponse, ToolCallResult, DiffSnapshot } from '../agent/types';

export class AgentEngine {
  private executor = new ToolExecutor(process.cwd());

  public setWorkspaceRoot(dir: string) {
    this.executor.setWorkspaceRoot(dir);
  }

  public formatToolStepLabel(name: string, args: any): string {
    return AgentPromptBuilder.formatToolStepLabel(name, args);
  }

  public getDiffSnapshots(): any[] {
    return this.executor.getDiffSnapshots();
  }

  public executeTool(name: string, args: any, securityMode?: string) {
    return this.executor.execute(name, args, securityMode);
  }

  public async processPrompt(text: string, options: AgentPromptOptions = {}): Promise<AgentResponse> {
    const workspace = options.workspacePath || this.executor.getWorkspaceRoot();
    this.setWorkspaceRoot(workspace);
    const runExecutor = new ToolExecutor(workspace);
    const started = Date.now();

    const provider: ProviderId = options.provider || (options.apiKey ? 'gemini' : 'offline');
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
    const turns = normalizeHistory(options.history, text);

    const context = provider === 'offline' ? '' : await assembleContext(workspace, options.activeFilePath, options);
    const systemInstruction = provider === 'offline' ? '' : AgentPromptBuilder.buildSystemInstruction(context, options);

    const session = AgentSessionFactory.create({ provider, apiKey, systemInstruction, turns, options });
    if (!session) {
      const offline = await runOfflineAgent(text, runExecutor, options.securityMode);
      return { ...offline, model: 'offline', durationMs: Date.now() - started };
    }

    const reportCallback = (res: AgentResponse) => {
      void ApiGatewayClient.emitCallback('agent-run', {
        runId: options.runId,
        provider,
        model: res.model || options.model,
        status: res.status || 'completed',
        durationMs: res.durationMs ?? Date.now() - started,
        toolCallsCount: res.toolCalls?.length || 0,
        diffsCount: res.diffSnapshots?.length || 0,
        promptPreview: text.slice(0, 140)
      });
    };

    try {
      const res = await runAgentLoop({
        session,
        executor: runExecutor,
        userText: text,
        options,
        signal: options.signal || new AbortController().signal
      });
      reportCallback(res);
      return res;
    } catch (err: any) {
      if (err instanceof AgentCancelledError || err?.name === 'AgentCancelledError' || options.signal?.aborted) {
        throw err;
      }
      const is503 = /503|UNAVAILABLE|high demand/i.test(err?.message || '');
      if (is503 && provider === 'gemini') {
        const agySession = AgentSessionFactory.create({
          provider: 'antigravity',
          apiKey: '',
          systemInstruction,
          turns,
          options
        });
        if (agySession) {
          options.onEvent?.({ type: 'text_delta', turn: 0, text: '\n\n⚡ *Gemini API 503 detected. Auto-failover to Google Antigravity Engine...*\n\n' });
          const res = await runAgentLoop({
            session: agySession,
            executor: runExecutor,
            userText: text,
            options,
            signal: options.signal || new AbortController().signal
          });
          reportCallback(res);
          return res;
        }
      }
      throw err;
    }
  }
}

export const agentEngine = new AgentEngine();
