# L.A.M Agent Studio - Architecture Specification

## Overview

L.A.M Agent Studio is an advanced, standalone Agent-First IDE built on Electron. It operates independently to manage complex LLM workflows, contextual rules, and dynamic skills natively.

## Tech Stack

*   **Core Desktop Framework**: Electron
*   **Build Tool**: Vite (using `vite-plugin-electron` and `vite-plugin-electron-renderer`)
*   **Frontend Framework**: React 18
*   **Language**: TypeScript (Strict Mode)
*   **State Management**: Zustand
*   **Styling**: TailwindCSS, Lucide-React for icons, clsx & tailwind-merge for class manipulation.
*   **Code Editor**: Monaco Editor (`@monaco-editor/react`)
*   **Version Control**: `simple-git` for managing git operations.

## Architecture & Layers

The application follows a strict Main/Renderer split, enforcing high security through context isolation.

### 1. Main Process (`electron/main.ts`)

*   **Responsibilities**:
    *   Creates and manages the main `BrowserWindow`.
    *   Handles all OS-level interactions, file system (`fs`) access, and process execution.
    *   Runs the local WebSocket server (`ws`) to communicate with external agents/extensions.
    *   Executes Git commands via `simple-git`.
    *   Handles OAuth Deep Linking (`lam-studio://`).
*   **Security**: The Renderer process is completely sandboxed. It cannot access `fs`, `child_process`, or `os` modules. All communication happens strictly via Inter-Process Communication (IPC).

### 2. Preload Script (`electron/preload.ts`)

*   **Responsibilities**:
    *   Exposes a deeply typed, restricted API to the Renderer via `contextBridge`.
    *   API Object: `window.lamApi`
    *   Bridges `ipcRenderer.invoke` calls to `ipcMain.handle` handlers.

### 3. Renderer Process (`src/`)

*   **Responsibilities**:
    *   Renders the UI using React.
    *   Consumes the `window.lamApi` provided by the preload script.
    *   Manages the global state using Zustand (`src/store/useAgentStore.ts`).

#### Component Breakdown (`src/components/`)

*   **`App.tsx`**: The root layout wrapper handling sidebar resizing and panel orchestration.
*   **`FileTree.tsx` / `WorkspaceItem.tsx`**: Renders the recursive file explorer and tracks folder expansion states.
*   **`Editor.tsx`**: Wraps the Monaco Editor, supporting multi-tabs (preview vs persistent tabs) and inline diffing.
*   **`GitPanel.tsx`**: The integrated source control panel, supporting fetching, pulling (with branch selector dropdowns), pushing, committing, and viewing staged/unstaged files.
*   **`SearchPanel.tsx`**: A dedicated global search and replace interface (the "Agent Track Down" feature).
*   **`GlobalContextMenu.tsx`**: A custom, portal-based absolute positioned menu replacing native right-click menus, tailored for files, folders, workspaces, and git repos.
*   **`AccountCenterModal.tsx` & `CloneRepositoryModal.tsx`**: Modals for GitHub OAuth integration and cloning repositories natively into workspaces.
*   **`ToastContainer.tsx`**: The global notification system replacing all native `alert()`/`prompt()` calls.

## State Management (Zustand)

The entire application relies heavily on `src/store/useAgentStore.ts` to avoid prop-drilling.

**Core State Entities:**
*   `systemContext`: The active workspace definitions (`cwd`, active workspaces, folder structures).
*   `openTabs` & `activeTabIndex`: Manages the VSCode-style multi-tab editor system (supporting ephemeral *preview* tabs).
*   `activeFile`: The currently active file loaded in Monaco.
*   `gitStatuses`: Global map of file paths to their git status (`M`, `A`, `D`, `U`).
*   `contextMenu`: Controls the visibility and coordinates of the `GlobalContextMenu`.
*   `toasts`: An array of transient notification objects.

## Agent Chat Runtime

One user turn flows: `ChatInputArea` → `agentRunService.sendChatMessage` → IPC `ai:sendPrompt` (with a renderer-generated `runId`) → `AgentEngine.processPrompt` → `runAgentLoop`. Progress streams back on `ai:agentEvent` to the calling window; the resolved IPC response is the authoritative result. `ai:cancelRun(runId)` aborts the model stream and any running command.

**Main process (`electron/agent/`)** — the only production runtime:
*   `types.ts`: options, responses, and the `ModelSession` provider contract.
*   `providers/`: `GeminiSession` (`streamGenerateContent` SSE, thought summaries, thought signatures kept verbatim), `OpenAISession` (OpenAI/Ollama SSE, incremental tool-call args, `reasoning_content` and `<think>` tags), `streamHttp.ts` (first-byte/idle watchdogs, retry on 429/5xx).
*   `loop/runAgentLoop.ts`: provider-agnostic ReAct loop — default 16 turns, parallel read-only tools, repeated-read guard, malformed-args results returned to the model, tool-free synthesis turn at the budget, cancellation.
*   `tools/`: single tool schema (`definitions.ts`), sandboxed `ToolExecutor` (diff snapshots for review/revert), `search_files`, output clipping (24k chars to the model, 6k to the UI).
*   `context/`: `ContextAssembler` (rules, skills, memories, git, attachments within a shared budget) and `historyBuilder` (alternating transcript within a character budget, prior tool outcomes appended).
*   `electron/services/AgentEngine.ts` is a thin facade; `AgentPromptBuilder.ts` owns system prompts and step labels.

**Renderer (`src/services/agent-chat/`, `src/store/useAgentRunStore.ts`)**:
*   `agentRunService.ts`: orchestrates lead run + reviewer hand-off; writes into the originating conversation even after a chat switch.
*   `agentEventBridge.ts`: single IPC listener, 40 ms batching, keeps the in-flight message so switching chats does not lose streamed content.
*   `agentEventReducer.ts`: pure event → `ChatMessage` reducer (`trace` timeline of thinking segments and tool calls).
*   `chatHistoryBuilder.ts`: history payload from completed messages only, with compact tool outcomes.
*   UI: `message/AgentRunTimeline.tsx` + `ThinkingBlock.tsx` render live reasoning and tools, collapsing to "Thought for Ns" when done. Messages persisted mid-stream reload as interrupted (`status: 'cancelled'`), never auto-resumed.

Shared protocol types live in `src/types/agent-stream.ts`. `src/agent/` and `electron/agent-runtime/` are legacy prototypes used only by test scripts.

## Design Philosophy & Aesthetics

*   **Glassmorphism**: The UI is strictly styled using translucent panels (`bg-black/20`, `bg-white/5`), aggressive blurring (`backdrop-blur-xl`), and soft layered shadows. 
*   **Frameless**: Runs without standard OS window frames (`frame: false`), using a custom drag region (`TitleBar.tsx`).
*   **Zero Native Popups**: Absolutely no `window.alert`, `window.prompt`, or native `<select>` dropdowns are allowed. Custom UI must be built for all overlays.
