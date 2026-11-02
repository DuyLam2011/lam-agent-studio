# Ruleset: Dynamic Layout & Contextual Resolution

## 1. Dynamic Layout Principles
- **No Hardcoded Panel Defaults:**
  - When the user closes or opens panels in the workspace, the IDE must record and retain that exact configuration.
  - On application reboot, the IDE must NEVER forcefully reset to default panels (such as forcing open `editor` and `terminal`).
  - If a user previously closed `editor` and `terminal` and only kept `agent` (AI Studio) and `explorer` active, the app must boot with ONLY `agent` and `explorer` active.
- **Immediate Persistence:**
  - All layout mutations (`panelVisible`, `panelOrder`, `panelWidths`, `panelHeights`, `panelDetached`, `terminalDockPosition`, `layoutPreset`) must be written immediately to `localStorage` and dispatched via `settingsAPI.saveSettings`.

## 2. Contextual Tagging Standards
- **Workspace-to-Repo Structure:**
  - When referencing folders or files in context (@ mentions, context chips, payload lists), tags must be formatted as `([WorkspaceName]:[RepoName])`.
  - `WorkspaceName` is the explicit workspace container name (e.g. `Untitled Workspace`, `Production Core`, or custom name).
  - `RepoName` is the distinct root folder name of the target repository (e.g. `FirewallRuleTool_Jobs`).
  - The workspace name must never be overwritten by the repository name.
