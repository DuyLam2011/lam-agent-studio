# Product Requirements Document (PRD): AI UI & State Interaction

## 1. Objective
Transform the static configuration panels of L.A.M Agent Studio into an interactive, AI-driven experience. The user should be able to prompt the embedded AI to configure the workspace, toggle skills, gather context, and navigate the UI automatically without manual clicks.

## 2. Background & Use Cases
Currently, the `AgentConfigPanel` has hardcoded toggles for terminal access, file mutation, and context payloads. 
**Use Case:** A user wants to set up a specific testing environment. Instead of dragging and dropping 5 files and manually toggling 3 skills, the user prompts: *"Add all skills and context from folder 'abc' for me."* The AI asks for confirmation, then actively mutates the UI state to achieve this, providing visual feedback of its actions.

## 3. Core Features

### 3.1. Agent Chat Interface
*   **Location:** Augment or replace the current `AgentConfigPanel` on the right side with an interactive chat UI.
*   **Functionality:** Accepts natural language prompts from the user. Displays AI responses and action confirmations.

### 3.2. AI Tool Execution (State Mutation API)
*   The AI must be provided with a schema of available tools (functions) it can execute to control the IDE.
*   **Supported Actions:**
    *   `addContext(path)`: Adds a file or folder to the Context Payload.
    *   `toggleSkill(skillName, active)`: Enables or disables specific agent skills.
    *   `navigateUI(target)`: Switches sidebar tabs (e.g., Explorer vs. Search vs. Git) or opens specific settings modals.
    *   `openFile(path)`: Opens a file in the multi-tab editor.

### 3.3. Visual Feedback & Confirmation
*   **Confirmation Loops:** Destructive or highly complex context additions should prompt the user for a simple "Yes/No" in the chat before execution.
*   **UI Updates:** When the AI calls a tool, the UI must immediately reflect the change (e.g., the toggle switch flips, the file appears in the Context Dropzone, and a Toast notification appears).

## 4. Technical Considerations (Electron Architecture)
*   **Context Isolation:** Since the UI is in the Renderer, if the AI logic (LLM API calls) resides in the Main process (for security), we must establish bidirectional IPC channels:
    *   `Renderer -> Main`: "Send Prompt to AI"
    *   `Main -> Renderer`: "AI invoked Tool X with Args Y" (Renderer then executes the Zustand state mutation).
*   **State Management:** All UI mutations will strictly route through the existing `useAgentStore.ts` (Zustand) to ensure React reactivity.

## 5. Out of Scope
*   Full visual GUI interaction (Puppeteer/Playwright DOM clicking). The AI will interact via deterministic state functions (Zustand), not by simulating mouse clicks on X/Y coordinates.
