use serde::Serialize;
use serde_json::Value;
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize)]
pub struct CapturedCommandEntry {
    pub provider: String,
    pub session_id: String,
    pub command: String,
    pub cwd: String,
    pub timestamp_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExternalSessionSummary {
    pub id: String,
    pub provider: String,
    pub title: String,
    pub cwd: String,
    pub branch: String,
    pub model: String,
    pub originator: String,
    pub updated_at_ms: u64,
    pub recent_commands: Vec<String>,
    pub edited_files: Vec<String>,
    pub source_file: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExternalAgentReport {
    pub scanned_at_ms: u64,
    pub sessions: Vec<ExternalSessionSummary>,
    pub captured_commands: Vec<CapturedCommandEntry>,
    pub father_context_markdown: String,
}

fn mtime_ms(p: &Path) -> u64 {
    fs::metadata(p)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn recent_files_with_ext(root: &str, ext: &str, max_depth: usize, limit: usize) -> Vec<(u64, PathBuf)> {
    if root.is_empty() || !Path::new(root).exists() {
        return Vec::new();
    }
    let mut items: Vec<(u64, PathBuf)> = WalkDir::new(root)
        .max_depth(max_depth)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file() && e.path().extension().and_then(|s| s.to_str()) == Some(ext))
        .map(|e| {
            let p = e.path().to_path_buf();
            (mtime_ms(&p), p)
        })
        .collect();
    items.sort_by(|a, b| b.0.cmp(&a.0));
    items.truncate(limit);
    items
}

fn push_unique(vec: &mut Vec<String>, val: &str, cap: usize) {
    let trimmed = val.trim();
    if trimmed.is_empty() || vec.iter().any(|x| x == trimmed) {
        return;
    }
    if vec.len() < cap {
        vec.push(trimmed.chars().take(240).collect());
    }
}

fn extract_bash_from_rendered(text: &str, cmds: &mut Vec<String>) {
    if let Some(idx) = text.find("{\"command\":") {
        if let Ok(v) = serde_json::from_str::<Value>(&text[idx..].lines().next().unwrap_or("")) {
            if let Some(c) = v.get("command").and_then(|s| s.as_str()) {
                push_unique(cmds, c, 8);
            }
        }
    }
}

fn scan_claude_projects(claude_dir: &str, limit: usize, sessions: &mut Vec<ExternalSessionSummary>, cmds_out: &mut Vec<CapturedCommandEntry>) {
    let projects_dir = Path::new(claude_dir).join("projects");
    let files = recent_files_with_ext(projects_dir.to_str().unwrap_or(""), "jsonl", 3, limit);
    for (ts, file_path) in files {
        let Ok(file) = File::open(&file_path) else { continue };
        let reader = BufReader::new(file);
        let mut session_id = file_path.file_stem().and_then(|s| s.to_str()).unwrap_or("claude").to_string();
        let (mut title, mut cwd, mut branch, mut model, mut entrypoint) = (String::new(), String::new(), String::new(), String::new(), String::from("claude-code"));
        let (mut cmds, mut edits) = (Vec::new(), Vec::new());

        for line in reader.lines().map_while(Result::ok).take(400) {
            let Ok(v) = serde_json::from_str::<Value>(&line) else { continue };
            if let Some(s) = v.get("sessionId").and_then(|x| x.as_str()) { session_id = s.to_string(); }
            if cwd.is_empty() { if let Some(s) = v.get("cwd").and_then(|x| x.as_str()) { cwd = s.to_string(); } }
            if branch.is_empty() { if let Some(s) = v.get("gitBranch").and_then(|x| x.as_str()) { branch = s.to_string(); } }
            if let Some(ep) = v.get("entrypoint").and_then(|x| x.as_str()) { entrypoint = ep.to_string(); }
            if let Some(att) = v.get("attachment") {
                if let Some(mid) = att.get("identity").and_then(|i| i.get("modelId")).and_then(|x| x.as_str()) {
                    model = mid.to_string();
                }
            }
            if v.get("type").and_then(|t| t.as_str()) == Some("user") && title.is_empty() {
                if let Some(c) = v.get("message").and_then(|m| m.get("content")).and_then(|x| x.as_str()) {
                    title = c.lines().next().unwrap_or("").chars().take(100).collect();
                }
            }
            if let Some(blocks) = v.get("message").and_then(|m| m.get("content")).and_then(|x| x.as_array()) {
                for b in blocks {
                    if b.get("type").and_then(|t| t.as_str()) == Some("tool_use") {
                        let tname = b.get("name").and_then(|n| n.as_str()).unwrap_or("");
                        if let Some(inp) = b.get("input") {
                            if let Some(c) = inp.get("command").and_then(|x| x.as_str()) { push_unique(&mut cmds, c, 8); }
                            if tname == "Edit" || tname == "Write" {
                                if let Some(fp) = inp.get("file_path").and_then(|x| x.as_str()) { push_unique(&mut edits, fp, 8); }
                            }
                        }
                    }
                }
            }
            if let Some(rendered) = v.get("rendered").and_then(|r| r.as_array()) {
                for item in rendered {
                    if let Some(txt) = item.get("content").and_then(|x| x.as_str()) {
                        extract_bash_from_rendered(txt, &mut cmds);
                    }
                }
            }
        }
        for c in &cmds {
            cmds_out.push(CapturedCommandEntry { provider: "claudecode".to_string(), session_id: session_id.clone(), command: c.clone(), cwd: cwd.clone(), timestamp_ms: ts });
        }
        sessions.push(ExternalSessionSummary {
            id: session_id, provider: "claudecode".to_string(), title: if title.is_empty() { "Claude Session".to_string() } else { title },
            cwd, branch, model, originator: entrypoint, updated_at_ms: ts, recent_commands: cmds, edited_files: edits,
            source_file: file_path.to_string_lossy().to_string(),
        });
    }
}

fn load_codex_index(codex_dir: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    let idx_path = Path::new(codex_dir).join("session_index.jsonl");
    if let Ok(file) = File::open(idx_path) {
        for line in BufReader::new(file).lines().map_while(Result::ok) {
            if let Ok(v) = serde_json::from_str::<Value>(&line) {
                if let (Some(id), Some(name)) = (v.get("id").and_then(|x| x.as_str()), v.get("thread_name").and_then(|x| x.as_str())) {
                    map.insert(id.to_string(), name.to_string());
                }
            }
        }
    }
    map
}

fn scan_codex_sessions(codex_dir: &str, limit: usize, sessions: &mut Vec<ExternalSessionSummary>, cmds_out: &mut Vec<CapturedCommandEntry>) {
    let titles = load_codex_index(codex_dir);
    let sess_dir = Path::new(codex_dir).join("sessions");
    let files = recent_files_with_ext(sess_dir.to_str().unwrap_or(""), "jsonl", 5, limit);
    for (ts, file_path) in files {
        let Ok(file) = File::open(&file_path) else { continue };
        let (mut sid, mut cwd, mut originator, mut title) = (String::new(), String::new(), String::from("Codex"), String::new());
        let mut cmds = Vec::new();
        for line in BufReader::new(file).lines().map_while(Result::ok).take(400) {
            let Ok(v) = serde_json::from_str::<Value>(&line) else { continue };
            if v.get("type").and_then(|t| t.as_str()) == Some("session_meta") {
                if let Some(p) = v.get("payload") {
                    if let Some(s) = p.get("id").and_then(|x| x.as_str()) { sid = s.to_string(); }
                    if let Some(s) = p.get("cwd").and_then(|x| x.as_str()) { cwd = s.to_string(); }
                    if let Some(s) = p.get("originator").and_then(|x| x.as_str()) { originator = s.to_string(); }
                }
            }
            if let Some(cmd) = v.pointer("/payload/arguments").and_then(|a| a.as_str()).and_then(|raw| serde_json::from_str::<Value>(raw).ok()).and_then(|jv| jv.get("cmd").or_else(|| jv.get("command")).and_then(|c| c.as_str()).map(|s| s.to_string())) {
                push_unique(&mut cmds, &cmd, 8);
            }
            if title.is_empty() {
                if let Some(msg) = v.pointer("/payload/content/0/text").and_then(|x| x.as_str()) {
                    title = msg.lines().next().unwrap_or("").chars().take(100).collect();
                }
            }
        }
        let resolved_title = titles.get(&sid).cloned().filter(|t| !t.is_empty()).unwrap_or_else(|| if title.is_empty() { "Codex Thread".to_string() } else { title });
        for c in &cmds {
            cmds_out.push(CapturedCommandEntry { provider: "codex".to_string(), session_id: sid.clone(), command: c.clone(), cwd: cwd.clone(), timestamp_ms: ts });
        }
        sessions.push(ExternalSessionSummary {
            id: if sid.is_empty() { file_path.file_stem().and_then(|s| s.to_str()).unwrap_or("codex").to_string() } else { sid },
            provider: "codex".to_string(), title: resolved_title, cwd, branch: String::new(), model: "codex-agent".to_string(),
            originator, updated_at_ms: ts, recent_commands: cmds, edited_files: Vec::new(),
            source_file: file_path.to_string_lossy().to_string(),
        });
    }
}

fn scan_antigravity_state(agy_dir: &str, limit: usize, sessions: &mut Vec<ExternalSessionSummary>) {
    let mut model = String::from("gemini-3.8-flash-high");
    let pbtxt = Path::new(agy_dir).join("antigravity_state.pbtxt");
    if let Ok(raw) = fs::read_to_string(&pbtxt) {
        for line in raw.lines() {
            if let Some(rest) = line.trim().strip_prefix("last_selected_agent_model:") {
                model = rest.trim().to_string();
            }
        }
    }
    let conv_dir = Path::new(agy_dir).join("conversations");
    for (ts, db_path) in recent_files_with_ext(conv_dir.to_str().unwrap_or(""), "db", 2, limit) {
        let id = db_path.file_stem().and_then(|s| s.to_str()).unwrap_or("agy").to_string();
        sessions.push(ExternalSessionSummary {
            id: id.clone(), provider: "antigravity".to_string(), title: format!("Antigravity Session ({})", &id[..id.len().min(8)]),
            cwd: String::new(), branch: String::new(), model: model.clone(), originator: "Antigravity IDE".to_string(),
            updated_at_ms: ts, recent_commands: Vec::new(), edited_files: Vec::new(), source_file: db_path.to_string_lossy().to_string(),
        });
    }
}

pub fn scan_external_agent_sessions(claude_dir: &str, codex_dir: &str, antigravity_dir: &str, max_per_provider: usize) -> ExternalAgentReport {
    let cap = max_per_provider.clamp(1, 20);
    let mut sessions = Vec::new();
    let mut captured_commands = Vec::new();
    scan_claude_projects(claude_dir, cap, &mut sessions, &mut captured_commands);
    scan_codex_sessions(codex_dir, cap, &mut sessions, &mut captured_commands);
    scan_antigravity_state(antigravity_dir, cap, &mut sessions);
    sessions.sort_by(|a, b| b.updated_at_ms.cmp(&a.updated_at_ms));

    let mut md = String::from("### External Agent UI & CLI Activity Snapshot\n");
    if sessions.is_empty() {
        md.push_str("- No active external Claude, Codex, or Antigravity sessions detected on disk.\n");
    } else {
        for s in sessions.iter().take(8) {
            md.push_str(&format!("- **[{}] {}** (`{}`) — cwd: `{}`", s.provider.to_uppercase(), s.title, if s.model.is_empty() { &s.originator } else { &s.model }, if s.cwd.is_empty() { "unknown" } else { &s.cwd }));
            if !s.recent_commands.is_empty() {
                md.push_str(&format!(" · cmds: `{}`", s.recent_commands.iter().take(2).cloned().collect::<Vec<_>>().join("`; `")));
            }
            md.push('\n');
        }
    }
    let now_ms = std::time::SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0);
    ExternalAgentReport { scanned_at_ms: now_ms, sessions, captured_commands, father_context_markdown: md }
}
