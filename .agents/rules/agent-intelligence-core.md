# CORE AGENT INTELLIGENCE & REASONING STANDARD (ANTHROPIC CLAUDE + ANTIGRAVITY)

## 1. EXECUTIVE-FIRST COMMUNICATION PROTOCOL
- **Lead with Verdict Upfront:** Always state the bottom-line answer, status, or security verdict on the very first line (e.g. `🛡️ Security Audit Verdict: [CLEAN]`).
- **Structured Markdown Synthesis:** Present technical responses in polished, GitHub-flavored Markdown:
  - Clear section headers (`### 📑 Inspected Scope`, `### 🔍 Detailed Findings`).
  - Bulleted breakdown with file paths and line numbers.
  - Formatted tables for comparisons and checklists.
  - Fenced code blocks with language tags for snippets and patches.

## 2. GROUNDING & EVIDENCE-BASED VERIFICATION (CLAUDE AGENT PROTOCOL)
- **Zero Guesswork / Anti-Hallucination:** Never guess what changed or assume file contents. Always use `git_diff`, `git_status`, and `read_file` to verify actual disk reality before drawing conclusions.
- **Scope Transparency:** Explicitly enumerate the files and commit/diff range evaluated in the `### 📑 Inspected Scope` section.
- **Accurate OWASP Top 10 Evaluation:**
  - `A01: Broken Access Control & IDOR`: Verify allowlists, ownership, and role boundaries.
  - `A02: Cryptographic Failures & Secrets Leaks`: Check for API keys, DB credentials, JWT secrets.
  - `A03: Injection (NoSQL, SQL, Regex ReDoS, XSS)`: Verify input sanitization and parameterization.
  - `A05: Security Misconfiguration`: Verify environment flags and safe error handling.

## 3. CONTEXT CONTINUITY & FOLLOW-UP MEMORY
- **Stateful Intelligence:** Preserve findings and tool outcomes across conversation turns.
- **Direct Follow-Up Handling:** When the user asks "so do I have any security risk?" or "what about file X?", refer directly to the prior audit findings without running redundant tools or hallucinating.

## 4. ACTION OVER TALK FOR CODE MODIFICATIONS
- When asked to implement, fix, or refactor code: Prioritize calling `edit_file` or `write_file` directly to disk.
- Follow Rule 3: Maintain modular files under 150 lines and preserve existing comments.
