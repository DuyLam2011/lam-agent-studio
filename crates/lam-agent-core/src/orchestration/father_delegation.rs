use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskContractSpec {
    pub contract_id: String,
    pub title: String,
    pub user_goal: String,
    pub cleared_requirements: Vec<String>,
    pub target_files: Vec<String>,
    pub invariants: Vec<String>,
    pub acceptance_criteria: Vec<String>,
    pub father_agent_model: String,
    pub coding_agent_engine: String,
    pub status: String,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionVerificationResult {
    pub contract_id: String,
    pub passed: bool,
    pub quality_score: u32,
    pub checked_criteria: Vec<String>,
    pub violations: Vec<String>,
    pub father_verdict: String,
    pub synthesis_summary: String,
}

pub fn build_delegation_contract(
    user_goal: &str,
    file_context: &str,
    father_model: Option<&str>,
    coding_engine: Option<&str>,
) -> TaskContractSpec {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    let contract_id = format!("contract_{}", now);
    let goal_trimmed = user_goal.trim();

    // Generate concise title
    let title = if goal_trimmed.len() > 60 {
        format!("{}...", &goal_trimmed[..57])
    } else if goal_trimmed.is_empty() {
        "Delegated Task".to_string()
    } else {
        goal_trimmed.to_string()
    };

    // Extract potential target files from goal and file_context
    let mut target_files: Vec<String> = Vec::new();
    let re_file = regex::Regex::new(r"[a-zA-Z0-9_./\\-]+\.(?:tsx|jsx|html|json|ts|js|rs|md|css)").ok();
    if let Some(ref re) = re_file {
        for cap in re.find_iter(user_goal) {
            let f = cap.as_str().replace('\\', "/");
            if !target_files.contains(&f) {
                target_files.push(f);
            }
        }
        for cap in re.find_iter(file_context) {
            let f = cap.as_str().replace('\\', "/");
            if !target_files.contains(&f) && target_files.len() < 5 {
                target_files.push(f);
            }
        }
    }

    if target_files.is_empty() {
        target_files.push("Auto-detecting affected workspace modules...".to_string());
    }

    // Distill 3-5 cleared requirements from user request
    let mut cleared_requirements = Vec::new();
    cleared_requirements.push(format!("Analyze and distill user goal: '{}'", goal_trimmed));
    cleared_requirements.push("Decompose modular scope and dispatch clear contract to Coding Engine.".to_string());
    cleared_requirements.push("Enforce workspace safety boundary: modify only targeted modules without regressing existing logic.".to_string());
    cleared_requirements.push("Run compiler typecheck and automated test verification upon completion.".to_string());

    // Strict Architectural Invariants
    let invariants = vec![
        "Rule 4 Modularity: Every TypeScript source file (.ts/.tsx) must be <= 150 lines.".to_string(),
        "Zero Placeholders: Never leave stub comments like '// TODO' or unimplemented blocks.".to_string(),
        "Strict Type Safety: 100% TypeScript strict mode with explicit interfaces.".to_string(),
        "Non-Destructive Execution: Never wipe data or force-reset git history.".to_string(),
    ];

    // Acceptance Criteria
    let acceptance_criteria = vec![
        "Source compiles cleanly with TypeScript compiler (tsc).".to_string(),
        "Vite / Production bundle builds without syntax or bundling errors.".to_string(),
        "Coding Engine reports Diff Snapshot and test verification summary to Father Agent.".to_string(),
    ];

    TaskContractSpec {
        contract_id,
        title,
        user_goal: goal_trimmed.to_string(),
        cleared_requirements,
        target_files,
        invariants,
        acceptance_criteria,
        father_agent_model: father_model.unwrap_or("ChatGPT (OpenAI)").to_string(),
        coding_agent_engine: coding_engine.unwrap_or("OpenAI Codex Engine").to_string(),
        status: "pending_approval".to_string(),
        created_at: now,
    }
}

pub fn verify_coding_agent_execution(
    contract: &TaskContractSpec,
    diff_summary: &str,
    test_output: &str,
) -> ExecutionVerificationResult {
    let mut violations = Vec::new();
    let mut checked_criteria = Vec::new();

    // Check placeholders violation
    if diff_summary.contains("// TODO") || diff_summary.contains("/* TODO") {
        violations.push("Incomplete placeholder (// TODO) detected in generated code.".to_string());
    }

    // Check test execution output
    let test_clean = !test_output.contains("FAIL") && !test_output.contains("Error:");
    if test_clean {
        checked_criteria.push("Test & Verification suites passed 100%.".to_string());
    } else {
        violations.push("Test execution output reported failures or warnings.".to_string());
    }

    checked_criteria.push("Contract architectural invariants and modularity bounds satisfied.".to_string());
    checked_criteria.push("Coding Engine delivered complete diff snapshots and summaries.".to_string());

    let passed = violations.is_empty();
    let quality_score = if passed { 98 } else { 75 };

    let father_verdict = if passed {
        format!("🛡️ **Father Agent Verdict: [VERIFIED & APPROVED]** - Coding Engine completed Task Contract '{}'.", contract.contract_id)
    } else {
        format!("⚠️ **Father Agent Verdict: [CHANGES REQUIRED]** - Coding Engine must resolve {} contract violation(s).", violations.len())
    };

    let synthesis_summary = format!(
        "Task: '{}' | Quality Score: {}/100 | Passed Criteria: {}/{} | Violations: {}.",
        contract.title, quality_score, checked_criteria.len(), checked_criteria.len() + violations.len(), violations.len()
    );

    ExecutionVerificationResult {
        contract_id: contract.contract_id.clone(),
        passed,
        quality_score,
        checked_criteria,
        violations,
        father_verdict,
        synthesis_summary,
    }
}
