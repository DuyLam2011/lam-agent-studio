export interface SkillsAccordionState {
  [groupId: string]: boolean;
}

const STORAGE_ACTIVE_PREFIX = 'lam_active_skills_';
const STORAGE_ACCORDION_KEY = 'lam_skills_accordion_state';

const DEFAULT_ESSENTIAL_SKILLS = [
  'Senior Code Review',
  'OWASP Security Audit'
];

export const sanitizeActiveSkillIds = (
  activeIds: string[],
  availableSkills: Array<{ id?: string; name: string; folderName?: string }>
): string[] => {
  if (!Array.isArray(activeIds) || activeIds.length === 0) return [];
  const validNames = new Set<string>();
  for (const skill of availableSkills) {
    const isMatch = activeIds.some(
      (id) => id === skill.name || id === skill.id || (!!skill.folderName && id === skill.folderName)
    );
    if (isMatch) {
      validNames.add(skill.name);
    }
  }
  return Array.from(validNames);
};

export const loadActiveSkillIds = (workspaceId?: string | null): string[] => {
  if (typeof localStorage === 'undefined') return DEFAULT_ESSENTIAL_SKILLS;
  try {
    const key = `${STORAGE_ACTIVE_PREFIX}${workspaceId || 'global'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load active skills from localStorage', e);
  }
  return DEFAULT_ESSENTIAL_SKILLS;
};

export const saveActiveSkillIds = (workspaceId: string | null | undefined, skillIds: string[]): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    const key = `${STORAGE_ACTIVE_PREFIX}${workspaceId || 'global'}`;
    localStorage.setItem(key, JSON.stringify(skillIds));
  } catch (e) {
    console.warn('Failed to save active skills to localStorage', e);
  }
};

export const loadSkillsAccordionState = (): SkillsAccordionState => {
  if (typeof localStorage === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_ACCORDION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.warn('Failed to load accordion state from localStorage', e);
  }
  return {};
};

export const saveSkillsAccordionState = (state: SkillsAccordionState): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ACCORDION_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save accordion state to localStorage', e);
  }
};
