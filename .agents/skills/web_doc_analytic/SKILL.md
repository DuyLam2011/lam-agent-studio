---
name: web_doc_analytic
description: High-performance protocol and best practices for AI agents to inspect live web browser previews, audit Core Web Vitals and DOM hierarchy, and perform token-efficient, anti-hallucinatory documentation reading (read_doc).
---

# Web Browser Telemetry & Documentation Analytic Skill

Use this built-in skill when an agent or user needs to inspect a live web application preview, evaluate visual DOM hierarchy, profile Core Web Vitals, or read and synthesize external/internal technical documentation.

---

## 🎯 Analytic Agent Class Identity & Directives

When operating under the **Analytic Specialist** class (`persona: 'analytic'` or `subagent-web-doc-analytic`):
- **Role:** Non-destructive observer, performance profiler, and technical documentation synthesizer.
- **Core Philosophy:** *Grounding First, Zero Hallucination, Strict Token Efficiency.*
- **Class Boundary Invariant:** The Analytic class evaluates, verifies, and extracts telemetry. It does **not** perform destructive mutations or blind assumptions. When findings require code changes, it outputs a structured remediation blueprint for Executor agents.

---

## 🌐 Protocol 1: Live Web Browser Inspection & Telemetry

### 1. Navigation & Connection Handshake
Always establish a live connection using `browser_navigate`:
- Verify HTTP response status (HTTP 200 OK vs 404/500).
- If connection fails or times out, diagnose server port status before proceeding.

### 2. Measure Core Web Vitals & Latency
Call `audit_web_performance` to gather deterministic telemetry:
- **TTFB (Time to First Byte):** Flag TTFB > 500ms as a performance warning.
- **DOM & Asset Payload:** Flag pages exceeding 500 KB uncompressed.
- **Console Telemetry:** Audit JavaScript errors and runtime warnings. Zero console errors required for clean status.
- **Performance Health Score:** Graded on a 0–100 scale.

### 3. Token-Efficient DOM Hierarchy Extraction
> [!IMPORTANT]
> **NEVER dump raw HTML (`document.body.outerHTML`) into LLM context.** Ingesting thousands of raw DOM lines wastes 80% of context tokens on boilerplate styling.
- Call `summarize_web_ui` to extract distilled semantic landmarks:
  - **Landmarks:** `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.
  - **Heading Cascade:** Ensure logical heading order (`h1` $\rightarrow$ `h2` $\rightarrow$ `h3`).
  - **Interactive Density:** Tally total buttons, anchor links, form inputs, and modals.
  - **Accessibility Score:** Flag images missing `alt` attributes and unlabelled form controls.
- Call `browser_inspect_element(selector)` for pinpoint inspection of specific UI widgets.

### 4. Visual Evidence & Rendering Grounding
When assessing visual layout, theme mode (Dark/Light/Glassmorphism), or responsive breakpoints:
- Call `browser_screenshot` to ground conclusions on actual rendered pixels.

---

## 📖 Protocol 2: High-Performance Documentation Reading (`read_doc`)

### 1. The Context Bloat Problem
Dumping entire 50-page web manuals into conversation context causes severe context rot, high latency, and hallucinations.

### 2. Surgical Extraction & Filtering
Call `read_doc` with target URL or local path and an optional `query`:
```json
{
  "url": "https://dev.meta.ai/docs/overview",
  "query": "agent harness"
}
```
- **Strip Web Noise:** The engine strips `<script>`, `<style>`, `<nav>`, ads, and cookie banners automatically.
- **Extract High-Signal Elements:** Retain only H1-H4 headings, code snippets (`<pre><code>`), API parameter tables, and invariant notes.
- **Query Distillation:** When `query` is passed, the engine isolates matching sections and adjacent code examples, reducing token usage by up to 70%.

### 3. Anti-Hallucination Grounding Standard
- Always cite the exact documentation URL or local file path.
- State package version numbers and compatibility matrices explicitly.
- Never extrapolate unlisted API parameters or unsupported features.

---

## ⚡ Protocol 3: Code Mode Programmatic Analytic Workflows

When performing multi-page documentation research or end-to-end browser audits, invoke `code_mode_eval` to execute a single-turn programmatic workflow:

```javascript
// Example: Programmatic Doc & UI Telemetry Audit in a single turn
const perf = await tools.bash('curl -s -o /dev/null -w "%{http_code}:%{time_total}" http://localhost:5173');
const doc = await tools.readDoc('docs/specs/ui-design-system.md', 'Glassmorphism');
return {
  devServerPing: perf.output,
  designTokens: doc.slice(0, 300)
};
```
*Benefits:* Executes locally without intermediate round-trips, distilling findings into a compact output envelope.

---

## 📑 Required Analytic Output Format

Always lead with an upfront Executive Verdict:

```markdown
🌐 Web & Doc Analytic Verdict: [OPTIMAL (92/100)] / [ATTENTION REQUIRED]

### 📊 Performance & Telemetry Matrix
| Metric | Value | Assessment |
| :--- | :--- | :--- |
| **TTFB Latency** | `34 ms` | ⚡ Ultra Fast |
| **Payload Size** | `118 KB` | 🟢 Lightweight |
| **Console Errors** | `0 errors` | 🛡️ Clean |
| **A11y Score** | `96/100` | 🟢 Excellent |

### 🧩 DOM Hierarchy & Landmarks
- **Landmarks Detected:** `<header>`, `<nav>`, `<main>`, `<footer>`
- **Interactive Controls:** 12 Buttons, 6 Links, 3 Inputs
- **Heading Integrity:** 1 H1, 4 H2, 7 H3

### 📖 Documentation Key Takeaways
- **Target Source:** `[Documentation Title / URL]`
- **API Signatures & Types:** [Verified code snippet]
- **Core Invariants:** [Constraint 1], [Constraint 2]

### 🛠️ Actionable Next Steps (for Executor)
1. [Actionable engineering recommendation]
```
