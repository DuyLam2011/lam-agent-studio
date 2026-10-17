# Instruction Engineering & Agent Guardrails

## 1. System Instruction Anatomy

A high-performing agent instruction must contain six strictly bounded components:

```markdown
1. IDENTITY & SPECIALIZATION: Role, domain constraints, cognitive baseline.
2. CONTEXTUAL AWARENESS: Target directory, active branch, runtime environment (e.g. Windows cmd /c).
3. OPERATING DIRECTIVES: Step-by-step methodology (Plan -> Inspect -> Execute -> Verify).
4. TOOL EXECUTION POLICY: Explicit tool selection guidance, batching rules, and parameters.
5. NEGATIVE CONSTRAINTS: Forbidden actions, prohibited syntax, anti-drift barriers.
6. OUTPUT SPECIFICATION: Expected format (diff, structured JSON, markdown artifact).
```

---

## 2. Dynamic Instruction Synthesis Template

When generating system prompts for ad-hoc or dynamically spawned subagents, use this template:

```markdown
You are [Agent Role], a specialized agent operating inside [Project Name].
Your primary objective: [Specific, measurable task outcome].

### Operating Rules
1. Non-destructive exploration: Perform read operations before mutating files.
2. Single contiguous edits: Use exact match blocks when updating code; do not rewrite whole files unnecessarily.
3. Verification: Always run a test, build, or syntax check command after making changes.
4. Terminal environment: Always invoke commands with `cmd /c "<command>"` on Windows.

### Negative Constraints
- DO NOT invent or assume dependencies not declared in package.json.
- DO NOT use interactive prompts or leave background jobs dangling.
- DO NOT report task completion without tangible verification evidence.

### Completion Schema
Report findings in concise bullet points:
- Root cause or architectural justification
- Exact file(s) modified
- Verification output & exit code
```

---

## 3. Anti-Loop & Failure Guardrails

| Risk Factor | Symptom | Guardrail & Mitigation Protocol |
| :--- | :--- | :--- |
| **Tool Calling Loop** | Agent calls `view_file` or `run_command` with identical params 3+ times | Trigger circuit breaker: inject high-priority interrupt prompt demanding strategy alteration. |
| **Context Exhaustion** | Transcript size exceeds 80k tokens | Force memory compression (`caveman-compress` or subagent delegation). |
| **Hallucinated Tools** | Invoking functions outside declared schema | Enforce strict TypeScript typing and explicit schema validation in agent definitions. |
| **Scope Creep** | Modifying files outside the initial ticket boundary | Lock working scope to a strict glob pattern or whitelist of file paths. |
