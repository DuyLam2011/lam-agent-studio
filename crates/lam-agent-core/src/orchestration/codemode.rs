use regex::Regex;
use serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeModeDistillResult {
    pub distilled_output: String,
    pub raw_bytes: usize,
    pub distilled_bytes: usize,
    pub estimated_tokens_saved: u32,
    pub lines_original: usize,
    pub lines_retained: usize,
    pub duration_ms: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeModeMetric {
    pub scripts_executed: u32,
    pub total_raw_bytes: usize,
    pub total_distilled_bytes: usize,
    pub total_tokens_saved: u32,
}

pub fn distill_output(
    raw_text: &str,
    max_lines: usize,
    filter_pattern: Option<&str>,
) -> CodeModeDistillResult {
    let start = Instant::now();
    let raw_bytes = raw_text.len();
    let lines: Vec<&str> = raw_text.lines().collect();
    let lines_original = lines.len();

    // 1. Optional regex line filtering
    let filtered_lines: Vec<&str> = if let Some(pat) = filter_pattern {
        if !pat.trim().is_empty() {
            if let Ok(re) = Regex::new(pat) {
                lines.into_iter().filter(|l| re.is_match(l)).collect()
            } else {
                lines
            }
        } else {
            lines
        }
    } else {
        lines
    };

    let total_filtered = filtered_lines.len();
    let effective_max = if max_lines == 0 { 60 } else { max_lines };

    // 2. Head-tail window compaction if lines exceed max_lines
    let distilled_output = if total_filtered <= effective_max {
        filtered_lines.join("\n")
    } else {
        let head_count = effective_max / 2;
        let tail_count = effective_max - head_count;
        let omitted = total_filtered - head_count - tail_count;

        let mut parts = Vec::new();
        parts.extend_from_slice(&filtered_lines[..head_count]);
        let omission_notice = format!(
            "... [⚡ Code Mode: {} noisy lines filtered locally to conserve context tokens] ...",
            omitted
        );
        parts.push(&omission_notice);
        parts.extend_from_slice(&filtered_lines[total_filtered - tail_count..]);
        parts.join("\n")
    };

    let distilled_bytes = distilled_output.len();
    let bytes_saved = if raw_bytes > distilled_bytes {
        raw_bytes - distilled_bytes
    } else {
        0
    };
    let estimated_tokens_saved = (bytes_saved as f64 / 3.8).ceil() as u32;
    let lines_retained = distilled_output.lines().count();
    let duration_ms = start.elapsed().as_secs_f64() * 1000.0;

    CodeModeDistillResult {
        distilled_output,
        raw_bytes,
        distilled_bytes,
        estimated_tokens_saved,
        lines_original,
        lines_retained,
        duration_ms,
    }
}

pub fn format_code_mode_envelope(
    action_name: &str,
    status: &str,
    distilled_data: &str,
    tokens_saved: u32,
    elapsed_ms: f64,
) -> String {
    format!(
        "[⚡ Code Mode: {} | Status: {} | Saved ~{} tokens | Executed in {:.1}ms]\n{}",
        action_name, status, tokens_saved, elapsed_ms, distilled_data
    )
}
