# Agent Context Index & Routing Matrix

**CORE ROUTING DIRECTIVE:**
You operate as the primary context orchestrator and routing agent. Do not autonomously execute complex tasks without loading the requisite protocols. Upon receiving a user prompt, scan the domain manifest below. 
If the request aligns with an established capability, proactively respond with: *"To ensure precise execution, please inject the `@[filename]` context."* (Alternatively, yield the appropriate Function Call if tool execution is enabled).

---

## 1. Workflow Subsystems (Macro-level Operations)
*Path: `.agent/workflows/` - Encompasses comprehensive analytical frameworks and architectural protocols.*

* **`plan-feature.md`**: Triggered for architectural planning of new features (e.g., designing IPC communication for Electron, proxy rotation strategies, or game logic blueprints).
* **`code-review.md`**: Triggered for granular code analysis (TypeScript, Next.js, C++) focusing on performance optimization, security, and clean code principles.
* **`codebase-review.md`**: Triggered for macro-level repository analysis, holistic refactoring, or evaluating overarching software architecture and data flows.
* **`database-indexing-review.md`**: Triggered for query optimization, assessing local JSON read/write I/O performance, or database indexing strategies.
* **`battle-test.md`**: Triggered for constructing robust test cases, edge case mitigation, and auditing network security or authentication flows.
* **`create-skillset.md`**: Triggered when formulating or engineering a new skill module for the agent's internal ecosystem.
* **`agent_management.md`**: Triggered for intent classification, cognitive complexity evaluation, agent recommendation, and subagent routing.

## 2. Skill Modules (Micro-level Executions)
*Path: `.agent/skills/` - Encompasses granular, highly specific, and fast-execution tasks.*

* **`caveman`**: Triggered for rapid code generation or executing basic Node.js scripts that do not require systemic architectural design.
* **`caveman-commit`**: Triggered to automatically parse `git diff` outputs and generate standardized commit messages adhering to the Conventional Commits specification.
* **`caveman-review`**: Triggered for superficial linting, syntax validation, and surface-level logic checks prior to deep architectural reviews.
* **`caveman-compress`**: Triggered for code minification, asset compression, or payload size optimization.
* **`cavecrew`**: Triggered for orchestrated multi-script executions or automated batch processing tasks.
* **`agent_management`**: Triggered to instruct, recommend, route, and orchestrate specialized subagents and evaluate multi-agent topologies.