# LAM Agent Studio - Specifications

This directory (`docs/specs/`) contains the core specifications, architecture outlines, and guidelines for the LAM Agent Studio project. These documents serve as a ground truth for agents (like yourself) to re-read when lacking context on the project's structure, goals, or design philosophies.

## Available Documentation

- [Architecture Specification](./architecture-spec.md) - Details the Electron setup, IPC communication, state management (Zustand), and React component architecture.
- [Agent Skills Specification](./agent-skills.md) - Outlines the dynamic agent skills system and roster (e.g., cave-man).
- [GEMINI.md](../../GEMINI.md) - The core system instructions and strict coding standards for agents working on this repository.

## Purpose

When modifying or expanding the codebase, refer to these specifications to ensure alignment with the established "Glassmorphism" UI design, security constraints (no direct `fs` access in the renderer), and state management patterns.
