# Agent Skills Specification

L.A.M Agent Studio supports a dynamic skill system that provides agents with specific workflows, behaviors, or capabilities.

## Skill Roster

### Communication & Delegation (The Cave-Man Series)
*   **caveman**: Ultra-compressed communication mode. Cuts token usage ~75% by speaking like caveman while keeping full technical accuracy.
*   **cavecrew**: Decision guide for delegating to caveman-style subagents (`cavecrew-investigator`, `cavecrew-builder`, `cavecrew-reviewer`).
*   **caveman-commit**: Ultra-compressed commit message generator. Cuts noise from commit messages while preserving intent and reasoning.
*   **caveman-compress**: Compress natural language memory files into caveman format to save input tokens.
*   **caveman-review**: Ultra-compressed code review comments. Cuts noise from PR feedback while preserving the actionable signal.

### Code & Quality
*   **code_review**: Comprehensive code review covering Functionality, Security (OWASP), Performance, and Maintainability.
*   **debug_issue**: A strict, scientific debugging protocol (The "Iron Law") emphasizing root cause investigation.
*   **optimize_codebase**: Identifies and refactors monolithic files into modular, performance-safe component structures.
*   **security_audit**: Scans the codebase for OWASP Top 10 vulnerabilities and manages SECURITY.md.

### UI / UX
*   **enhance_ui**: Systematic UI enhancement and verification, covering styling upgrades and responsiveness.
*   **ui_ux_pro_max**: UI/UX design intelligence with searchable database of patterns, styles, and stacks.

### Documentation & Reporting
*   **daily_log**: Scans the current conversation thread and updates a project work log. Useful for tracking progress.
*   **document_api**: Generates standardized API documentation (OpenAPI/Markdown) for backend endpoints.
*   **update_docs**: Updates standard project documentation files (README, CODE_DOCUMENTATION, DESIGN_PHILOSOPHY) to reflect the current state of the codebase.
*   **repo_infographic**: Generates a crisp, clear full infographic of the repository with a unique theme based on the repo's content.

### System & Workflows
*   **create_launcher**: Generates robust, cross-platform launcher scripts (Windows .bat, Unix .sh, Mac .sh).
*   **create_skill**: Automates the creation of professional-grade Antigravity skills.
*   **idea_to_action**: Transforms abstract ideas into execution-ready systems following a Brainstorm → Filter → Execute pipeline.
*   **release_helper**: Automates release note generation, handles version incrementing, and prepares social media announcements.
