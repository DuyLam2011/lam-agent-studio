---
name: web_performance_audit
description: Systematically inspects web UI layout hierarchy, interactive elements, Core Web Vitals, TTFB response latency, and accessibility gaps with actionable optimization recommendations.
---

# Web UI & Performance Audit Skill

Use this built-in skill when the user or agent needs to evaluate, summarize, or audit a live web application or page (e.g. `http://localhost:5173` or production URLs).

## Trigger Scenarios
- User prompts: "audit web", "soi giao diện", "tổng kết giao diện", "check web performance", "audit page UI", "measure page latency".
- Following UI refactorings or CSS framework upgrades to verify responsiveness and performance integrity.
- Diagnosing client-side render lag, excessive payload sizes, or missing semantic landmarks.

---

## Autonomous Inspection Workflow

### Step 1: Navigate & Establish Connection
Call `browser_navigate` with the target URL (defaulting to the active dev server URL, e.g. `http://localhost:5173`). Verify HTTP 200 connectivity.

### Step 2: Measure Performance & Telemetry
Call `audit_web_performance` to gather:
- **TTFB & Server Latency**: Time to First Byte response timing.
- **Payload Size**: HTML and asset payload volume.
- **Console Telemetry**: Active JavaScript errors and runtime warnings.
- **Performance Health Score**: Graded on a 0-100 scale.

### Step 3: Analyze Visual Hierarchy & DOM Landmarks
Call `summarize_web_ui` to extract:
- **Landmarks**: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`.
- **Heading Order**: Check for proper `h1` $\rightarrow$ `h2` structure.
- **Interactive Density**: Tally buttons, input fields, forms, and anchor links.
- **Accessibility Health**: Flag images missing `alt` attributes or unlabelled inputs.

### Step 4: Capture Visual Evidence
Call `browser_screenshot` to attach current rendered telemetry for visual grounding.

---

## Required Output Format

Always structure your final response with an Executive-First Verdict:

```markdown
🌐 Web UI & Performance Verdict: [OPTIMAL (94/100)] (or [NEEDS OPTIMIZATION (68/100)])

### 📊 Performance & Telemetry
- **TTFB Latency:** `42 ms` (Ultra Fast)
- **Payload Size:** `142 KB`
- **Console Health:** Clean (0 errors)

### 🧩 UI Visual Structure
- **Landmarks:** `<header>`, `<nav>`, `<main>`, `<footer>`
- **Headings:** H1: 1, H2: 4, H3: 6
- **Controls:** 14 Buttons, 8 Links, 2 Form Inputs

### 🚨 Detected Gaps & Accessibility
- [List any missing alt tags or contrast issues]

### 💡 Optimization Recommendations
1. [Actionable code suggestion 1]
2. [Actionable code suggestion 2]
```
