use napi_derive::napi;
use rayon::prelude::*;
use regex::Regex;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

#[napi(object)]
pub struct NativeInvariantReport {
    pub passed: bool,
    pub violations: Vec<String>,
    pub line_count_audit: HashMap<String, u32>,
}

#[napi]
pub fn audit_invariants_native(
    workspace_root: String,
    target_files: Vec<String>,
) -> NativeInvariantReport {
    let ws = Path::new(&workspace_root);
    let secret_re = Regex::new(
        r#"(?i)(?:api[_-]?key|secret|token|password|bearer)\s*[:=]\s*['"][a-zA-Z0-9_\-]{24,}['"]"#,
    )
    .ok();

    // Process files in parallel with Rayon
    let results: Vec<(String, Option<(u32, Vec<String>)>)> = target_files
        .par_iter()
        .map(|rel| {
            let rel_clean = rel.replace('\\', "/");
            if rel_clean.contains("node_modules/")
                || rel_clean.contains(".git/")
                || rel_clean.contains("dist/")
                || rel_clean.contains("dist-electron/")
            {
                return (rel_clean, None);
            }

            let full = if Path::new(&rel_clean).is_absolute() {
                Path::new(&rel_clean).to_path_buf()
            } else {
                ws.join(&rel_clean)
            };

            let content = match fs::read_to_string(&full) {
                Ok(c) => c,
                Err(_) => return (rel_clean, None),
            };

            let line_count = content.lines().count() as u32;
            let mut file_violations = Vec::new();

            // Rule 4 Modularity Check (< 150 lines)
            if line_count > 150
                && !rel_clean.ends_with(".json")
                && !rel_clean.ends_with(".lock")
                && !rel_clean.ends_with(".md")
            {
                file_violations.push(format!(
                    "[Rule 4 Violation]: {} has {} lines (exceeds strictly-enforced 150-line modularity limit).",
                    rel_clean, line_count
                ));
            }

            // Secret Leaks Check
            if let Some(ref re) = secret_re {
                if re.is_match(&content) {
                    file_violations.push(format!(
                        "[Security Invariant Violation]: Possible hardcoded credential or token detected in {}.",
                        rel_clean
                    ));
                }
            }

            (rel_clean, Some((line_count, file_violations)))
        })
        .collect();

    let mut line_count_audit = HashMap::new();
    let mut violations = Vec::new();

    for (rel, res) in results {
        if let Some((count, v_list)) = res {
            line_count_audit.insert(rel, count);
            violations.extend(v_list);
        }
    }

    let passed = violations.is_empty();

    NativeInvariantReport {
        passed,
        violations,
        line_count_audit,
    }
}
