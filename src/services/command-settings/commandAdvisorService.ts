import {
  CommandAdvisoryRequest,
  CommandAdvisoryResult,
  SupportedModelFamily
} from '../../types/command-settings';
import {
  resolveModelFamily,
  getModelCommandRule,
  detectCommandRisk
} from './modelCommandRuleset';
import { resolveEffectiveCommandDir } from './commandFolderSettingsManager';

export const tailorRawCommandToIntent = (intent: string): string => {
  const norm = intent.trim().toLowerCase();
  if (/^(run test|test suite|chạy test|kiểm thử)\b/i.test(norm)) return 'npm test';
  if (/^(typecheck|compile|biên dịch|kiểm tra type)\b/i.test(norm)) return 'npx tsc --noEmit';
  if (/^(build|đóng gói|bundle)\b/i.test(norm)) return 'npm run build';
  if (/^(git status|kiểm tra git)\b/i.test(norm)) return 'git status --short';
  if (/^(git diff|xem diff)\b/i.test(norm)) return 'git diff --stat';
  if (/^(install|cài package)\b/i.test(norm)) return 'npm install --no-audit';
  if (/^(lint|format)\b/i.test(norm)) return 'npm run lint';
  return intent.trim();
};

export const adviseCommand = (req: CommandAdvisoryRequest): CommandAdvisoryResult => {
  const family: SupportedModelFamily = req.modelFamily || resolveModelFamily(req.modelId);
  const rule = getModelCommandRule(family);
  const targetWorkingDir = resolveEffectiveCommandDir(req.activeWorkspaceId, req.activeRepoPath, req.requestedSubfolder);

  let cmd = tailorRawCommandToIntent(req.userIntent);
  const notes: string[] = [];

  // 1. Inject Non-interactive flags
  if (rule.nonInteractiveEnforced) {
    if (cmd.startsWith('npm install') && !cmd.includes('--yes') && !cmd.includes('-y')) {
      cmd = `${cmd} --no-audit`;
      notes.push('Enforced non-interactive flag for package installation');
    } else if (cmd.startsWith('npx ') && !cmd.includes('-y') && !cmd.includes('--yes')) {
      cmd = cmd.replace(/^npx /, 'npx --yes ');
      notes.push('Injected --yes flag to prevent interactive npx prompts');
    }
  }

  // 2. Output capping for local or light models
  if (rule.pipeOutputLimit && !cmd.includes('|') && !cmd.includes('>')) {
    if (family === 'local-ollama') {
      cmd = `${cmd} | head -n 35`;
      notes.push('Capped output to 35 lines to protect Ollama/local context window');
    } else if (family === 'gemini') {
      cmd = `${cmd} | head -n 50`;
      notes.push('Capped output to 50 lines for clean stream response');
    }
  }

  // 3. Detect Risk & Safeguard Gate
  const risk = detectCommandRisk(cmd);
  if (risk.requiresSafeguard) {
    notes.push(`[SAFEGUARD CONFIRMATION REQUIRED]: ${risk.reason}`);
  }

  notes.push(`Execution directory resolved to: ${targetWorkingDir}`);
  notes.push(`Syntax tailored for ${rule.label} (${rule.chainingStyle})`);

  return {
    recommendedCommand: cmd,
    tailoredForModel: family,
    targetWorkingDir,
    isSafeguardRequired: risk.requiresSafeguard,
    safeguardReason: risk.reason,
    riskTier: risk.riskTier,
    modelSpecificNotes: notes
  };
};
