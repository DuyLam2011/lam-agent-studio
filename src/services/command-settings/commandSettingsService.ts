import { CommandExecutionPolicy } from '../../types/command-settings';

const STORAGE_KEY = 'lam_command_execution_policy';

const DEFAULT_POLICY: CommandExecutionPolicy = {
  activeModelFamily: 'auto',
  defaultWorkingDir: '.',
  autoApproveSafeCommands: true,
  safeguardConfirmationRequired: true,
  truncateLongOutputs: true,
  outputLineLimit: 100,
  customEnvVars: { CI: 'true', NODE_ENV: 'development' },
  workspaceFolders: {}
};

let memoryPolicyCache: CommandExecutionPolicy = DEFAULT_POLICY;

export const loadCommandExecutionPolicy = (): CommandExecutionPolicy => {
  if (typeof window === 'undefined') return memoryPolicyCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_POLICY, ...JSON.parse(raw) } : memoryPolicyCache;
  } catch {
    return memoryPolicyCache;
  }
};

export const saveCommandExecutionPolicy = (policy: CommandExecutionPolicy): void => {
  memoryPolicyCache = policy;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policy));
    // @ts-ignore
    window.lamApi?.settings?.saveSettings?.({ commandExecutionPolicy: policy });
  } catch {
    // Fallback gracefully
  }
};

export const updateCommandExecutionPolicy = (
  patch: Partial<CommandExecutionPolicy>
): CommandExecutionPolicy => {
  const current = loadCommandExecutionPolicy();
  const updated: CommandExecutionPolicy = { ...current, ...patch };
  saveCommandExecutionPolicy(updated);
  return updated;
};

export const resetCommandExecutionPolicy = (): CommandExecutionPolicy => {
  saveCommandExecutionPolicy(DEFAULT_POLICY);
  return DEFAULT_POLICY;
};
