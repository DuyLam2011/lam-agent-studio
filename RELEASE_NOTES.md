# Release Notes: L.A.M Agent Studio

## [v1.1.0] - 2026-11-18

### 🚀 New Features
- **Live Animated Reasoning Indicator (`AgentThinkingIndicator`)**: Real-time pulsing glow, dynamic execution phase badges (`🧠 Synthesizing`, `⚡ Executing tool`, `📋 Orchestrating Subagent DAG`), and wave ripple animations prevent frozen UI state during complex inference.
- **Unified Global Agents Center Header Trigger**: Direct `<Bot />` action in primary window controls bar alongside Harness and Setting Center for frictionless governance across Rules, Skills, Workflows, MCP & Personas.
- **Interactive Multi-Scope Toggle Switches**: Enabled direct active/inactive toggling for workspace and repository-scoped rules, skills, and subagents without static lock restrictions.
- **Provider-Aware Auto Smart Router**: Dynamic model routing fallback automatically resolves optimal frontier models for each provider (Gemini, Codex, Anthropic, Antigravity) with persistent state synchronization in `settings.json`.
- **Professional GitHub Actions CI/CD Release Pipeline**: Automated Windows NSIS, Portable, and Zip multi-target releases with SHA256 checksums and automated changelog generation on tag push (`v*`).

### ⚡ Improvements
- **Subagent Supervisor Engine Optimization**: Eliminated forced second-iteration penalty for Task Planner and Code Executor personas by checking actionable deliverables rather than code review verdicts, slashing sequential LLM round-trips by up to 60%.
- **Vite Vendor Bundle Modularization**: Isolated large libraries (`@xterm`, `@monaco-editor`, `lucide-react`, `react-markdown`, `react/react-dom`) into dedicated vendor chunks via function-based Rollup chunking, removing circular dependency warnings and improving cold start latency.
- **Context Isolation & Filter Invariant**: Updated `getActiveRulesForContext`, `getActiveSkillsForContext`, `getActiveWorkflowsForContext`, and `getActiveSubagentsForContext` to strictly check `active !== false` on workspace and repo items.

### 🐛 Bug Fixes
- **Repo Skill Reset Bug**: Fixed `scanAllWorkspaceSkills()` overwriting user-configured `active: false` toggles back to `true` on modal open.
- **API Key Persistence**: Wired API Key "Save" button in Setting Center to invoke `settingsAPI.saveSettings({ customApiKey })`.
- **Chat Header Toolbar Declutter**: Removed duplicate Bot modal trigger from chat header, avoiding modal trigger collisions.

### 🏗️ Infrastructure & Maintenance
- Added release scripts (`pack:win`, `pack:portable`, `pack:dir`, `version:patch`, `version:minor`, `version:major`) in `package.json`.
- Cleaned up unused Lucide imports across `RuleCard.tsx`, `SkillCard.tsx`, and `SubagentCard.tsx`.
- Guaranteed 100% adherence to Rule 4 ( $\le 150$ lines per `.ts`/`.tsx` file).
