use napi_derive::napi;
use regex::Regex;
use std::path::{Path, PathBuf};

#[napi(object)]
pub struct PathSandboxResult {
    pub allowed: bool,
    pub resolved_path: String,
    pub relative_path: String,
    pub reason: Option<String>,
}

#[napi(object)]
pub struct SecurityCommandResult {
    pub allowed: bool,
    pub reason: Option<String>,
}

#[napi(object)]
pub struct NativeSecurityFinding {
    pub finding_type: String,
    pub severity: String,
    pub message: String,
    pub suggestion: String,
}

#[napi(object)]
pub struct NativeSecurityAuditResult {
    pub score: u32,
    pub level: String,
    pub findings: Vec<NativeSecurityFinding>,
    pub sanitized_content: String,
}

#[napi]
pub fn check_path_sandbox(
    workspace_root: String,
    input_path: String,
    action: String,
    security_mode: String,
) -> PathSandboxResult {
    let ws_path = Path::new(&workspace_root);
    let mut clean_input = input_path.trim_start_matches(|c| c == '/' || c == '\\').to_string();

    // Check if input path has root folder prefix and strip it
    if let Some(file_name) = ws_path.file_name().and_then(|s| s.to_str()) {
        let prefix = format!("{}/", file_name.to_lowercase());
        let prefix_win = format!("{}\\", file_name.to_lowercase());
        let lower = clean_input.to_lowercase();
        if lower.starts_with(&prefix) {
            clean_input = clean_input[prefix.len()..].to_string();
        } else if lower.starts_with(&prefix_win) {
            clean_input = clean_input[prefix_win.len()..].to_string();
        }
    }

    let resolved = if Path::new(&clean_input).is_absolute() {
        PathBuf::from(&clean_input)
    } else {
        ws_path.join(&clean_input)
    };

    let norm_ws = normalize_path_str(ws_path);
    let norm_res = normalize_path_str(&resolved);

    let in_sandbox = norm_res == norm_ws
        || norm_res.starts_with(&format!("{}/", norm_ws))
        || norm_res.starts_with(&format!("{}\\", norm_ws));

    let rel_path = resolved
        .strip_prefix(ws_path)
        .map(|p| p.to_string_lossy().replace('\\', "/"))
        .unwrap_or_else(|_| clean_input.clone());

    let res_str = resolved.to_string_lossy().to_string();

    if !in_sandbox {
        return PathSandboxResult {
            allowed: false,
            resolved_path: res_str,
            relative_path: rel_path,
            reason: Some(format!(
                "[SANDBOX VIOLATION] Access to path '{}' outside workspace root is strictly blocked.",
                input_path
            )),
        };
    }

    if security_mode == "restricted" && (action == "write" || action == "delete") {
        return PathSandboxResult {
            allowed: false,
            resolved_path: res_str,
            relative_path: rel_path,
            reason: Some(format!(
                "[RESTRICTED MODE] File modifications ({}) are blocked. Switch to Guarded or Turbo mode.",
                action
            )),
        };
    }

    let lower_rel = rel_path.to_lowercase();
    let is_sensitive = lower_rel.ends_with(".env")
        || lower_rel.contains("/.env.")
        || lower_rel.contains("/.git/")
        || lower_rel.contains("id_rsa")
        || lower_rel.contains("id_ed25519")
        || lower_rel.contains(".aws/credentials")
        || lower_rel.contains(".npmrc");

    if is_sensitive && (action != "read" || security_mode == "restricted") {
        return PathSandboxResult {
            allowed: false,
            resolved_path: res_str,
            relative_path: rel_path,
            reason: Some(format!(
                "[SECURITY GUARD] Access to sensitive file '{}' blocked under policy.",
                input_path
            )),
        };
    }

    PathSandboxResult {
        allowed: true,
        resolved_path: res_str,
        relative_path: rel_path,
        reason: None,
    }
}

#[napi]
pub fn check_command_security(command: String, security_mode: String) -> SecurityCommandResult {
    if security_mode == "restricted" {
        return SecurityCommandResult {
            allowed: false,
            reason: Some("[RESTRICTED MODE] Terminal execution blocked. Switch to Guarded or Turbo mode.".to_string()),
        };
    }

    let dangerous_patterns = [
        r"(?i)rm\s+-rf\s+[/~]",
        r"(?i)(?:format\s+[a-z]:|mkfs\.)",
        r"(?i)del\s+/[fq]\s+[a-z]:\\",
        r":\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;",
        r"(?i)(?:curl|wget)\s+[^\n|]+\|\s*(?:sh|bash|powershell|cmd)",
        r"(?i)(?:nc\s+-e|bash\s+-i\s+>&\s*/dev/tcp)",
    ];

    for pat in &dangerous_patterns {
        if let Ok(re) = Regex::new(pat) {
            if re.is_match(&command) {
                return SecurityCommandResult {
                    allowed: false,
                    reason: Some("[SECURITY HARNESS] Command rejected: matched critical destructive pattern.".to_string()),
                };
            }
        }
    }

    SecurityCommandResult {
        allowed: true,
        reason: None,
    }
}

