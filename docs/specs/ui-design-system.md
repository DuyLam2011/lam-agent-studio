# L.A.M Agent Studio - UI Design System & Architecture Specification

## 1. Design Philosophy
L.A.M Agent Studio is an Agent-First IDE designed for deep focus, technical density, and modern visual elegance. The interface balances high-performance productivity with aesthetic refinement across two distinct visual paradigms: **Glassmorphism** and **Minimalism**, supporting full **Dark** and **Light** modes.

---

## 2. Core Visual Paradigms

### Paradigm A: Glassmorphism (Default)
- **Aesthetic:** Translucent surfaces, frosted glass backdrops, ambient shadows, soft illuminated borders.
- **Surface Treatment:** `rgba(255, 255, 255, 0.035)` over deep background, with `backdrop-filter: blur(20px)`.
- **Borders:** Subtle translucent lines (`rgba(255, 255, 255, 0.08)` in dark, `rgba(0, 0, 0, 0.08)` in light).
- **Geometry:** Fluid curves (`rounded-2xl` for main docked panels, `rounded-xl` for cards, `rounded-lg` for buttons).
- **Depth:** Multi-layered soft drop shadows (`shadow-2xl shadow-black/40`).
- **Use Case:** Immersive, modern vibe-coding session.

### Paradigm B: Minimalism
- **Aesthetic:** High-contrast solid flat surfaces, razor-sharp 1px structural borders, zero backdrop blur.
- **Surface Treatment:** 100% opaque flat fills (`#161619` in dark, `#ffffff` in light).
- **Borders:** Crisp solid borders (`#27272a` in dark, `#e2e8f0` in light).
- **Geometry:** Compact functional radius (`rounded-lg` for panels, `rounded-md` for inputs).
- **Depth:** Flat or subtle 1px elevation shadow (`shadow-sm`).
- **Use Case:** Maximum CPU/GPU rendering efficiency, high-density professional code review.

---

## 3. Semantic Token Map

| Semantic Token | Dark Glassmorphism | Dark Minimalism | Light Glassmorphism | Light Minimalism |
| :--- | :--- | :--- | :--- | :--- |
| `--bg-app` | `#09090b` | `#0f0f11` | `#e2e8f0` | `#f1f5f9` |
| `--bg-panel` | `rgba(255,255,255,0.035)` | `#161619` | `rgba(255,255,255,0.65)` | `#ffffff` |
| `--bg-panel-header` | `rgba(0,0,0,0.40)` | `#1c1c20` | `rgba(255,255,255,0.75)` | `#f8fafc` |
| `--bg-card` | `rgba(255,255,255,0.04)` | `#1c1c20` | `rgba(255,255,255,0.55)` | `#f8fafc` |
| `--bg-input` | `rgba(0,0,0,0.45)` | `#121214` | `rgba(255,255,255,0.85)` | `#ffffff` |
| `--border-subtle` | `rgba(255,255,255,0.08)` | `#27272a` | `rgba(0,0,0,0.08)` | `#e2e8f0` |
| `--border-medium` | `rgba(255,255,255,0.14)` | `#3f3f46` | `rgba(0,0,0,0.15)` | `#cbd5e1` |
| `--text-primary` | `#f4f4f5` | `#fafafa` | `#0f172a` | `#0f172a` |
| `--text-secondary` | `#a1a1aa` | `#a1a1aa` | `#475569` | `#334155` |
| `--text-muted` | `#71717a` | `#71717a` | `#94a3b8` | `#64748b` |
| `--panel-blur` | `blur(20px)` | `none` | `blur(20px)` | `none` |
| `--panel-radius` | `1rem (16px)` | `0.5rem (8px)` | `1rem (16px)` | `0.5rem (8px)` |

---

## 4. Component Rules

1. **Window Frame & Custom TitleBar:**
   - Frameless Window (`frame: false`). Custom top bar with `[-webkit-app-region:drag]`.
   - Action controls must include `[-webkit-app-region:no-drag]`.
2. **Standardized Surfaces:**
   - Panels MUST use the `.surface-panel` class.
   - Panel headers MUST use the `.surface-header` class.
   - Form controls and inputs MUST use `.surface-input`.
   - Cards and list items MUST use `.surface-card`.
3. **No Native Popups:**
   - NEVER use `alert()`, `confirm()`, or `prompt()`.
   - Modals use `.surface-modal` with smooth scale/fade animations and ESC-to-close behavior.
4. **Scrollbars:**
   - Always use custom scrollbars with transparent track and rounded translucent thumbs.

---

## 5. Settings Storage Architecture (Production Releases)

For production installations (NSIS, MSI, portable releases), configuration files must never be scattered or vulnerable to corruption:
- **Base Directory:** `app.getPath('userData')/config/`
- **Settings Path:** `<userData>/config/settings.json`
- **Atomic Writes:** Write changes to `settings.json.tmp` before renaming to `settings.json`.
- **Fault Tolerance:** If a corrupted JSON file is encountered upon boot, back it up to `settings.json.corrupted.<timestamp>` and recover default settings gracefully.
- **Inspector Tooling:** Expose `settings:openSettingsFolder` to let developers and end-users open the folder directly in Explorer.
