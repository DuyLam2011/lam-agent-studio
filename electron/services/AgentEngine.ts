import { AgentPromptBuilder } from './AgentPromptBuilder';
import { ToolExecutor } from '../agent/tools/ToolExecutor';
import { assembleContext } from '../agent/context/ContextAssembler';
import { normalizeHistory, toGeminiContents } from '../agent/context/historyBuilder';
import { GeminiSession } from '../agent/providers/GeminiSession';
import { OpenAISession } from '../agent/providers/OpenAISession';
import { AntigravitySession } from '../agent/providers/AntigravitySession';
import { CodexSession } from '../agent/providers/CodexSession';
import { ClaudeCodeSession } from '../agent/providers/ClaudeCodeSession';
import { DirectAnthropicSession } from '../agent/providers/DirectAnthropicSession';
import { claudeAccountService } from './ClaudeAccountService';
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

    try {
      return await runAgentLoop({
        session,
        executor: runExecutor,
        userText: text,
        options,
        signal: options.signal || new AbortController().signal
      });
    } catch (err: any) {
      const is503 = /503|UNAVAILABLE|high demand/i.test(err?.message || '');
      if (is503 && provider === 'gemini') {
        const agySession = await this.createSession(text, 'antigravity', '', workspace, options);
        if (agySession) {
          options.onEvent?.({ type: 'text_delta', turn: 0, text: '\n\n⚡ *Gemini API 503 detected. Auto-failover to Google Antigravity Engine (High Quota)...*\n\n' });
          return runAgentLoop({ session: agySession, executor: runExecutor, userText: text, options, signal: options.signal || new AbortController().signal });
        }
      }
      throw err;
    }
  }

  private async createSession(
    text: string, provider: ProviderId, apiKey: string, workspace: string, options: AgentPromptOptions
  ): Promise<ModelSession | null> {
    const useAntigravity = provider === 'antigravity';
    const useCodex = provider === 'codex';
    const useClaudeCode = provider === 'claudecode';
    const useGemini = provider === 'gemini' && apiKey;
    const useOpenAI = provider === 'openai' && apiKey;
    if (!useGemini && !useOpenAI && provider !== 'ollama' && !useAntigravity && !useCodex && !useClaudeCode) return null;

    const context = await this.gatherContext(workspace, options.activeFilePath, options);
    const systemInstruction = this.buildSystemInstruction(context, options);
    const turns = normalizeHistory(options.history, text);
    const temperature = options.temperature ?? 0.2;

    if (useAntigravity) {
      const isAgyModel = !!options.model && /^gemini|^claude/i.test(options.model);
      const targetModel: string = isAgyModel && options.model ? options.model : 'gemini-2.5-pro';
      return new AntigravitySession({
        model: targetModel, systemInstruction, turns, temperature,
        maxOutputTokens: options.maxOutputTokens ?? 8192, reasoningEffort: options.reasoningEffort
      });
    }

    if (useCodex) {
      const isCodexModel = !!options.model && (/^gpt-/i.test(options.model) || /^o[13]/i.test(options.model));
      const targetModel: string = isCodexModel && options.model ? options.model : 'gpt-4o';
      return new CodexSession({
        model: targetModel,
        systemInstruction, turns, temperature, maxOutputTokens: options.maxOutputTokens ?? 8192
      });
    }

    if (useClaudeCode) {
      const isClaudeModel = !!options.model && /^claude-/i.test(options.model);
      const targetModel = isClaudeModel && options.model ? options.model : 'claude-3-7-sonnet';
      const directKey = claudeAccountService.getDirectApiKey();
      return directKey
        ? new DirectAnthropicSession({ apiKey: directKey, model: targetModel, systemInstruction, turns, temperature, maxOutputTokens: options.maxOutputTokens ?? 8192 })
        : new ClaudeCodeSession({ model: targetModel, systemInstruction, turns, temperature, maxOutputTokens: options.maxOutputTokens ?? 8192 });
    }

    if (useGemini) {
      return new GeminiSession({
        apiKey, model: options.model || 'gemini-2.5-flash', systemInstruction, turns,
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

  private gatherContext(workspace: string, activeFilePath?: string, options?: AgentPromptOptions): Promise<string> { return assembleContext(workspace, activeFilePath, options); }
  private buildSystemInstruction(context: string, options: AgentPromptOptions): string { return AgentPromptBuilder.buildSystemInstruction(context, options); }
  public formatGeminiContents(history: HistoryEntry[], currentUserText: string): any[] { return toGeminiContents(normalizeHistory(history, currentUserText)); }
}

export const agentEngine = new AgentEngine();
