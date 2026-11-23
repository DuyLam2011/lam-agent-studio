#[macro_use]
extern crate napi_derive;

pub mod ast;
pub mod ndjson;
pub mod patch;
pub mod sandbox;

use napi::bindgen_prelude::*;
use napi::Result;
use std::collections::HashMap;

#[napi(object)]
pub struct NativePatchResult {
    pub updated_content: String,
    pub lines_added: u32,
    pub lines_removed: u32,
    pub match_type: String,
}

#[napi(object)]
pub struct NativeSymbolDef {
    pub name: String,
    pub kind: String,
    pub line: u32,
}

#[napi(object)]
pub struct NativeParsedFile {
    pub file_path: String,
    pub symbols: Vec<NativeSymbolDef>,
    pub imports: Vec<String>,
    pub line_count: u32,
}

#[napi(object)]
pub struct NativeStreamEvent {
    pub event_type: String,
    pub content: String,
    pub raw: Option<String>,
}

#[napi(object)]
pub struct NativeNdjsonResult {
    pub events: Vec<NativeStreamEvent>,
    pub leftover: String,
}

#[napi(object)]
pub struct NativeValidationResult {
    pub allowed: bool,
    pub reason: Option<String>,
}

#[napi]
pub fn fast_apply_patch(
    original: String,
    target: String,
    replacement: String,
) -> Result<NativePatchResult> {
    match patch::apply_surgical_edit(&original, &target, &replacement) {
        Ok(res) => Ok(NativePatchResult {
            updated_content: res.updated_content,
            lines_added: res.lines_added as u32,
            lines_removed: res.lines_removed as u32,
            match_type: res.match_type,
        }),
        Err(err) => Err(Error::from_reason(err)),
    }
}

#[napi]
pub fn fast_scan_workspace(root: String, ignored: Vec<String>) -> Vec<String> {
    ast::scan_files(&root, &ignored)
}

#[napi]
pub fn fast_parse_file_symbols(file_path: String, content: String) -> NativeParsedFile {
    let parsed = ast::parse_symbols(&file_path, &content);
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
    let results = ast::parse_workspace_parallel(&root, &files);
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

#[napi]
pub fn fast_parse_ndjson_stream(buffer: String) -> NativeNdjsonResult {
    let (events, leftover) = ndjson::parse_ndjson_lines(&buffer);
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
    ndjson::estimate_tokens_fast(&text)
}

#[napi]
pub fn fast_strip_ansi(text: String) -> String {
    ndjson::strip_ansi(&text)
}

#[napi]
pub fn fast_validate_domain(
    url: String,
    block_outbound: bool,
    allowed_domains: Vec<String>,
) -> NativeValidationResult {
    let res = sandbox::validate_domain(&url, block_outbound, &allowed_domains);
    NativeValidationResult {
        allowed: res.allowed,
        reason: res.reason,
    }
}

#[napi]
pub fn fast_sanitize_env(env: HashMap<String, String>) -> HashMap<String, String> {
    sandbox::sanitize_env_map(env)
}
