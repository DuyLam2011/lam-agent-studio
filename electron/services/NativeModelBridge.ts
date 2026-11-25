import { NativeBridgeLoader } from './NativeBridgeLoader';

export interface DiscoveredModel {
  id: string;
  name: string;
  provider: string;
  tier: string;
  badge: string;
  context_window: number;
  reasoning_effort: string;
  is_unlocked: boolean;
  father_agent_score: number;
  recommended_for_father: boolean;
  description: string;
}

export interface AccountPackageTier {
  provider: string;
  tier_name: string;
  plan_code: string;
  is_paid: boolean;
  entitled_features: string[];
}

export interface ModelDiscoveryResult {
  provider: string;
  detected_tier: AccountPackageTier;
  models: DiscoveredModel[];
  total_models: number;
  unlocked_count: number;
  default_father_agent_model: string;
  father_agent_recommendations: string[];
}

export interface FatherAgentAssignmentResult {
  success: boolean;
  assigned_model_id: string;
  provider: string;
  model_name: string;
  context_window: number;
  reasoning_effort: string;
  father_agent_score: number;
  persona: string;
  audit_note: string;
  error?: string;
}

export class NativeModelBridge {
  public static discoverPackageModels(provider: string, rawPayloadOrCache = '{}'): ModelDiscoveryResult {
    const native = NativeBridgeLoader.getNative();
    if (native?.fastDiscoverPackageModels) {
      try {
        const raw = native.fastDiscoverPackageModels(provider, typeof rawPayloadOrCache === 'string' ? rawPayloadOrCache : JSON.stringify(rawPayloadOrCache));
        return JSON.parse(raw);
      } catch (err) {
        console.warn('[NativeModelBridge] fastDiscoverPackageModels failed, using fallback:', err);
      }
    }
    return this.fallbackDiscovery(provider);
  }

  public static assignFatherAgentModel(provider: string, modelId: string, rawPayloadOrCache = '{}'): FatherAgentAssignmentResult {
    const native = NativeBridgeLoader.getNative();
    if (native?.fastAssignFatherAgentModel) {
      try {
        const raw = native.fastAssignFatherAgentModel(provider, modelId, typeof rawPayloadOrCache === 'string' ? rawPayloadOrCache : JSON.stringify(rawPayloadOrCache));
        return JSON.parse(raw);
      } catch (err) {
        console.warn('[NativeModelBridge] fastAssignFatherAgentModel failed, using fallback:', err);
      }
    }
    return {
      success: true,
      assigned_model_id: modelId,
      provider,
      model_name: modelId,
      context_window: 128000,
      reasoning_effort: 'medium',
      father_agent_score: 90,
      persona: 'lead-architect',
      audit_note: `Assigned ${modelId} to Father Agent (fallback mode)`
    };
  }

  public static detectAccountTier(provider: string, rawAuthOrConfig = '{}'): AccountPackageTier {
    const native = NativeBridgeLoader.getNative();
    if (native?.fastDetectAccountTier) {
      try {
        const raw = native.fastDetectAccountTier(provider, typeof rawAuthOrConfig === 'string' ? rawAuthOrConfig : JSON.stringify(rawAuthOrConfig));
        return JSON.parse(raw);
      } catch (err) {
        console.warn('[NativeModelBridge] fastDetectAccountTier failed:', err);
      }
    }
    return {
      provider,
      tier_name: 'Standard Connected Tier',
      plan_code: 'standard',
      is_paid: true,
      entitled_features: ['basic_inference']
    };
  }

  private static fallbackDiscovery(provider: string): ModelDiscoveryResult {
    const isAntigravity = provider === 'antigravity' || provider === 'gemini';
    const models: DiscoveredModel[] = isAntigravity ? [
      { id: 'argon', name: 'Argon (Frontier Experimental Reasoning - Unlocked)', provider: 'antigravity', tier: 'ultra', badge: '🧠 Frontier Experimental Reasoning', context_window: 2000000, reasoning_effort: 'ultra', is_unlocked: true, father_agent_score: 99, recommended_for_father: true, description: 'Google DeepMind flagship experimental reasoning engine.' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Frontier Architecture & Reasoning)', provider: 'antigravity', tier: 'pro', badge: '🧠 Frontier Architecture', context_window: 2000000, reasoning_effort: 'high', is_unlocked: true, father_agent_score: 98, recommended_for_father: true, description: 'Flagship architecture & reasoning model.' },
      { id: 'gemini-3.8-flash-high', name: 'Gemini 3.8 Flash (High)', provider: 'antigravity', tier: 'plus', badge: '🧠 High Reasoning', context_window: 1000000, reasoning_effort: 'high', is_unlocked: true, father_agent_score: 93, recommended_for_father: false, description: 'High reasoning subagent driver.' }
    ] : [
      { id: 'o3-mini', name: 'OpenAI o3-mini', provider: 'codex', tier: 'team', badge: '⚡ Frontier Reasoning', context_window: 200000, reasoning_effort: 'high', is_unlocked: true, father_agent_score: 97, recommended_for_father: true, description: 'OpenAI frontier reasoning model.' },
      { id: 'gpt-6.2-sol', name: 'GPT-6.2-Sol', provider: 'codex', tier: 'plus', badge: '⚡ Balanced Coding', context_window: 128000, reasoning_effort: 'medium', is_unlocked: true, father_agent_score: 94, recommended_for_father: false, description: 'Everyday coding driver.' }
    ];

    return {
      provider,
      detected_tier: { provider, tier_name: 'Connected Package', plan_code: 'premium', is_paid: true, entitled_features: [] },
      models,
      total_models: models.length,
      unlocked_count: models.length,
      default_father_agent_model: models[0]?.id || 'argon',
      father_agent_recommendations: models.filter(m => m.recommended_for_father).map(m => m.id)
    };
  }
}
