use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SandboxValidationResult {
    pub allowed: bool,
    pub reason: Option<String>,
}

pub fn is_sensitive_key(key: &str) -> bool {
    let re = Regex::new(r"(?i)(KEY|SECRET|TOKEN|PASSWORD|AUTH|CREDENTIAL)").unwrap();
    re.is_match(key)
}

pub fn sanitize_env_map(env: HashMap<String, String>) -> HashMap<String, String> {
    env.into_iter()
        .filter(|(k, _)| !is_sensitive_key(k))
        .collect()
}

pub fn validate_domain(
    url_str: &str,
    block_outbound: bool,
    allowed_domains: &[String],
) -> SandboxValidationResult {
    // Quick parse scheme and host
    if let Ok(parsed) = url_str.parse::<url::Url>() {
        let host = parsed.host_str().unwrap_or("").to_lowercase();
        let is_local = host == "localhost" || host == "127.0.0.1" || host == "::1";

        if block_outbound && !is_local {
            return SandboxValidationResult {
                allowed: false,
                reason: Some(format!(
                    "[SANDBOX BLOCKED] Outbound URL '{}' blocked by security policy.",
                    url_str
                )),
            };
        }

        if !allowed_domains.is_empty() && !is_local {
            let matched = allowed_domains.iter().any(|d| {
                let clean = d.to_lowercase().trim_end_matches(":*").trim_end_matches('*').to_string();
                clean == "*" || host == clean || host.ends_with(&format!(".{}", clean))
            });
            if !matched {
                return SandboxValidationResult {
                    allowed: false,
                    reason: Some(format!(
                        "[SANDBOX BLOCKED] Domain '{}' is not in allowed outbound domains list.",
                        host
                    )),
                };
            }
        }

        SandboxValidationResult {
            allowed: true,
            reason: None,
        }
    } else {
        // Fallback for simple domain strings
        SandboxValidationResult {
            allowed: !block_outbound,
            reason: if block_outbound {
                Some("[SANDBOX BLOCKED] Invalid URL format.".into())
            } else {
                None
            },
        }
    }
}
