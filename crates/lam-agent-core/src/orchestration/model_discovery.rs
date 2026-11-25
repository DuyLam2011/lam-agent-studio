use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredModel {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub tier: String,
    pub badge: String,
    pub context_window: u32,
    pub reasoning_effort: String,
    pub is_unlocked: bool,
    pub father_agent_score: u32,
    pub recommended_for_father: bool,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountPackageTier {
    pub provider: String,
    pub tier_name: String,
    pub plan_code: String,
    pub is_paid: bool,
    pub entitled_features: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelDiscoveryResult {
    pub provider: String,
    pub detected_tier: AccountPackageTier,
    pub models: Vec<DiscoveredModel>,
    pub total_models: u32,
    pub unlocked_count: u32,
    pub default_father_agent_model: String,
    pub father_agent_recommendations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FatherAgentAssignmentResult {
    pub success: bool,
    pub assigned_model_id: String,
    pub provider: String,
    pub model_name: String,
    pub context_window: u32,
    pub reasoning_effort: String,
    pub father_agent_score: u32,
    pub persona: String,
    pub audit_note: String,
}

pub fn detect_account_tier(provider: &str, raw_auth_or_config: &str) -> AccountPackageTier {
    let p = provider.to_lowercase();
    let parsed: Option<Value> = serde_json::from_str(raw_auth_or_config).ok();

    if p == "antigravity" || p == "gemini" {
        let is_enterprise = parsed
            .as_ref()
            .and_then(|v| v.get("isEnterprise").or_else(|| v.get("enterprise")))
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        let plan = if is_enterprise {
            "google_workspace_enterprise"
        } else {
            "google_one_ai_premium"
        };

        return AccountPackageTier {
            provider: "antigravity".to_string(),
            tier_name: if is_enterprise {
                "Google Workspace Enterprise".to_string()
            } else {
                "Google One AI Premium (Advanced)".to_string()
            },
            plan_code: plan.to_string(),
            is_paid: true,
            entitled_features: vec![
                "argon_frontier_reasoning".to_string(),
                "gemini_2_5_pro_full_context".to_string(),
                "2m_context_window".to_string(),
                "deepmind_extended_thinking".to_string(),
                "multi_turn_tool_calling".to_string(),
            ],
        };
    }

    if p == "codex" || p == "openai" {
        let mut plan = "team";
        if let Some(ref val) = parsed {
            if let Some(pt) = val.get("planType").and_then(|v| v.as_str()) {
                plan = pt;
            } else if let Some(tokens) = val.get("tokens") {
                if tokens.get("access_token").is_some() {
                    plan = "team";
                }
            }
        }

        let is_paid = !plan.eq_ignore_ascii_case("free");
        return AccountPackageTier {
            provider: "codex".to_string(),
            tier_name: format!("OpenAI Codex ({})", plan.to_uppercase()),
            plan_code: plan.to_string(),
            is_paid,
            entitled_features: vec![
                "o3_mini_frontier_reasoning".to_string(),
                "o1_deep_reasoning".to_string(),
                "gpt_6_astra_reasoning".to_string(),
                "full_code_sandbox".to_string(),
            ],
        };
    }

    if p == "claudecode" || p == "anthropic" {
        let mut plan = "team";
        if let Some(ref val) = parsed {
            if let Some(st) = val.get("subscriptionType").and_then(|v| v.as_str()) {
                plan = st;
            }
        }

        let is_paid = !plan.eq_ignore_ascii_case("free");
        return AccountPackageTier {
            provider: "claudecode".to_string(),
            tier_name: format!("Claude Code ({})", plan.to_uppercase()),
            plan_code: plan.to_string(),
            is_paid,
            entitled_features: vec![
                "claude_3_7_sonnet_extended_thinking".to_string(),
                "claude_sonnet_5_frontier".to_string(),
                "1m_context_window".to_string(),
                "subagent_context_distillation".to_string(),
            ],
        };
    }

    AccountPackageTier {
        provider: p.to_string(),
        tier_name: "Standard Local Tier".to_string(),
        plan_code: "standard".to_string(),
        is_paid: true,
        entitled_features: vec!["local_inference".to_string()],
    }
}

pub fn get_preset_models_for_provider(provider: &str) -> Vec<DiscoveredModel> {
    let p = provider.to_lowercase();
    match p.as_str() {
        "antigravity" | "gemini" => vec![
            DiscoveredModel {
                id: "argon".to_string(),
                name: "Argon (Frontier Experimental Reasoning - Unlocked)".to_string(),
                provider: "antigravity".to_string(),
                tier: "ultra".to_string(),
                badge: "🧠 Frontier Experimental Reasoning".to_string(),
                context_window: 2_000_000,
                reasoning_effort: "ultra".to_string(),
                is_unlocked: true,
                father_agent_score: 99,
                recommended_for_father: true,
                description: "Google DeepMind frontier experimental reasoning engine with 2M context and recursive tool calls."
                    .to_string(),
            },
            DiscoveredModel {
                id: "gemini-2.5-pro".to_string(),
                name: "Gemini 2.5 Pro (Frontier Architecture & Reasoning)".to_string(),
                provider: "antigravity".to_string(),
                tier: "pro".to_string(),
                badge: "🧠 Frontier Architecture & Coding".to_string(),
                context_window: 2_000_000,
                reasoning_effort: "high".to_string(),
                is_unlocked: true,
                father_agent_score: 98,
                recommended_for_father: true,
                description: "Flagship Gemini model engineered for complex architectural reasoning and multimodal coding."
                    .to_string(),
            },
            DiscoveredModel {
                id: "gemini-2.0-flash-thinking".to_string(),
                name: "Gemini 2.0 Flash Thinking Exp".to_string(),
                provider: "antigravity".to_string(),
                tier: "pro".to_string(),
                badge: "💡 High-Speed Thinking".to_string(),
                context_window: 1_048_576,
                reasoning_effort: "high".to_string(),
                is_unlocked: true,
                father_agent_score: 95,
                recommended_for_father: true,
                description: "Extreme velocity with deep CoT thinking traces for rapid iteration."
                    .to_string(),
            },
            DiscoveredModel {
                id: "gemini-3.8-flash-high".to_string(),
                name: "Gemini 3.8 Flash (High Reasoning & Tool Calls)".to_string(),
                provider: "antigravity".to_string(),
                tier: "plus".to_string(),
                badge: "🧠 High Reasoning & Tools".to_string(),
                context_window: 1_000_000,
                reasoning_effort: "high".to_string(),
                is_unlocked: true,
                father_agent_score: 93,
                recommended_for_father: false,
                description: "High reasoning budget tuned for autonomous multi-step subagents."
                    .to_string(),
            },
            DiscoveredModel {
                id: "gemini-3.8-flash-medium".to_string(),
                name: "Gemini 3.8 Flash (Balanced)".to_string(),
                provider: "antigravity".to_string(),
                tier: "free".to_string(),
                badge: "⚡ Balanced Performance".to_string(),
                context_window: 1_000_000,
                reasoning_effort: "medium".to_string(),
                is_unlocked: true,
                father_agent_score: 88,
                recommended_for_father: false,
                description: "Standard balanced Gemini model for day-to-day coding."
                    .to_string(),
            },
            DiscoveredModel {
                id: "claude-sonnet-4-6".to_string(),
                name: "Claude Sonnet 4.6 (Extended Thinking)".to_string(),
                provider: "antigravity".to_string(),
                tier: "pro".to_string(),
                badge: "💡 Extended Thinking".to_string(),
                context_window: 1_000_000,
                reasoning_effort: "high".to_string(),
                is_unlocked: true,
                father_agent_score: 96,
                recommended_for_father: true,
                description: "Anthropic Claude reasoning engine hosted through Google Antigravity bridge."
                    .to_string(),
            },
            DiscoveredModel {
                id: "claude-opus-4-6-thinking".to_string(),
                name: "Claude Opus 4.6 (Deep Thinking)".to_string(),
                provider: "antigravity".to_string(),
                tier: "ultra".to_string(),
                badge: "🔬 Deep Thinking".to_string(),
                context_window: 1_000_000,
                reasoning_effort: "ultra".to_string(),
                is_unlocked: true,
                father_agent_score: 97,
                recommended_for_father: true,
                description: "Maximum analytical depth for large scale software architecture."
                    .to_string(),
            },
            DiscoveredModel {
                id: "gpt-oss-120b-medium".to_string(),
                name: "GPT-OSS 120B (Open Weights)".to_string(),
                provider: "antigravity".to_string(),
                tier: "plus".to_string(),
                badge: "📦 Open Weights".to_string(),
                context_window: 128_000,
                reasoning_effort: "medium".to_string(),
                is_unlocked: true,
                father_agent_score: 85,
                recommended_for_father: false,
                description: "Open weights frontier foundation model with fast local-like execution."
                    .to_string(),
            },
        ],
        "codex" | "openai" => vec![
            DiscoveredModel {
                id: "o3-mini".to_string(),
                name: "OpenAI o3-mini (High-Speed Frontier Reasoning)".to_string(),
                provider: "codex".to_string(),
                tier: "team".to_string(),
                badge: "⚡ Frontier Reasoning".to_string(),
                context_window: 200_000,
                reasoning_effort: "high".to_string(),
                is_unlocked: true,
                father_agent_score: 97,
                recommended_for_father: true,
                description: "Latest generation high-speed mathematical and algorithmic reasoning engine."
                    .to_string(),
            },
            DiscoveredModel {
                id: "o1".to_string(),
                name: "OpenAI o1 (Deep Analytical Reasoning)".to_string(),
                provider: "codex".to_string(),
                tier: "team".to_string(),
                badge: "🔬 Deep Reasoning".to_string(),
                context_window: 200_000,
                reasoning_effort: "high".to_string(),
                is_unlocked: true,
                father_agent_score: 98,
                recommended_for_father: true,
                description: "Full analytical CoT reasoning engine for hard planning problems."
                    .to_string(),
            },
            DiscoveredModel {
                id: "gpt-6.2-astra".to_string(),
                name: "GPT-6.2-Astra (Frontier Complex Reasoning)".to_string(),
                provider: "codex".to_string(),
                tier: "team".to_string(),
                badge: "🧠 Frontier Reasoning".to_string(),
                context_window: 256_000,
                reasoning_effort: "ultra".to_string(),
                is_unlocked: true,
                father_agent_score: 98,
                recommended_for_father: true,
                description: "Flagship OpenAI Codex reasoning model for enterprise codebase architecture."
                    .to_string(),
            },
            DiscoveredModel {
                id: "gpt-6.2-sol".to_string(),
                name: "GPT-6.2-Sol (Coding & Everyday Work)".to_string(),
                provider: "codex".to_string(),
                tier: "plus".to_string(),
                badge: "⚡ Coding & Everyday Work".to_string(),
                context_window: 128_000,
                reasoning_effort: "medium".to_string(),
                is_unlocked: true,
                father_agent_score: 94,
                recommended_for_father: false,
                description: "Balanced daily driver for autonomous file changes and bug fixing."
                    .to_string(),
            },
            DiscoveredModel {
                id: "gpt-4o".to_string(),
                name: "GPT-4o (Omni Multimodal)".to_string(),
                provider: "codex".to_string(),
                tier: "plus".to_string(),
                badge: "🎯 Omni Multimodal".to_string(),
                context_window: 128_000,
                reasoning_effort: "medium".to_string(),
                is_unlocked: true,
                father_agent_score: 93,
                recommended_for_father: false,
                description: "High-accuracy multimodal vision and text model."
                    .to_string(),
            },
        ],
        "claudecode" | "anthropic" => vec![
            DiscoveredModel {
                id: "claude-3-7-sonnet".to_string(),
                name: "Claude 3.7 Sonnet (Hybrid Reasoning & Extended Thinking)".to_string(),
                provider: "claudecode".to_string(),
                tier: "pro".to_string(),
                badge: "💡 Hybrid Reasoning & Thinking".to_string(),
                context_window: 200_000,
                reasoning_effort: "high".to_string(),
                is_unlocked: true,
                father_agent_score: 99,
                recommended_for_father: true,
                description: "Hybrid architecture allowing smooth sliding between instant execution and extended thinking."
                    .to_string(),
            },
            DiscoveredModel {
                id: "claude-sonnet-5".to_string(),
                name: "Claude Sonnet 5 (Frontier Coding - 1M Context)".to_string(),
                provider: "claudecode".to_string(),
                tier: "team".to_string(),
                badge: "🧠 Frontier Coding (1M Context)".to_string(),
                context_window: 1_000_000,
                reasoning_effort: "high".to_string(),
                is_unlocked: true,
                father_agent_score: 98,
                recommended_for_father: true,
                description: "Next-generation 1M context coding agent model."
                    .to_string(),
            },
            DiscoveredModel {
                id: "claude-opus-4-8".to_string(),
                name: "Claude Opus 4.8 (Deep Analytical Reasoning)".to_string(),
                provider: "claudecode".to_string(),
                tier: "enterprise".to_string(),
                badge: "🔬 Deep Analytical (1M Context)".to_string(),
                context_window: 1_000_000,
                reasoning_effort: "ultra".to_string(),
                is_unlocked: true,
                father_agent_score: 98,
                recommended_for_father: true,
                description: "Frontier analytical intelligence for multi-repository restructuring."
                    .to_string(),
            },
            DiscoveredModel {
                id: "claude-3-5-sonnet".to_string(),
                name: "Claude 3.5 Sonnet (Precision Coding)".to_string(),
                provider: "claudecode".to_string(),
                tier: "plus".to_string(),
                badge: "🎯 Precision Coding".to_string(),
                context_window: 200_000,
                reasoning_effort: "medium".to_string(),
                is_unlocked: true,
                father_agent_score: 95,
                recommended_for_father: false,
                description: "High-precision standard coding model with rigorous instruction following."
                    .to_string(),
            },
        ],
        _ => vec![
            DiscoveredModel {
                id: "deepseek-r1".to_string(),
                name: "DeepSeek-R1 (Local Frontier Reasoning)".to_string(),
                provider: "ollama".to_string(),
                tier: "free".to_string(),
                badge: "🧠 Local Deep Reasoning".to_string(),
                context_window: 64_000,
                reasoning_effort: "high".to_string(),
                is_unlocked: true,
                father_agent_score: 94,
                recommended_for_father: true,
                description: "Open-source frontier reasoning model running in private local sandbox."
                    .to_string(),
            },
            DiscoveredModel {
                id: "qwen2.5-coder".to_string(),
                name: "Qwen 2.5 Coder 32B".to_string(),
                provider: "ollama".to_string(),
                tier: "free".to_string(),
                badge: "⚡ Local Coding".to_string(),
                context_window: 64_000,
                reasoning_effort: "medium".to_string(),
                is_unlocked: true,
                father_agent_score: 89,
                recommended_for_father: false,
                description: "High-performance coding model optimized for local developer workflows."
                    .to_string(),
            },
        ],
    }
}

pub fn discover_package_models(
    provider: &str,
    raw_payload_or_cache: &str,
) -> ModelDiscoveryResult {
    let p = provider.to_lowercase();
    let detected_tier = detect_account_tier(&p, raw_payload_or_cache);
    let mut models = get_preset_models_for_provider(&p);

    // If raw_payload_or_cache contains a JSON structure with dynamic models (e.g. models_cache.json from codex)
    if let Ok(val) = serde_json::from_str::<Value>(raw_payload_or_cache) {
        let dynamic_items = val
            .get("models")
            .and_then(|v| v.as_array())
            .or_else(|| val.as_array());

        if let Some(arr) = dynamic_items {
            for item in arr {
                let slug = item
                    .get("slug")
                    .or_else(|| item.get("id"))
                    .and_then(|v| v.as_str());

                if let Some(id) = slug {
                    if !models.iter().any(|m| m.id == id) {
                        let name = item
                            .get("display_name")
                            .or_else(|| item.get("name"))
                            .and_then(|v| v.as_str())
                            .unwrap_or(id);

                        let desc = item
                            .get("description")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Discovered package model");

                        let has_high_reasoning = item
                            .get("supported_reasoning_levels")
                            .and_then(|v| v.as_array())
                            .map(|l| l.iter().any(|x| x.get("effort").and_then(|e| e.as_str()) == Some("ultra") || x.get("effort").and_then(|e| e.as_str()) == Some("high")))
                            .unwrap_or(false);

                        let score = if has_high_reasoning || id.contains("astra") || id.contains("pro") || id.contains("r1") {
                            96
                        } else {
                            91
                        };

                        models.push(DiscoveredModel {
                            id: id.to_string(),
                            name: name.to_string(),
                            provider: p.clone(),
                            tier: "team".to_string(),
                            badge: "✨ Live Discovered Model".to_string(),
                            context_window: 128_000,
                            reasoning_effort: if has_high_reasoning { "high".to_string() } else { "medium".to_string() },
                            is_unlocked: true,
                            father_agent_score: score,
                            recommended_for_father: score >= 95,
                            description: desc.to_string(),
                        });
                    }
                }
            }
        }
    }

    // Sort by father_agent_score descending
    models.sort_by(|a, b| b.father_agent_score.cmp(&a.father_agent_score));

    let unlocked_count = models.iter().filter(|m| m.is_unlocked).count() as u32;
    let default_father = models
        .iter()
        .find(|m| m.recommended_for_father && m.is_unlocked)
        .map(|m| m.id.clone())
        .unwrap_or_else(|| models.first().map(|m| m.id.clone()).unwrap_or_else(|| "argon".to_string()));

    let father_recommendations: Vec<String> = models
        .iter()
        .filter(|m| m.recommended_for_father && m.is_unlocked)
        .take(3)
        .map(|m| m.id.clone())
        .collect();

    let total = models.len() as u32;

    ModelDiscoveryResult {
        provider: p,
        detected_tier,
        models,
        total_models: total,
        unlocked_count,
        default_father_agent_model: default_father,
        father_agent_recommendations: father_recommendations,
    }
}

pub fn assign_model_to_father_agent(
    provider: &str,
    model_id: &str,
    raw_payload_or_cache: &str,
) -> Result<FatherAgentAssignmentResult, String> {
    let discovery = discover_package_models(provider, raw_payload_or_cache);
    let target = discovery.models.into_iter().find(|m| m.id.eq_ignore_ascii_case(model_id));

    match target {
        Some(m) => {
            if !m.is_unlocked {
                return Err(format!(
                    "Model '{}' requires subscription tier '{}', but user package tier is '{}'.",
                    m.id, m.tier, discovery.detected_tier.tier_name
                ));
            }

            Ok(FatherAgentAssignmentResult {
                success: true,
                assigned_model_id: m.id.clone(),
                provider: m.provider.clone(),
                model_name: m.name.clone(),
                context_window: m.context_window,
                reasoning_effort: m.reasoning_effort.clone(),
                father_agent_score: m.father_agent_score,
                persona: "lead-architect".to_string(),
                audit_note: format!(
                    "Model '{}' successfully assigned to Father Agent (Lead Architect). Tier: {}, Score: {}/100, Reasoning: {}, Context: {} tokens.",
                    m.id, discovery.detected_tier.tier_name, m.father_agent_score, m.reasoning_effort, m.context_window
                ),
            })
        }
        None => {
            // If model is a custom identifier, allow assigning with safe defaults
            Ok(FatherAgentAssignmentResult {
                success: true,
                assigned_model_id: model_id.to_string(),
                provider: provider.to_string(),
                model_name: format!("Custom Model ({})", model_id),
                context_window: 128_000,
                reasoning_effort: "medium".to_string(),
                father_agent_score: 90,
                persona: "lead-architect".to_string(),
                audit_note: format!(
                    "Custom Model '{}' assigned to Father Agent (Lead Architect) under provider '{}'.",
                    model_id, provider
                ),
            })
        }
    }
}
