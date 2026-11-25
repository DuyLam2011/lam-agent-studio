#[macro_use]
extern crate napi_derive;

pub mod analysis;
pub mod orchestration;
pub mod security;
pub mod transform;
pub mod types;

pub use analysis::*;
pub use orchestration::*;
pub use security::*;
pub use transform::*;
pub use types::*;

use napi::bindgen_prelude::*;
use napi::Result;
use std::collections::HashMap;

// ==========================================
// 1. Surgical Patch Engine
// ==========================================

#[napi]
pub fn fast_apply_patch(
    original: String,
    target: String,
    replacement: String,
) -> Result<NativePatchResult> {
    match transform::patch::apply_surgical_edit(&original, &target, &replacement) {
        Ok(res) => Ok(NativePatchResult {
            updated_content: res.updated_content,
            lines_added: res.lines_added as u32,
            lines_removed: res.lines_removed as u32,
            match_type: res.match_type,
        }),
        Err(err) => Err(Error::from_reason(err)),
    }
}

// ==========================================
// 2. AST Parsing & Codebase Scan
// ==========================================

#[napi]
pub fn fast_scan_workspace(root: String, ignored: Vec<String>) -> Vec<String> {
    analysis::ast::scan_files(&root, &ignored)
}

#[napi]
pub fn fast_parse_file_symbols(file_path: String, content: String) -> NativeParsedFile {
    let parsed = analysis::ast::parse_symbols(&file_path, &content);
    NativeParsedFile {
        file_path: parsed.file_path,
        symbols: parsed
            .symbols
            .into_iter()
            .map(|s| NativeSymbolDef {
                name: s.name,
                kind: s.kind,
                line: s.line as u32,
            })
            .collect(),
        imports: parsed.imports,
        line_count: parsed.line_count as u32,
    }
}

#[napi]
pub fn fast_parse_workspace_parallel(
    root: String,
    files: Vec<String>,
) -> Vec<NativeParsedFile> {
    let results = analysis::ast::parse_workspace_parallel(&root, &files);
    results
        .into_iter()
        .map(|p| NativeParsedFile {
            file_path: p.file_path,
            symbols: p
                .symbols
                .into_iter()
                .map(|s| NativeSymbolDef {
                    name: s.name,
                    kind: s.kind,
                    line: s.line as u32,
                })
                .collect(),
            imports: p.imports,
            line_count: p.line_count as u32,
        })
        .collect()
}

// ==========================================
// 3. Fast Streaming NDJSON & Token Estimation
// ==========================================

#[napi]
pub fn fast_parse_ndjson_stream(buffer: String) -> NativeNdjsonResult {
    let (events, leftover) = transform::ndjson::parse_ndjson_lines(&buffer);
    NativeNdjsonResult {
        events: events
            .into_iter()
            .map(|e| NativeStreamEvent {
                event_type: e.event_type,
                content: e.content,
                raw: e.raw,
            })
            .collect(),
        leftover,
    }
}

#[napi]
pub fn fast_estimate_tokens(text: String) -> u32 {
    transform::ndjson::estimate_tokens_fast(&text)
}

#[napi]
pub fn fast_strip_ansi(text: String) -> String {
    transform::ndjson::strip_ansi(&text)
}

// ==========================================
// 4. Sandbox & Domain Validation
// ==========================================

#[napi]
pub fn fast_validate_domain(
    url: String,
    block_outbound: bool,
    allowed_domains: Vec<String>,
) -> NativeValidationResult {
    let res = security::sandbox::validate_domain(&url, block_outbound, &allowed_domains);
    NativeValidationResult {
        allowed: res.allowed,
        reason: res.reason,
    }
}

#[napi]
pub fn fast_sanitize_env(env: HashMap<String, String>) -> HashMap<String, String> {
    security::sandbox::sanitize_env_map(env)
}

// ==========================================
// 5. Ripgrep-grade Codebase Search
// ==========================================

#[napi]
pub fn fast_search_workspace(
    root: String,
    query: String,
    is_regex: bool,
    max_results: u32,
    ignored: Vec<String>,
) -> Result<NativeSearchResult> {
    match analysis::search::search_workspace(&root, &query, is_regex, max_results as usize, &ignored) {
        Ok(res) => Ok(NativeSearchResult {
            matches: res
                .matches
                .into_iter()
                .map(|m| NativeSearchMatch {
                    file_path: m.file_path,
                    line_number: m.line_number as u32,
                    line_content: m.line_content,
                })
                .collect(),
            files_scanned: res.files_scanned as u32,
            truncated: res.truncated,
            duration_ms: res.duration_ms,
        }),
        Err(err) => Err(Error::from_reason(err)),
    }
}

