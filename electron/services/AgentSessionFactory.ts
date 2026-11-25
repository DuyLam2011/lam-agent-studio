import { GeminiSession } from '../agent/providers/GeminiSession';
import { OpenAISession } from '../agent/providers/OpenAISession';
import { AntigravitySession } from '../agent/providers/AntigravitySession';
import { CodexSession } from '../agent/providers/CodexSession';
import { ClaudeCodeSession } from '../agent/providers/ClaudeCodeSession';
import { DirectAnthropicSession } from '../agent/providers/DirectAnthropicSession';
import { claudeAccountService } from './ClaudeAccountService';
import type { NormalizedTurn } from '../agent/context/historyBuilder';
import type { AgentPromptOptions, ModelSession, ProviderId } from '../agent/types';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434/v1';
const DEFAULT_OPENAI_URL = 'https://api.openai.com/v1';
const DEFAULT_DEEPSEEK_URL = 'https://api.deepseek.com/v1';
const DEFAULT_OPENROUTER_URL = 'https://openrouter.ai/api/v1';

export class AgentSessionFactory {
  public static create(params: {
    provider: ProviderId;
    apiKey: string;
    systemInstruction: string;
    turns: NormalizedTurn[];
    options: AgentPromptOptions;
  }): ModelSession | null {
    const { provider, apiKey, systemInstruction, turns, options } = params;
    const temperature = options.temperature ?? 0.2;
    const maxOutputTokens = options.maxOutputTokens ?? 8192;
    const reasoningEffort = options.reasoningEffort;

    if (provider === 'offline') return null;

    if (provider === 'antigravity') {
      const isAgy = !!options.model && /^gemini|^claude|^argon|^gpt-oss/i.test(options.model);
      return new AntigravitySession({
        model: isAgy && options.model ? options.model : 'gemini-2.5-pro',
        systemInstruction,
        turns,
        temperature,
        maxOutputTokens,
        reasoningEffort
      });
    }

    if (provider === 'codex') {
      const isCodex = !!options.model && (/^gpt-/i.test(options.model) || /^o[1-9]/i.test(options.model));
      return new CodexSession({
        model: isCodex && options.model ? options.model : 'gpt-6.1-sol',
        systemInstruction,
        turns,
        temperature,
        maxOutputTokens,
        reasoningEffort
      });
    }

    if (provider === 'claudecode' || provider === 'anthropic') {
      const isClaude = !!options.model && /^claude-/i.test(options.model);
      const targetModel = isClaude && options.model ? options.model : 'claude-3-7-sonnet';
      const directKey = (provider === 'anthropic' ? apiKey : '') || claudeAccountService.getDirectApiKey() || apiKey;
      if (provider === 'anthropic' && !directKey) {
        throw new Error('Anthropic API Key is required for direct Anthropic cloud inference. Configure it in Settings or Account Center.');
      }
      return directKey
        ? new DirectAnthropicSession({ apiKey: directKey, model: targetModel, systemInstruction, turns, temperature, maxOutputTokens, reasoningEffort })
        : new ClaudeCodeSession({ model: targetModel, systemInstruction, turns, temperature, maxOutputTokens, reasoningEffort });
    }

    if (provider === 'gemini') {
      if (!apiKey) throw new Error('Gemini API Key is missing. Enter your key in Engine Settings or switch to Google Antigravity.');
      const isGemini = !!options.model && /^gemini|^argon/i.test(options.model);
      return new GeminiSession({
        apiKey,
        model: isGemini && options.model ? options.model : 'gemini-2.5-flash',
        systemInstruction,
        turns: params.turns,
        temperature,
        maxOutputTokens,
        reasoningEffort
      });
    }

    if (provider === 'openai' || provider === 'deepseek' || provider === 'openrouter') {
      if (!apiKey) {
        throw new Error(`${provider.toUpperCase()} API Key is missing. Configure your key in Engine Settings or use a connected account.`);
      }
      const fallbackUrl =
        provider === 'deepseek' ? DEFAULT_DEEPSEEK_URL : provider === 'openrouter' ? DEFAULT_OPENROUTER_URL : DEFAULT_OPENAI_URL;
      const defaultModel =
        provider === 'deepseek' ? 'deepseek-chat' : provider === 'openrouter' ? 'openai/gpt-4o' : 'gpt-4o';
      return new OpenAISession({
        provider: 'openai',
        apiKey,
        baseUrl: options.baseUrl || fallbackUrl,
        model: options.model || defaultModel,
        systemInstruction,
        turns,
        temperature,
        maxOutputTokens,
        reasoningEffort
      });
    }

    if (provider === 'ollama') {
      return new OpenAISession({
        provider: 'ollama',
        apiKey: '',
        baseUrl: options.baseUrl || DEFAULT_OLLAMA_URL,
        model: options.model || 'qwen2.5-coder:7b',
        systemInstruction,
        turns,
        temperature,
        maxOutputTokens,
        reasoningEffort
      });
    }

    return null;
  }
}
