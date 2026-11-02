import { AgentProfileConfig } from '../../types/agent-profile';
import { createDefaultFatherAgentProfile, createDefaultSubagentProfile } from './agentProfileDefaults';

const STORAGE_KEY = 'lam_agent_profiles_v1';

export const loadAllAgentProfiles = (existingSubagents: Array<{ id: string; name: string; role: string }> = []): Record<string, AgentProfileConfig> => {
  const map: Record<string, AgentProfileConfig> = {};

  // Always initialize Father Agent default
  const defaultFather = createDefaultFatherAgentProfile();
  map['father-agent'] = defaultFather;

  // Initialize defaults for all known subagents
  for (const s of existingSubagents) {
    map[s.id] = createDefaultSubagentProfile(s);
  }

  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          for (const key of Object.keys(parsed)) {
            map[key] = { ...map[key], ...parsed[key] };
          }
        }
      }
    } catch (e) {
      console.warn('[ProfileStorage] Failed to read agent profiles from localStorage:', e);
    }
  }

  return map;
};

export const persistAgentProfiles = (profiles: Record<string, AgentProfileConfig>) => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
      // @ts-ignore
      if (window.lamApi?.settingsAPI?.saveSettings) {
        // @ts-ignore
        window.lamApi.settingsAPI.saveSettings({ agentProfiles: profiles }).catch(() => {});
      }
    } catch (e) {
      console.warn('[ProfileStorage] Failed to persist agent profiles:', e);
    }
  }
};

export const serializeCloudProfilesPayload = (
  profiles: Record<string, AgentProfileConfig>,
  userId?: string
) => {
  return {
    schemaVersion: '1.0.0',
    userId: userId || 'local-developer',
    exportedAt: Date.now(),
    profilesCount: Object.keys(profiles).length,
    profiles: Object.values(profiles).map(p => ({
      ...p,
      userId: userId || p.userId,
      cloudSyncStatus: 'synced' as const,
      updatedAt: Date.now()
    }))
  };
};
