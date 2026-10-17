# AI Agent Management Skill (`agent_management`)

A comprehensive, industry-grade agent orchestration and routing system designed for autonomous development environments.

## Architecture & Subsystems

```
.agents/skills/agent_management/
├── SKILL.md                          # Primary skill definition & routing contract (< 500 words)
├── README.md                         # Documentation & usage examples
├── scripts/
│   └── agent_router.js               # CLI & programmatic semantic intent router & model recommender
└── references/
    ├── routing_matrix.md             # Cognitive complexity tiers (T0-T5) & model dispatch table
    ├── instruction_framework.md      # 6-point bounded system prompt engineering & anti-loop guardrails
    └── orchestration_patterns.md     # Topologies (Router-Dispatcher, Supervisor-Worker, Generator-Critic)
```

## Features

1. **Cognitive Intent Classification**:
   - Evaluates prompts across tiers `T0` (direct lookup) to `T5` (critical security audit).
   - Dynamically maps tasks to optimal models (`flash_lite`, `flash`, `pro`) to minimize latency and token expenditure.

2. **Automated Subagent Router (`agent_router.js`)**:
   - Zero-dependency Node.js evaluation engine.
   - Calculates agent affinity scores, match confidence, and produces ready-to-dispatch `invoke_subagent` JSON payloads.

3. **Multi-Agent Topologies**:
   - **Router-Dispatcher**: Fast single-agent dispatch.
   - **Supervisor-Worker**: Coordinated multi-agent task DAG with reactive asynchronous wakeups.
   - **Generator-Critic**: Dual-agent review loops with zero hallucination tolerance.

4. **Instruction Architecture & Guardrails**:
   - 6-part bounded prompt structure.
   - Loop detection, token exhaustion circuit breakers, and deterministic fallback procedures.

## Quick CLI Usage

To evaluate and route any task description:
```cmd
cmd /c "`"C:\Program Files\Git\bin\bash.exe`" -l -c `"node .agents/skills/agent_management/scripts/agent_router.js 'Your prompt here'`""
```

For JSON output:
```cmd
cmd /c "`"C:\Program Files\Git\bin\bash.exe`" -l -c `"node .agents/skills/agent_management/scripts/agent_router.js --json 'Your prompt here'`""
```
