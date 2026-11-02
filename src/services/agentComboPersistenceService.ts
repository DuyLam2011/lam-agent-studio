import { AgentCombo } from '../types/agent-combo';
import { standardBuiltinAgentCombos } from '../data/defaultAgentCombos';

const COMBOS_STORAGE_KEY = 'lam_agent_combos';
const BINDINGS_STORAGE_KEY = 'lam_repo_combo_bindings';
const ACTIVE_COMBO_STORAGE_KEY = 'lam_active_combo_id';

export const loadCustomCombos = (): AgentCombo[] => {
  try {
    const raw = localStorage.getItem(COMBOS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveCustomCombos = (combos: AgentCombo[]): void => {
  try {
    const customOnly = combos.filter((c) => !c.isBuiltin);
    localStorage.setItem(COMBOS_STORAGE_KEY, JSON.stringify(customOnly));
  } catch (err) {
    console.error('Failed to save custom agent combos:', err);
  }
};

export const loadRepoComboBindings = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(BINDINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

export const saveRepoComboBindings = (bindings: Record<string, string>): void => {
  try {
    localStorage.setItem(BINDINGS_STORAGE_KEY, JSON.stringify(bindings));
  } catch (err) {
    console.error('Failed to save repo combo bindings:', err);
  }
};

export const getAllAgentCombos = (customCombos?: AgentCombo[]): AgentCombo[] => {
  const custom = customCombos !== undefined ? customCombos : loadCustomCombos();
  const map = new Map<string, AgentCombo>();
  for (const b of standardBuiltinAgentCombos) map.set(b.id, b);
  for (const c of custom) map.set(c.id, c);
  return Array.from(map.values());
};

export const resolveActiveComboForScope = (
  scopeKey?: string,
  workspaceId?: string,
  allCombos?: AgentCombo[],
  bindings?: Record<string, string>
): AgentCombo => {
  const combos = allCombos || getAllAgentCombos();
  const activeBindings = bindings || loadRepoComboBindings();

  // 1. Check exact scopeKey (e.g. "(WorkspaceName:RepoName)" or repoPath)
  if (scopeKey && activeBindings[scopeKey]) {
    const matched = combos.find((c) => c.id === activeBindings[scopeKey]);
    if (matched) return matched;
  }

  // 2. Check workspaceId
  if (workspaceId && activeBindings[workspaceId]) {
    const matched = combos.find((c) => c.id === activeBindings[workspaceId]);
    if (matched) return matched;
  }

  // 3. Check globally remembered active combo
  try {
    const storedActiveId = localStorage.getItem(ACTIVE_COMBO_STORAGE_KEY);
    if (storedActiveId) {
      const matched = combos.find((c) => c.id === storedActiveId);
      if (matched) return matched;
    }
  } catch {
    // Ignore storage read error
  }

  // 4. Default fallback
  return combos[0] || standardBuiltinAgentCombos[0];
};

export const storeActiveComboId = (comboId: string): void => {
  try {
    localStorage.setItem(ACTIVE_COMBO_STORAGE_KEY, comboId);
  } catch {
    // Ignore storage write error
  }
};
