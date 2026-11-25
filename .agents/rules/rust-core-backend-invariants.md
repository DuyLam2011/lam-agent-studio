# Ruleset: Rust-First Core Backend Architecture & Invariants

## 1. Core Architectural Boundary & Mandate
- **Mandatory Rust for Core Backend:** All compute-heavy, algorithmic, data-intensive, or latency-critical backend features MUST be written in Rust within `crates/lam-agent-core` (or dedicated native Rust crates).
- **TypeScript Role:** TypeScript in Node/Electron acts strictly as a thin coordinator:
  - Managing Electron window lifecycles and frameless window IPC.
  - Routing tool calls and IPC events between Renderer and Main process.
  - Communicating with external HTTP APIs, WebSocket servers, and LLM providers.
  - Rendering UI components and state management with Zustand.
- **Prohibition on Pure TS Heavy Algorithms:** NEVER implement CPU-intensive algorithms (e.g. Ripgrep-grade file search, multi-file AST parsing, multi-pass patch reconciliation, context distillation, token approximations) in pure TypeScript when native Rust bindings exist or can be authored.

---

## 2. Division of Responsibilities Matrix

| Capability Domain | Rust Native Engine (`crates/lam-agent-core`) | TypeScript Orchestration (`electron/` & `src/`) |
| :--- | :--- | :--- |
| **Workspace Search** | Parallel multi-threaded file search (`search.rs`, ~20ms across 500+ files) | Tool wrapper in `searchWorkspace.ts` & UI display |
| **Surgical Patching** | Multi-pass exact/trimmed surgical string replacement (`patch.rs`) | Security harness check (`ToolFileMutator.ts`) |
| **AST & Symbol Extraction** | Parallel source scanning & AST symbol identification (`ast.rs`) | Graphify graph storage & edge tracking |
| **Code Mode Distillation** | Sub-millisecond log distillation & noise compression (`codemode.rs`, ~0.08ms) | VM sandbox execution (`CodeModeService.ts`) |
| **Token Estimation** | Fast native token count approximation | Prompt budget visualization & warning badges |
| **Cryptographic & Hash** | Native SHA256 / Blake3 / CRC verification | Cache keys & storage metadata |

---

## 3. Workflow for Adding New Core Backend Capabilities

When implementing any new core backend feature or algorithmic logic:
1. **Rust Implementation:** Create or expand the Rust module in `crates/lam-agent-core/src/<module>.rs`.
2. **N-API Export:** Decorate exported functions with `#[napi]` and expose in `crates/lam-agent-core/src/lib.rs`.
3. **Compilation Check:** Compile and verify native bindings (`crates/lam-agent-core/lam_agent_core.node`) ensuring zero compiler warnings.
4. **TypeScript Bridge:** Wire the new native functions into `electron/services/NativeEngineBridge.ts` with strict TypeScript typings.
5. **Modularity Invariant:** Maintain Rule 4 compliance (<150 lines per file) for all TypeScript bridge and tool wrapper files.
