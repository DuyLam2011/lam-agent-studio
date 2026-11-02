import { AgentPromptBuilder } from './AgentPromptBuilder';
import { ToolExecutor } from '../agent/tools/ToolExecutor';
import { assembleContext } from '../agent/context/ContextAssembler';
import { normalizeHistory, toGeminiContents } from '../agent/context/historyBuilder';
import { GeminiSession } from '../agent/providers/GeminiSession';
import { OpenAISession } from '../agent/providers/OpenAISession';
import { runAgentLoop } from '../agent/loop/runAgentLoop';
import { runOfflineAgent } from '../agent/offline/runOfflineAgent';
import type { AgentPromptOptions, AgentResponse, HistoryEntry, ModelSession, ProviderId } from '../agent/types';

export type { AgentPromptOptions, AgentResponse, ToolCallResult, DiffSnapshot } from '../agent/types';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434/v1';
const DEFAULT_OPENAI_URL = 'https://api.openai.com/v1';

/**
 * Facade over the agent runtime in `electron/agent/`: resolves the provider,
 * assembles context, and runs the streaming tool loop for one user prompt.
 */
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

    const session = await this.createSession(text, provider, apiKey, workspace, options);
    if (!session) {
      const offline = await runOfflineAgent(text, runExecutor, options.securityMode);
      return { ...offline, model: 'offline', durationMs: Date.now() - started };
    }

    return runAgentLoop({
      session,
      executor: runExecutor,
      userText: text,
      options,
      signal: options.signal || new AbortController().signal
    });
  }

  private async createSession(
    text: string, provider: ProviderId, apiKey: string, workspace: string, options: AgentPromptOptions
  ): Promise<ModelSession | null> {
    const useGemini = provider === 'gemini' && apiKey;
    const useOpenAI = provider === 'openai' && apiKey;
    if (!useGemini && !useOpenAI && provider !== 'ollama') return null;

    const context = await this.gatherContext(workspace, options.activeFilePath, options);
    const systemInstruction = this.buildSystemInstruction(context, options);
    const turns = normalizeHistory(options.history, text);
    const temperature = options.temperature ?? 0.2;

    if (useGemini) {
      return new GeminiSession({
        apiKey, model: options.model || 'gemini-3.5-flash-lite', systemInstruction, turns,
        temperature, maxOutputTokens: options.maxOutputTokens ?? 8192, reasoningEffort: options.reasoningEffort
      });
    }
    return new OpenAISession({
      provider: provider === 'ollama' ? 'ollama' : 'openai',
      apiKey: provider === 'ollama' ? 'ollama' : apiKey,
      baseUrl: options.baseUrl || (provider === 'ollama' ? DEFAULT_OLLAMA_URL : DEFAULT_OPENAI_URL),
      model: options.model || (provider === 'ollama' ? 'llama3.1' : 'gpt-4o'),
      systemInstruction, turns, temperature, reasoningEffort: options.reasoningEffort
    });
  }

  private gatherContext(workspace: string, activeFilePath?: string, options?: AgentPromptOptions): Promise<string> {
    return assembleContext(workspace, activeFilePath, options);
  }

  private buildSystemInstruction(context: string, options: AgentPromptOptions): string {
    return AgentPromptBuilder.buildSystemInstruction(context, options);
  }

  public formatGeminiContents(history: HistoryEntry[], currentUserText: string): any[] {
    return toGeminiContents(normalizeHistory(history, currentUserText));
  }
}

export const agentEngine = new AgentEngine();
