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

### Paradigm C: Paper & Ink
- **Aesthetic:** Tactile parchment paper, high-contrast letterpress ink typography, serene editorial reading comfort with zero glass reflections.
- **Surface Treatment:** Cotton parchment and drafting carbon fills (`#1a1918` panel in dark, `#fcfbf8` warm fine cotton paper in light).
- **Borders:** Bookbinding crease and graphite structural borders (`#2d2b27` in dark, `#ded6c5` in light).
- **Geometry:** Book leaf radius (`0.5rem / rounded-lg`).
- **Depth:** Soft paper-leaf elevation shadows with crisp ink contrast.
- **Use Case:** Deep, long-duration reading, documentation authoring, focused distraction-free coding.

---

## 3. Semantic Token Map

| Semantic Token | Dark Glassmorphism | Dark Minimalism | Dark Paper & Ink | Light Glassmorphism | Light Minimalism | Light Paper & Ink |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `--bg-app` | `#09090b` | `#0f0f11` | `#141413` | `#e2e8f0` | `#f1f5f9` | `#f7f4ed` |
| `--bg-panel` | `rgba(255,255,255,0.035)` | `#161619` | `#1a1918` | `rgba(255,255,255,0.65)` | `#ffffff` | `#fcfbf8` |
| `--bg-panel-header` | `rgba(0,0,0,0.40)` | `#1c1c20` | `#1f1e1c` | `rgba(255,255,255,0.75)` | `#f8fafc` | `#f2eee5` |
| `--bg-card` | `rgba(255,255,255,0.04)` | `#1c1c20` | `#22211f` | `rgba(255,255,255,0.55)` | `#f8fafc` | `#f4efe6` |
| `--bg-input` | `rgba(0,0,0,0.45)` | `#121214` | `#171615` | `rgba(255,255,255,0.85)` | `#ffffff` | `#fdfcf9` |
| `--border-subtle` | `rgba(255,255,255,0.08)` | `#27272a` | `#2d2b27` | `rgba(0,0,0,0.08)` | `#e2e8f0` | `#ded6c5` |
| `--border-medium` | `rgba(255,255,255,0.14)` | `#3f3f46` | `#423e38` | `rgba(0,0,0,0.15)` | `#cbd5e1` | `#c5bba6` |
| `--text-primary` | `#f4f4f5` | `#fafafa` | `#f2eee8` | `#0f172a` | `#0f172a` | `#1c1917` |
| `--text-secondary` | `#a1a1aa` | `#a1a1aa` | `#a8a29e` | `#475569` | `#334155` | `#57534e` |
| `--text-muted` | `#71717a` | `#71717a` | `#78716c` | `#94a3b8` | `#64748b` | `#78716c` |
| `--panel-blur` | `blur(20px)` | `none` | `none` | `blur(20px)` | `none` | `none` |
| `--panel-radius` | `1rem (16px)` | `0.5rem (8px)` | `0.5rem (8px)` | `1rem (16px)` | `0.5rem (8px)` | `0.5rem (8px)` |

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

---

## 6. Dynamic Layout Architecture & Last-State Persistence

1. **Last-State Persistence Mandate:**
   - The UI layout must always reflect the user's last configured session state upon restart.
   - Do NOT force default visibility (such as opening `editor` or `terminal` by default) if the user turned them off.
   - Key attributes persisted:
     - `panelVisible`: Visibility flags for `explorer`, `editor`, `terminal`, `agent`, and `agents-center`.
     - `panelOrder`: Horizontal sequence of docked columns.
     - `panelWidths` & `panelHeights`: Custom drag-resized geometries.
     - `panelDetached`: Pop-out window state.
     - `terminalDockPosition`: Bottom drawer vs column dock.
     - `layoutPreset`: Active layout template (`vscode-dock`, `columns-3`, `focus-code`).
2. **Dual-Tier State Hydration:**
   - **Tier 1 (Synchronous Browser Storage):** Initialized from `localStorage` (`lam_panel_visible`, `lam_panel_order`, etc.) before React DOM mount to eliminate visual layout flickering.
   - **Tier 2 (Durable Filesystem Settings):** Synchronized asynchronously with `settings.json` via IPC (`settingsAPI.saveSettings`).
3. **Contextual Tag Formatting:**
   - Any reference badge linking files, folders, or rules across workspaces must render as `([WorkspaceName]:[RepoName])`.
   - Never collapse or substitute the workspace name with the repository name.

---

## 7. Responsive Settings Layout Design System

To maintain visual consistency and full responsiveness across narrow docked side panels (~360px), center panels, and full modals (`max-w-6xl`), all Settings & Agents Center layouts MUST adhere to the shared Settings Primitives (`src/components/ui/settings/SettingsPrimitives.tsx`):

1. **Container Measure (`SettingsPage`):**
   - Single-column responsive editorial measure (`max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-5`).
   - Avoid rigid `lg:grid-cols-2` wrappers containing nested multi-column grids, which squish inside side panels.
2. **Fluid Auto-Fit Grids:**
   - Use CSS grid auto-fit (`grid-cols-[repeat(auto-fit,minmax(200px,1fr))]`) for selectable cards so layouts automatically adapt to 1, 2, 3, or 4 columns based on container space.
3. **Consistent Card Grammar (`SettingsSection` & `SettingsRow`):**
   - Grouped setting rows render inside `.surface-card rounded-2xl border border-subtle divide-y divide-subtle`.
   - Each `SettingsRow` uses `flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3.5` with title + 1-line helper description on the left and the interactive control on the right.
4. **Cohesive Accent Discipline:**
   - Selected state uses semantic `border-primary bg-primary/10 ring-1 ring-primary/25 text-app-text` rather than competing multi-color borders.
   - Never hardcode `bg-black/*`, `bg-white/*`, or `border-white/*` inside setting cards or modals, preserving full legibility in Dark, Light, Minimalism, and Paper & Ink themes.

---

## 8. Strict English-Only UI & Settings Standard

- All visible UI controls, setting labels, descriptions, tooltips, modals, Agents Center sections, and status toasts MUST be authored exclusively in clear English.
- Automated enforcement runs via `npx tsx scripts/validate_english_ui.ts`.
