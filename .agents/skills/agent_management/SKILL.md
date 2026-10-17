---
name: agent_management
description: Architect, instruct, evaluate, recommend, and route AI agents and subagent topologies using state-of-the-art orchestration patterns (supervisor-worker, semantic routing, guardrails, context budgeting). Trigger: "manage agents", "route query", "orchestrate agents", "design agent", "agent router", "recommend agent", or /agent_management.
---

# AI Agent Management & Orchestration

Use this skill to evaluate complex prompts, determine optimal agent topologies, synthesize robust system instructions, and route work across specialized subagents with strict token and latency budgets.

## Inputs
* **Target Objective / Query**: The user's goal or multi-layered task description.
* **Constraints (Optional)**: Latency limits, token budget, isolated workspace requirements, model preferences.

---

## Operational Workflow

### Phase 1: Intent Evaluation & Semantic Routing
1. **Classify Intent & Complexity Tier (T0 - T5)**:
   - For T0-T1 (targeted edits/lookups): Keep single-turn or assign to lightweight subagents (`flash`).
   - For T2-T3 (deep research/architecture): Delegate to isolated subagent (`flash` or `pro`).
   - For T4-T5 (sweeping refactors/security audits): Orchestrate a Supervisor-Worker topology (`pro` supervisor).
2. **Execute Router Script (Optional automated scoring)**:
   ```cmd
   cmd /c "`"C:\Program Files\Git\bin\bash.exe`" -l -c `"node .agents/skills/agent_management/scripts/agent_router.js '<QUERY>'`""
   ```
   *(Refer to [routing_matrix.md](./references/routing_matrix.md) for full taxonomy).*

### Phase 2: Topology Selection & Agent Recommendation
Select the optimal orchestration architecture:
* **Router-Dispatcher**: Fast 1:1 matching to a single domain expert.
* **Supervisor-Worker**: Supervisor decomposes tasks into an ordered DAG, spawns subagents concurrently via `invoke_subagent`, and waits for reactive wakeups (NO polling).
* **Generator-Critic**: Dual-agent loop for security audits and high-risk refactors.
*(Refer to [orchestration_patterns.md](./references/orchestration_patterns.md)).*

### Phase 3: Instruction Synthesis & Guardrail Enforcement
Synthesize system instructions for the selected agent(s) adhering to the 6-point bounded structure:
1. Role identity & domain specialization.
2. Contextual environment awareness (`cmd /c` execution on Windows).
3. Explicit operating sequence (Inspect -> Plan -> Mutate -> Verify).
4. Tool guidance & batch limits.
5. Strict negative constraints (anti-hallucination, no unverified completions, no dangling processes).
6. Target output schema.
*(Refer to [instruction_framework.md](./references/instruction_framework.md)).*

### Phase 4: Subagent Dispatch & Lifecycle Management
1. Spawn worker agents using `invoke_subagent` with the synthesized role, model, and prompt.
2. Maintain context hygiene: Pass distilled findings, file paths, and diff ranges—never pipe giant raw log dumps.
3. Manage running agents using `manage_subagents` (`list`, `kill`, `kill_all`).

### Phase 5: Verification & Synthesis
1. Execute tangible verification (compile check, unit tests, or lint).
2. Deliver consolidated summary with GitHub-style file links and actionable next steps.

---

## Safety & Operational Guardrails
* **No Loop Deadlocks**: Never poll running subagents in a manual loop; Antigravity handles reactive wakeup.
* **Tool Calling Limits**: Terminate subagent execution if identical tool calls repeat 3+ times without progress.
* **Deterministic Fallback**: If routing confidence is below 0.65, prompt the user for clarification with `ask_question`.
