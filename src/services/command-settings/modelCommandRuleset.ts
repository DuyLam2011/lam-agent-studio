import {
  ModelCommandRule,
  SupportedModelFamily,
  CommandRiskTier
} from '../../types/command-settings';

export const MODEL_COMMAND_RULESET: Record<SupportedModelFamily, ModelCommandRule> = {
  claude: {
    modelFamily: 'claude',
    label: 'Claude 3.5 / 3.7 (Anthropic)',
    description: 'Optimized for deep reasoning, multi-step pipeline chaining and strict error trapping.',
    maxOutputLines: 150,
    timeoutMs: 30000,
    recommendedShellPrefix: '& "C:\\Program Files\\Git\\bin\\bash.exe" -l -c',
    nonInteractiveEnforced: true,
    pipeOutputLimit: false,
    chainingStyle: 'pipeline-multistep',
    guidelines: [
      'Chain verification steps with && for atomic failure detection',
      'Use POSIX standard commands with non-interactive flags (--yes, -y)',
      'Strict error trapping: verify exit codes before subsequent mutations'
    ]
  },
  gemini: {
    modelFamily: 'gemini',
    label: 'Gemini 2.0 / 1.5 (Google)',
    description: 'High-speed processing, structured outputs, strict clean termination standard.',
    maxOutputLines: 100,
    timeoutMs: 20000,
    recommendedShellPrefix: '& "C:\\Program Files\\Git\\bin\\bash.exe" -l -c',
    nonInteractiveEnforced: true,
    pipeOutputLimit: true,
    chainingStyle: 'chained-safe',
    guidelines: [
      'Ensure every command terminates immediately (non-persistent shell)',
      'Pipe large diagnostic outputs to head -n 50 or grep',
      'Explicitly qualify workspace directory targets in arguments'
    ]
  },
  openai: {
    modelFamily: 'openai',
    label: 'GPT-4o / GPT-4 (OpenAI)',
    description: 'Versatile command execution with standard shell scripting and Node/Python invocation.',
    maxOutputLines: 120,
    timeoutMs: 25000,
    recommendedShellPrefix: '& "C:\\Program Files\\Git\\bin\\bash.exe" -l -c',
    nonInteractiveEnforced: true,
    pipeOutputLimit: true,
    chainingStyle: 'chained-safe',
    guidelines: [
      'Avoid platform-dependent shell quirks by using cross-platform scripts',
      'Inject explicit CI=true or --no-pager flags',
      'Format output in JSON or key-value where possible'
    ]
  },
  'local-ollama': {
    modelFamily: 'local-ollama',
    label: 'Local Ollama / DeepSeek / Qwen',
    description: 'Resource-constrained local models; strictly atomic single-action execution.',
    maxOutputLines: 50,
    timeoutMs: 15000,
    recommendedShellPrefix: '& "C:\\Program Files\\Git\\bin\\bash.exe" -l -c',
    nonInteractiveEnforced: true,
    pipeOutputLimit: true,
    chainingStyle: 'atomic-single',
    guidelines: [
      'Strictly avoid long output dumps; cap at head -n 30 to preserve context budget',
      'Execute single atomic commands per turn; avoid complex subshell syntax',
      'Verify results step-by-step to prevent hallucinated assumptions'
    ]
  },
  auto: {
    modelFamily: 'auto',
    label: 'Auto (Model Inferred)',
    description: 'Dynamically adapts command rules based on active chat model.',
    maxOutputLines: 100,
    timeoutMs: 25000,
    recommendedShellPrefix: '& "C:\\Program Files\\Git\\bin\\bash.exe" -l -c',
    nonInteractiveEnforced: true,
    pipeOutputLimit: true,
    chainingStyle: 'chained-safe',
    guidelines: ['Adhere to Git Bash login shell standard on Windows']
  }
};

export const resolveModelFamily = (modelId?: string): SupportedModelFamily => {
  if (!modelId) return 'claude';
  const norm = modelId.toLowerCase();
  if (norm.includes('claude') || norm.includes('sonnet') || norm.includes('opus')) return 'claude';
  if (norm.includes('gemini') || norm.includes('flash') || norm.includes('pro')) return 'gemini';
  if (norm.includes('gpt') || norm.includes('o1') || norm.includes('o3') || norm.includes('openai')) return 'openai';
  if (norm.includes('ollama') || norm.includes('deepseek') || norm.includes('qwen') || norm.includes('llama')) return 'local-ollama';
  return 'claude';
};

export const getModelCommandRule = (family: SupportedModelFamily): ModelCommandRule => {
  return MODEL_COMMAND_RULESET[family] || MODEL_COMMAND_RULESET.claude;
};

export const detectCommandRisk = (cmd: string): { riskTier: CommandRiskTier; requiresSafeguard: boolean; reason?: string } => {
  const norm = cmd.toLowerCase();
  if (/rm\s+-[rRf]{1,3}\s+[\/\*]|del\s+\/[sS]|format\s+[a-z]:|dd\s+if=|mkfs/i.test(norm)) {
    return { riskTier: 'critical', requiresSafeguard: true, reason: 'Destructive deletion or disk formatting command detected.' };
  }
  if (/git\s+reset\s+--hard|git\s+push\s+.*--force|git\s+clean\s+-[fFd]{1,3}|drop\s+database/i.test(norm)) {
    return { riskTier: 'high', requiresSafeguard: true, reason: 'Unrecoverable repository reset, force push, or database drop.' };
  }
  if (/npm\s+install|yarn\s+add|pnpm\s+add|kill\s+-9|pkill/i.test(norm)) {
    return { riskTier: 'medium', requiresSafeguard: false, reason: 'Package dependency installation or process termination.' };
  }
  return { riskTier: 'low', requiresSafeguard: false };
};