// ==========================================
// 6. Code Mode Context Distillation
// ==========================================

#[napi]
pub fn fast_code_mode_distill(
    raw_text: String,
    max_lines: u32,
    pattern: Option<String>,
) -> NativeCodeModeDistillResult {
    let res = orchestration::codemode::distill_output(&raw_text, max_lines as usize, pattern.as_deref());
    NativeCodeModeDistillResult {
        distilled_output: res.distilled_output,
        raw_bytes: res.raw_bytes as u32,
        distilled_bytes: res.distilled_bytes as u32,
        estimated_tokens_saved: res.estimated_tokens_saved,
        lines_original: res.lines_original as u32,
        lines_retained: res.lines_retained as u32,
        duration_ms: res.duration_ms,
    }
}

#[napi]
pub fn fast_code_mode_envelope(
    action_name: String,
    status: String,
    distilled_data: String,
    tokens_saved: u32,
    elapsed_ms: f64,
) -> String {
    orchestration::codemode::format_code_mode_envelope(
        &action_name,
        &status,
        &distilled_data,
        tokens_saved,
        elapsed_ms,
    )
}

// ==========================================
// 7. Package Models Discovery
// ==========================================

#[napi]
pub fn fast_discover_package_models(provider: String, raw_payload_or_cache: String) -> String {
    let result = orchestration::model_discovery::discover_package_models(&provider, &raw_payload_or_cache);
    serde_json::to_string(&result).unwrap_or_else(|_| "{}".to_string())
}

#[napi]
pub fn fast_assign_father_agent_model(
    provider: String,
    model_id: String,
    raw_payload_or_cache: String,
) -> String {
    match orchestration::model_discovery::assign_model_to_father_agent(&provider, &model_id, &raw_payload_or_cache) {
        Ok(res) => serde_json::to_string(&res).unwrap_or_else(|_| "{}".to_string()),
        Err(err) => serde_json::json!({
            "success": false,
            "error": err
        })
        .to_string(),
    }
}

#[napi]
pub fn fast_detect_account_tier(provider: String, raw_auth_or_config: String) -> String {
    let tier = orchestration::model_discovery::detect_account_tier(&provider, &raw_auth_or_config);
    serde_json::to_string(&tier).unwrap_or_else(|_| "{}".to_string())
}

// ==========================================
// 8. Father Agent Delegation Handoff
// ==========================================

#[napi]
pub fn fast_build_delegation_contract(
    user_goal: String,
    file_context: String,
    father_model: Option<String>,
    coding_engine: Option<String>,
) -> String {
    let contract = orchestration::father_delegation::build_delegation_contract(
        &user_goal,
        &file_context,
        father_model.as_deref(),
        coding_engine.as_deref(),
    );
    serde_json::to_string(&contract).unwrap_or_else(|_| "{}".to_string())
}

#[napi]
pub fn fast_verify_delegation_execution(
    contract_json: String,
    diff_summary: String,
    test_output: String,
) -> String {
    let contract: orchestration::father_delegation::TaskContractSpec = match serde_json::from_str(&contract_json) {
        Ok(c) => c,
        Err(err) => {
            return serde_json::json!({
                "contract_id": "unknown",
                "passed": false,
                "quality_score": 0,
                "checked_criteria": Vec::<String>::new(),
                "violations": vec![format!("Failed to parse contract JSON: {}", err)],
                "father_verdict": "❌ Delegation contract parse error.",
                "synthesis_summary": "Unable to verify execution result due to invalid JSON payload."
            })
            .to_string();
        }
    };
    let res = orchestration::father_delegation::verify_coding_agent_execution(&contract, &diff_summary, &test_output);
    serde_json::to_string(&res).unwrap_or_else(|_| "{}".to_string())
}

// ==========================================
// 9. Vendor Bundle Integrity & External Agent Watcher
// ==========================================

#[napi]
pub fn fast_sha256_hex(input: String) -> String {
    transform::hash::sha256_hex(input.as_bytes())
}

#[napi]
pub fn fast_sha256_file(file_path: String) -> Result<String> {
    transform::hash::sha256_file_hex(&file_path).map_err(Error::from_reason)
}

#[napi]
pub fn fast_scan_external_agent_sessions(
    claude_dir: String,
    codex_dir: String,
    antigravity_dir: String,
    max_per_provider: Option<u32>,
) -> String {
    let report = analysis::external_sessions::scan_external_agent_sessions(
        &claude_dir,
        &codex_dir,
        &antigravity_dir,
        max_per_provider.unwrap_or(5) as usize,
    );
    serde_json::to_string(&report).unwrap_or_else(|_| "{}".to_string())
}
