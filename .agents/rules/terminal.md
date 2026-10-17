# Terminal & Shell Execution Rules

- **Execution Shell:** ALWAYS execute terminal commands via Git Bash login shell:
  `& "C:\Program Files\Git\bin\bash.exe" -l -c "<command>"`
- **Environment & PATH:** Developer tools (including Node.js and npm managed by `fnm`) are initialized in Git Bash login profiles. Do NOT use standard `cmd.exe` or `cmd /c`.
- **Non-Interactive Execution:** Ensure commands terminate cleanly upon completion.
