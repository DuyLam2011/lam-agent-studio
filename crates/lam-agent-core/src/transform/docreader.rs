use napi_derive::napi;
use regex::Regex;

#[napi(object)]
pub struct NativeCleanDocResult {
    pub markdown: String,
    pub title: String,
    pub estimated_tokens: u32,
    pub matched_sections_count: u32,
}

#[napi]
pub fn clean_html_to_markdown_native(
    html: String,
    query: Option<String>,
) -> NativeCleanDocResult {
    let title = Regex::new(r"(?i)<title[^>]*>([^<]*)</title>")
        .ok()
        .and_then(|re| re.captures(&html))
        .and_then(|caps| caps.get(1))
        .map(|m| m.as_str().trim().to_string())
        .unwrap_or_else(|| "Untitled Document".to_string());

    // 1. Strip heavy non-content tags
    let mut clean = html;
    let strip_patterns = [
        r"(?is)<script\b[^<]*(?:(?!</script>)<[^<]*)*</script>",
        r"(?is)<style\b[^<]*(?:(?!</style>)<[^<]*)*</style>",
        r"(?is)<svg\b[^<]*(?:(?!</svg>)<[^<]*)*</svg>",
        r"(?is)<(?:header|footer|nav|aside|iframe)\b[^<]*(?:(?!</\1>)<[^<]*)*</\1>",
    ];

    for pat in &strip_patterns {
        if let Ok(re) = Regex::new(pat) {
            clean = re.replace_all(&clean, "").to_string();
        }
    }

    // 2. Convert code blocks & headings
    if let Ok(re) = Regex::new(r"(?is)<pre[^>]*><code[^>]*>(.*?)</code></pre>") {
        clean = re.replace_all(&clean, "\n```\n$1\n```\n").to_string();
    }
    if let Ok(re) = Regex::new(r"(?is)<code[^>]*>(.*?)</code>") {
        clean = re.replace_all(&clean, "`$1`").to_string();
    }
    for i in 1..=6 {
        let tag = format!(r"(?is)<h{i}[^>]*>(.*?)</h{i}>");
        if let Ok(re) = Regex::new(&tag) {
            let hashes = "#".repeat(i);
            clean = re.replace_all(&clean, format!("\n{} $1\n", hashes)).to_string();
        }
    }
    if let Ok(re) = Regex::new(r"(?is)<li[^>]*>(.*?)</li>") {
        clean = re.replace_all(&clean, "\n- $1").to_string();
    }
    if let Ok(re) = Regex::new(r#"(?is)<a\b[^>]*href=["']([^"']*)["'][^>]*>(.*?)</a>"#) {
        clean = re.replace_all(&clean, "[$2]($1)").to_string();
    }
    if let Ok(re) = Regex::new(r"(?is)<p[^>]*>(.*?)</p>") {
        clean = re.replace_all(&clean, "\n\n$1\n\n").to_string();
    }

    // 3. Strip remaining tags
    if let Ok(re) = Regex::new(r"<[^>]+>") {
        clean = re.replace_all(&clean, " ").to_string();
    }

    // 4. Decode common HTML entities
    clean = clean
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'");

    // 5. Collapse excessive whitespace
    if let Ok(re) = Regex::new(r"[ \t]+") {
        clean = re.replace_all(&clean, " ").to_string();
    }
    if let Ok(re) = Regex::new(r"\n{3,}") {
        clean = re.replace_all(&clean, "\n\n").to_string();
    }
    clean = clean.trim().to_string();

    // 6. Query filtering if requested
    let mut matched_sections_count = 0;
    if let Some(ref q) = query {
        let q_clean = q.trim().to_lowercase();
        if !q_clean.is_empty() {
            let blocks: Vec<&str> = clean.split("\n\n").collect();
            let matched_blocks: Vec<&str> = blocks
                .iter()
                .filter(|b| b.to_lowercase().contains(&q_clean))
                .copied()
                .collect();

            matched_sections_count = matched_blocks.len() as u32;
            if matched_sections_count > 0 {
                clean = matched_blocks.join("\n\n");
            } else {
                clean = format!(
                    "[Query \"{}\" not found in document. Initial overview preview:]\n\n{}",
                    q,
                    blocks.iter().take(3).copied().collect::<Vec<&str>>().join("\n\n")
                );
            }
        }
    }

    let estimated_tokens = (clean.len() / 4) as u32;

    NativeCleanDocResult {
        markdown: clean,
        title,
        estimated_tokens,
        matched_sections_count,
    }
}
