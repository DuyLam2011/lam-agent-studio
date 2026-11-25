use rayon::prelude::*;
use regex::RegexBuilder;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Mutex;
use std::time::Instant;
use walkdir::WalkDir;

const BINARY_EXTENSIONS: &[&str] = &[
    "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "pdf", "zip", "gz", "7z", "rar",
    "exe", "dll", "so", "dylib", "bin", "pak", "dat", "woff", "woff2", "ttf", "otf", "eot",
    "mp3", "mp4", "mov", "avi", "wasm", "asar", "lock", "node", "pdb",
];

const MAX_FILE_SIZE_BYTES: u64 = 1_500_000;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchMatch {
    pub file_path: String,
    pub line_number: u32,
    pub line_content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub matches: Vec<SearchMatch>,
    pub files_scanned: u32,
    pub truncated: bool,
    pub duration_ms: f64,
}

pub fn search_workspace(
    root: &str,
    query: &str,
    is_regex: bool,
    max_results: usize,
    custom_ignored: &[String],
) -> Result<SearchResult, String> {
    let start_time = Instant::now();
    let root_path = Path::new(root);
    if !root_path.exists() {
        return Err(format!("Workspace root '{}' does not exist", root));
    }

    let regex_pattern = if is_regex {
        query.to_string()
    } else {
        regex::escape(query)
    };

    let regex = RegexBuilder::new(&regex_pattern)
        .case_insensitive(true)
        .build()
        .map_err(|e| format!("Invalid search pattern: {}", e))?;

    let mut ignored_dirs: HashSet<String> = [
        "node_modules", ".git", "dist", "dist-electron", "build", "release",
        "target", ".agents", ".vscode", ".idea", "coverage", ".next", ".cache",
    ]
    .iter()
    .map(|s| s.to_string())
    .collect();

    for ign in custom_ignored {
        ignored_dirs.insert(ign.clone());
    }

    let bin_set: HashSet<&str> = BINARY_EXTENSIONS.iter().copied().collect();

    // 1. Fast file discovery
    let mut candidate_files: Vec<(String, std::path::PathBuf)> = Vec::new();

    for entry in WalkDir::new(root)
        .max_depth(9)
        .into_iter()
        .filter_entry(|e| {
            if let Some(name) = e.file_name().to_str() {
                !ignored_dirs.contains(name)
            } else {
                true
            }
        })
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            let path = entry.path();
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                if bin_set.contains(ext.to_lowercase().as_str()) {
                    continue;
                }
            }
            if let Ok(meta) = entry.metadata() {
                if meta.len() > MAX_FILE_SIZE_BYTES {
                    continue;
                }
            }
            if let Ok(rel) = path.strip_prefix(root_path) {
                let rel_str = rel.to_string_lossy().replace('\\', "/");
                candidate_files.push((rel_str, path.to_path_buf()));
            }
        }
    }

    let scanned_counter = AtomicUsize::new(0);
    let all_matches = Mutex::new(Vec::new());
    let max_limit = max_results.clamp(1, 1000);

    // 2. Multi-threaded parallel file content scan with Rayon
    candidate_files.par_iter().for_each(|(rel_path, full_path)| {
        if all_matches.lock().map(|m| m.len() >= max_limit).unwrap_or(false) {
            return;
        }

        if let Ok(file) = File::open(full_path) {
            scanned_counter.fetch_add(1, Ordering::Relaxed);
            let reader = BufReader::with_capacity(32 * 1024, file);

            for (idx, line_res) in reader.lines().enumerate() {
                if let Ok(line) = line_res {
                    if regex.is_match(&line) {
                        let trimmed = line.trim();
                        let display_content = if trimmed.len() > 240 {
                            format!("{}...", &trimmed[..240])
                        } else {
                            trimmed.to_string()
                        };

                        let mut lock = all_matches.lock().unwrap();
                        if lock.len() < max_limit {
                            lock.push(SearchMatch {
                                file_path: rel_path.clone(),
                                line_number: (idx + 1) as u32,
                                line_content: display_content,
                            });
                        } else {
                            break;
                        }
                    }
                }
            }
        }
    });

    let mut matches = all_matches.into_inner().unwrap();
    // Sort matches deterministically by file_path and line_number
    matches.sort_by(|a, b| {
        a.file_path
            .cmp(&b.file_path)
            .then(a.line_number.cmp(&b.line_number))
    });

    let truncated = matches.len() >= max_limit;
    let duration_ms = start_time.elapsed().as_secs_f64() * 1000.0;

    Ok(SearchResult {
        matches,
        files_scanned: scanned_counter.load(Ordering::Relaxed) as u32,
        truncated,
        duration_ms,
    })
}
