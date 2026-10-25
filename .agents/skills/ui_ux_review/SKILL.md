---
name: ui_ux_review
description: Comprehensive UI/UX Review & Design System Compliance Audit. Evaluates Light/Dark themes, Glassmorphism vs Minimalism paradigms, color contrast, and production settings storage optimization.
---

# UI/UX Review & Design System Audit

Use this skill to systematically evaluate, review, and grade the UI/UX quality, design token compliance, and settings storage architecture of L.A.M Agent Studio.

## Trigger Scenarios
*   User asks to "review UI/UX", "audit design system", or check if new themes/styles meet standards.
*   After implementing new themes (Dark/Light) or visual paradigms (Glassmorphism/Minimalism).
*   Validating settings persistence, atomic save integrity, and production directory safety.

---

## Evaluation Rubric & Audit Protocol

### Category 1: Design System & Token Conformance
1.  **Semantic Surface Tokens:**
    *   Verify all major panels use `.surface-panel`, `.surface-header`, `.surface-card`, `.surface-input`.
    *   Ensure no hardcoded `border-white/*` or `bg-black/*` prevents proper rendering in **Light Mode**.
    *   Ensure text colors use `text-app-text`, `text-app-sub`, `text-app-muted` instead of hardcoded `text-white` or `text-gray-300`.
2.  **Dual Visual Paradigm Compliance:**
    *   **Glassmorphism (`data-theme-style="glassmorphism"`):**
        *   Translucent backgrounds (`--bg-panel: rgba(...)`).
        *   Frosted backdrop blur active (`backdrop-filter: blur(20px)`).
        *   Illuminated subtle borders and floating shadows (`shadow-2xl`).
        *   Fluid geometry (`rounded-2xl` on panels, `rounded-xl` on cards).
    *   **Minimalism (`data-theme-style="minimalism"`):**
        *   100% solid flat fills (no transparency, zero backdrop blur).
        *   Razor-sharp 1px structural borders (`#27272a` in dark, `#e2e8f0` in light).
        *   Compact geometry (`rounded-lg` on panels, `rounded-md` on inputs).
        *   Zero render lag or GPU blur overhead.

### Category 2: Light & Dark Mode Contrast (WCAG 2.1 AA)
1.  **Text Legibility:**
    *   Dark Mode: Primary text on dark surfaces must achieve $\ge 4.5:1$ contrast ratio.
    *   Light Mode: Primary text on light surfaces (`#0f172a` on `#ffffff` or `#f1f5f9`) must achieve $\ge 7:1$ contrast ratio.
    *   Check for "ghost elements" (white text on light background or dark text on dark background).
2.  **Code Editor & Monaco Integration:**
    *   Monaco Editor must dynamically switch between `vs-dark` (Dark mode) and `vs` (Light mode).
    *   DiffViewer must match active color mode.

### Category 3: Interactive Micro-UX & State Transitions
1.  **Interactive States:**
    *   All buttons and clickable items must have visible `:hover`, `:active`, and `:focus` states.
    *   Focus rings must use `border-primary` or outline without clipping.
2.  **Scrollbars & Chrome:**
    *   Custom scrollbar thumbs must adapt dynamically to light/dark surfaces.
    *   Frameless title bar must maintain drag region (`[-webkit-app-region:drag]`) while interactive buttons remain clickable (`no-drag`).

### Category 4: Production Settings Storage Optimization
1.  **Directory Architecture:**
    *   Path must reside under `app.getPath('userData')/config/settings.json`.
    *   `app.name` must be standardized (`lam-agent-studio`) to avoid generic Electron path drift.
2.  **Atomic Persistence:**
    *   Writes must save to `.tmp` file and rename to prevent 0-byte corruptions.
    *   Recursive directory creation (`mkdir({ recursive: true })`) must precede any file I/O.
3.  **Fault Tolerance & Recovery:**
    *   Corrupted JSON files must automatically back up to `settings.corrupted.<timestamp>.json` and gracefully restore default settings.
    *   Expose Explorer folder opening via `shell.openPath` or IPC.

---

## Audit Output Format

When executing this skill, output a structured report:

```markdown
# UI/UX & Architecture Audit Report

## 1. Executive Summary
- Overall Grade: [A+ / A / B / C]
- Design System Conformance: [Pass / Partial / Fail]
- Settings Storage Health: [Optimized / Needs Review]

## 2. Token & Theme Mode Compliance
- [ ] Surface token adoption (.surface-panel, .surface-card)
- [ ] Light mode contrast verification
- [ ] Glassmorphism vs Minimalism visual parity

## 3. Micro-UX & Interaction Review
- [ ] Interactive states (:hover, :focus)
- [ ] Monaco Editor & Terminal theme sync
- [ ] Frameless title bar & window controls

## 4. Settings Storage & Production Readiness
- [ ] Path resolution (%APPDATA%/lam-agent-studio/config/settings.json)
- [ ] Atomic write integrity test
- [ ] Fault recovery & corrupt file backup

## 5. Detected Issues & Auto-Remediation Plan
[Specific findings with file references and applied patches]
```
