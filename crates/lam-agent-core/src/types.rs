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

#[napi(object)]
pub struct NativeSearchMatch {
    pub file_path: String,
    pub line_number: u32,
    pub line_content: String,
}

#[napi(object)]
pub struct NativeSearchResult {
    pub matches: Vec<NativeSearchMatch>,
    pub files_scanned: u32,
    pub truncated: bool,
    pub duration_ms: f64,
}

#[napi(object)]
pub struct NativeCodeModeDistillResult {
    pub distilled_output: String,
    pub raw_bytes: u32,
    pub distilled_bytes: u32,
    pub estimated_tokens_saved: u32,
    pub lines_original: u32,
    pub lines_retained: u32,
    pub duration_ms: f64,
}
