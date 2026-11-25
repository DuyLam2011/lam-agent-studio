---
trigger: always_on
description: Enforces 100% English-only UI/Settings text and unified responsive Settings Design System compliance across L.A.M Agent Studio.
---

# STRICT ENGLISH-ONLY UI & SETTINGS DESIGN SYSTEM INVARIANT

1. **Zero Vietnamese in UI & Settings (Hard Invariant):**
   - ALL labels, titles, descriptions, placeholders, button text, tooltips, modal headers, toast messages, and preset metadata rendered in `src/components/**`, `src/types/**`, `src/data/**`, Agents Center, Setting Center, Account Center, and Delegation Cards MUST be strictly written in clear, idiomatic English.
   - NO Vietnamese characters (`à-ỹ`, `đ`, etc.) are permitted inside any rendered UI string or settings configuration.
   - Always validate with `npx tsx scripts/validate_english_ui.ts` before completing UI/Settings modifications.

2. **Single Source of Truth for Agent & Father Agent Settings:**
   - Never maintain two disconnected setup modals or desynchronized stores for Father Agent configuration.
   - Father Agent setup lives cleanly inside the unified `Father Agent` tab in Agents Center, synchronized across `engineSettings` and `agentProfiles['father-agent']`.

3. **Responsive Settings Design System:**
   - Every settings view must adapt gracefully from narrow docked panels (~360px) to full-screen modals (`max-w-4xl`) using fluid CSS grids (`grid-cols-[repeat(auto-fit,minmax(...))]`) and shared primitives in `src/components/ui/settings/SettingsPrimitives.tsx`.
   - Use ONLY semantic surface tokens (`.surface-modal`, `.surface-panel`, `.surface-header`, `.surface-card`, `.surface-input`, `border-subtle`, `text-app-text`, `text-secondary`, `text-muted`, `bg-primary`) to guarantee parity across Dark, Light, Glassmorphism, Minimalism, and Paper & Ink.