#[napi]
pub fn audit_security_content(_name: String, content: String) -> NativeSecurityAuditResult {
    let mut findings = Vec::new();
    let mut sanitized = content.clone();

    // Injection checks
    let injection_rules = [
        (r"(?i)ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions", "Detected instruction override attack", "critical"),
        (r"(?i)(?:disregard|forget)\s+(?:all\s+)?(?:rules|directives|safety)", "Detected safety directive bypass attempt", "critical"),
        (r"(?i)(?:you\s+are\s+now|act\s+as)\s+(?:DAN|jailbroken|unrestricted|god\s*mode)", "Detected persona jailbreak pattern", "high"),
        (r"(?i)</?(?:system|assistant|user_request|admin)[^>]*>", "Detected delimiter smuggling / boundary injection", "high"),
    ];

    for (pat, msg, sev) in &injection_rules {
        if let Ok(re) = Regex::new(pat) {
            if re.is_match(&content) {
                findings.push(NativeSecurityFinding {
                    finding_type: "injection".to_string(),
                    severity: sev.to_string(),
                    message: msg.to_string(),
                    suggestion: "Remove prompt override delimiters and maintain strict compliance.".to_string(),
                });
                sanitized = re.replace_all(&sanitized, "[BLOCKED_INJECTION_PATTERN]").to_string();
            }
        }
    }

    // Dangerous command checks
    let cmd_rules = [
        (r"(?i)rm\s+-rf\s+[/~]", "Destructive root/home directory deletion command", "critical"),
        (r"(?i)(?:format\s+[a-z]:|mkfs\.)", "Disk or filesystem formatting command", "critical"),
        (r":\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;", "Detected shell fork bomb", "critical"),
        (r"(?i)(?:curl|wget)\s+[^\n|]+\|\s*(?:sh|bash|powershell|cmd)", "Unverified remote script pipe execution", "high"),
    ];

    for (pat, msg, sev) in &cmd_rules {
        if let Ok(re) = Regex::new(pat) {
            if re.is_match(&content) {
                findings.push(NativeSecurityFinding {
                    finding_type: "dangerous_command".to_string(),
                    severity: sev.to_string(),
                    message: msg.to_string(),
                    suggestion: "Substitute with safe, isolated commands.".to_string(),
                });
                sanitized = re.replace_all(&sanitized, "[BLOCKED_DANGEROUS_COMMAND]").to_string();
            }
        }
    }

    // Secret leaks
    let secret_rules = [
        (r#"(?i)(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*["']?[a-zA-Z0-9_\-]{20,}["']?"#, "Potential hardcoded API key or access token", "high"),
        (r"-----BEGIN\s+(?:RSA|OPENSSH|EC)?\s*PRIVATE\s+KEY-----", "Private cryptographic key detected in content", "critical"),
    ];

    for (pat, msg, sev) in &secret_rules {
        if let Ok(re) = Regex::new(pat) {
            if re.is_match(&content) {
                findings.push(NativeSecurityFinding {
                    finding_type: "credential_leak".to_string(),
                    severity: sev.to_string(),
                    message: msg.to_string(),
                    suggestion: "Store secrets in environment variables (.env) or secret managers.".to_string(),
                });
                sanitized = re.replace_all(&sanitized, "[BLOCKED_SECRET_TOKEN]").to_string();
            }
        }
    }

    let penalty = (findings.len() as u32) * 25;
    let score = if penalty >= 100 { 0 } else { 100 - penalty };
    let level = if score >= 80 {
        "safe".to_string()
    } else if score >= 40 {
        "warning".to_string()
    } else {
        "critical".to_string()
    };

    NativeSecurityAuditResult {
        score,
        level,
        findings,
        sanitized_content: sanitized,
    }
}

fn normalize_path_str(path: &Path) -> String {
    path.to_string_lossy()
        .replace('\\', "/")
        .trim_end_matches('/')
        .to_lowercase()
}
