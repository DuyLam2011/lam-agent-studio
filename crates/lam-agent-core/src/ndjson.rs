use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamEvent {
    pub event_type: String, // "chunk" | "tool_call" | "tool_result" | "reasoning" | "done"
    pub content: String,
    pub raw: Option<String>,
}

pub fn strip_ansi(input: &str) -> String {
    let re = Regex::new(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])").unwrap();
    re.replace_all(input, "").to_string()
}

pub fn parse_ndjson_lines(buffer: &str) -> (Vec<StreamEvent>, String) {
    let clean = strip_ansi(buffer);
    let mut events = Vec::new();
    let mut leftover = String::new();

    let lines: Vec<&str> = clean.split('\n').collect();
    let total = lines.len();

    for (idx, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        // If this is the last line and does not end with newline in input
        if idx == total - 1 && !buffer.ends_with('\n') {
            leftover = line.to_string();
            break;
        }

        if let Ok(v) = serde_json::from_str::<serde_json::Value>(trimmed) {
            let event_type = v.get("type")
                .and_then(|t| t.as_str())
                .unwrap_or("chunk")
                .to_string();

            let content = v.get("content")
                .or_else(|| v.get("text"))
                .or_else(|| v.get("delta"))
                .and_then(|c| c.as_str())
                .unwrap_or("")
                .to_string();

            events.push(StreamEvent {
                event_type,
                content,
                raw: Some(trimmed.to_string()),
            });
        } else {
            // Raw text line fallback
            events.push(StreamEvent {
                event_type: "chunk".to_string(),
                content: trimmed.to_string(),
                raw: None,
            });
        }
    }

    (events, leftover)
}

pub fn estimate_tokens_fast(text: &str) -> u32 {
    let char_len = text.chars().count();
    let words = text.split_whitespace().count();
    // High-speed heuristic: ~4 chars per token average in English/code, ~1.3 tokens per word
    let by_chars = (char_len as f64 / 3.8).ceil() as u32;
    let by_words = (words as f64 * 1.3).ceil() as u32;
    by_chars.max(by_words).max(1)
}
