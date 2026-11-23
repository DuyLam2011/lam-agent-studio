use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatchResult {
    pub updated_content: String,
    pub lines_added: usize,
    pub lines_removed: usize,
    pub match_type: String,
}

pub fn apply_surgical_edit(
    original: &str,
    target: &str,
    replacement: &str,
) -> Result<PatchResult, String> {
    let is_crlf = original.contains("\r\n");
    let newline = if is_crlf { "\r\n" } else { "\n" };

    // 1. Exact match attempt
    if let Some(first_idx) = original.find(target) {
        if original[first_idx + target.len()..].contains(target) {
            return Err("Target content matches multiple locations. Provide more surrounding context lines.".to_string());
        }
        let updated = format!(
            "{}{}{}",
            &original[..first_idx],
            replacement,
            &original[first_idx + target.len()..]
        );
        let lines_added = if replacement.is_empty() { 0 } else { replacement.split('\n').count() };
        let lines_removed = if target.is_empty() { 0 } else { target.split('\n').count() };

        return Ok(PatchResult {
            updated_content: updated,
            lines_added,
            lines_removed,
            match_type: "exact".to_string(),
        });
    }

    // 2. Line-ending & trailing-whitespace normalized match
    let norm_orig = original.replace("\r\n", "\n");
    let norm_target = target.replace("\r\n", "\n");
    let norm_replacement = replacement.replace("\r\n", newline);

    let orig_lines: Vec<&str> = norm_orig.split('\n').collect();
    let target_lines: Vec<&str> = norm_target.split('\n').map(|l| l.trim_end()).collect();

    if target_lines.is_empty() || orig_lines.len() < target_lines.len() {
        return Err("Target content not found in file. Ensure indentation and exact code match.".to_string());
    }

    let mut match_line_idx: Option<usize> = None;
    let mut match_count = 0;

    for i in 0..=(orig_lines.len() - target_lines.len()) {
        let mut matched = true;
        for (j, target_line) in target_lines.iter().enumerate() {
            if orig_lines[i + j].trim_end() != *target_line {
                matched = false;
                break;
            }
        }
        if matched {
            match_count += 1;
            match_line_idx = Some(i);
        }
    }

    match match_count {
        0 => Err("Target content not found in file. Ensure indentation and exact code match.".to_string()),
        1 => {
            let idx = match_line_idx.unwrap();
            let before_lines = &orig_lines[..idx];
            let after_lines = &orig_lines[idx + target_lines.len()..];

            let mut result_lines = Vec::new();
            result_lines.extend_from_slice(before_lines);
            if !norm_replacement.is_empty() {
                result_lines.push(norm_replacement.as_str());
            }
            result_lines.extend_from_slice(after_lines);

            let updated = result_lines.join(newline);
            let lines_added = if norm_replacement.is_empty() { 0 } else { norm_replacement.split('\n').count() };

            Ok(PatchResult {
                updated_content: updated,
                lines_added,
                lines_removed: target_lines.len(),
                match_type: "normalized-whitespace".to_string(),
            })
        }
        _ => Err(format!(
            "Ambiguous match: Target content found {} times. Provide unique lines.",
            match_count
        )),
    }
}
