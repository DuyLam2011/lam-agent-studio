use rayon::prelude::*;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SymbolDef {
    pub name: String,
    pub kind: String, // "function" | "class" | "interface" | "type" | "variable"
    pub line: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedFile {
    pub file_path: String,
    pub symbols: Vec<SymbolDef>,
    pub imports: Vec<String>,
    pub line_count: usize,
}

pub fn scan_files(root: &str, ignored: &[String]) -> Vec<String> {
    let ignored_set: HashSet<String> = ignored
        .iter()
        .cloned()
        .chain([
            "node_modules".into(),
            ".git".into(),
            "dist".into(),
            "dist-electron".into(),
            "target".into(),
            ".agents".into(),
            ".vscode".into(),
        ])
        .collect();

    let root_path = Path::new(root);
    let mut files = Vec::new();

    for entry in WalkDir::new(root)
        .max_depth(8)
        .into_iter()
        .filter_entry(|e| {
            if let Some(name) = e.file_name().to_str() {
                !ignored_set.contains(name)
            } else {
                true
            }
        })
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            if let Some(ext) = entry.path().extension().and_then(|s| s.to_str()) {
                let ext_lower = ext.to_lowercase();
                if matches!(
                    ext_lower.as_str(),
                    "ts" | "tsx" | "js" | "jsx" | "py" | "rs" | "sql" | "md" | "json"
                ) {
                    if let Ok(rel) = entry.path().strip_prefix(root_path) {
                        files.push(rel.to_string_lossy().replace('\\', "/"));
                    }
                }
            }
        }
    }
    files
}

pub fn parse_symbols(file_path: &str, content: &str) -> ParsedFile {
    let lines: Vec<&str> = content.lines().collect();
    let line_count = lines.len();

    let export_re = Regex::new(r"export\s+(?:default\s+)?(?:const|function|class|interface|type|enum)\s+([A-Za-z0-9_]+)").unwrap();
    let func_re = Regex::new(r"(?:pub\s+fn|def|function)\s+([A-Za-z0-9_]+)").unwrap();
    let import_re = Regex::new(r"(?:import\s+.*?from\s+['\x22]([^'\x22]+)['\x22]|require\s*\(\s*['\x22]([^'\x22]+)['\x22]\))").unwrap();

    let mut symbols = Vec::new();
    let mut imports = Vec::new();

    for (idx, line) in lines.iter().enumerate() {
        let line_num = idx + 1;
        if let Some(caps) = export_re.captures(line) {
            if let Some(m) = caps.get(1) {
                symbols.push(SymbolDef {
                    name: m.as_str().to_string(),
                    kind: "export".to_string(),
                    line: line_num,
                });
            }
        } else if let Some(caps) = func_re.captures(line) {
            if let Some(m) = caps.get(1) {
                symbols.push(SymbolDef {
                    name: m.as_str().to_string(),
                    kind: "function".to_string(),
                    line: line_num,
                });
            }
        }

        if let Some(caps) = import_re.captures(line) {
            if let Some(m) = caps.get(1).or_else(|| caps.get(2)) {
                imports.push(m.as_str().to_string());
            }
        }
    }

    ParsedFile {
        file_path: file_path.to_string(),
        symbols,
        imports,
        line_count,
    }
}

pub fn parse_workspace_parallel(root: &str, files: &[String]) -> Vec<ParsedFile> {
    files
        .par_iter()
        .filter_map(|rel| {
            let full_path = Path::new(root).join(rel);
            if let Ok(content) = std::fs::read_to_string(&full_path) {
                Some(parse_symbols(rel, &content))
            } else {
                None
            }
        })
        .collect()
}
