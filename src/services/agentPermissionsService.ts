import { AgentPermissionsSettings } from '../types/settings-center';

export const DEFAULT_AGENT_PERMISSIONS: AgentPermissionsSettings = {
  terminal: {
    executionMode: 'guarded',
    allowedCommands: [
      'git status', 'git diff', 'git log', 'git branch',
      'npm test', 'npm run build', 'npx tsc',
      'python -c', 'node -e', 'cat', 'ls', 'dir'
    ],
    blockedCommands: [
      'rm -rf /', 'mkfs', 'dd', 'git reset --hard',
      'git push --force', 'shutdown', 'format'
    ],
    requireConfirmation: [
      'npm install', 'pip install', 'docker run', 'npx'
    ]
  },
  browser: {
    enabled: true,
    allowedDomains: [
      'localhost:*', '127.0.0.1:*',
      'github.com', 'npmjs.com', 'developer.mozilla.org'
    ],
    captureScreenshots: true,
    allowDomClick: true
  },
  sandbox: {
    sandboxStrict: true,
    quarantinePatterns: [
      '**/.env*', '**/id_rsa*', '**/.aws/**', '**/.npmrc', '**/.git/config'
    ],
    maxFileSizeBytes: 2097152 // 2MB
  }
};

const STORAGE_KEY = 'lam_agent_permissions';

export const loadAgentPermissions = (): AgentPermissionsSettings => {
  if (typeof localStorage === 'undefined') return DEFAULT_AGENT_PERMISSIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AGENT_PERMISSIONS;
    const parsed = JSON.parse(raw);
    return {
      terminal: { ...DEFAULT_AGENT_PERMISSIONS.terminal, ...(parsed.terminal || {}) },
      browser: { ...DEFAULT_AGENT_PERMISSIONS.browser, ...(parsed.browser || {}) },
      sandbox: { ...DEFAULT_AGENT_PERMISSIONS.sandbox, ...(parsed.sandbox || {}) },
    };
  } catch (err) {
    console.error('[agentPermissionsService] Failed to load permissions:', err);
    return DEFAULT_AGENT_PERMISSIONS;
  }
};

export const saveAgentPermissions = async (
  permissions: AgentPermissionsSettings
): Promise<boolean> => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
    }
    // @ts-ignore
    const api = window.lamApi?.settingsAPI;
    if (api?.saveSettings) {
      await api.saveSettings({ agentPermissions: permissions });
    }
    return true;
  } catch (err) {
    console.error('[agentPermissionsService] Failed to save permissions:', err);
    return false;
  }
};
