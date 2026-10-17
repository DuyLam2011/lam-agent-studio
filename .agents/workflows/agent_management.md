---
description: Evaluate user requests, classify cognitive intent, recommend optimal model tiers, and orchestrate subagent routing.
---
1. Run the `agent_management` skill from `.agents/skills/agent_management/SKILL.md`.
2. Inspect the user prompt against the routing matrix in `.agents/skills/agent_management/references/routing_matrix.md`.
3. Optionally execute the automated router script:
   `cmd /c "\"C:\Program Files\Git\bin\bash.exe\" -l -c \"node .agents/skills/agent_management/scripts/agent_router.js '<PROMPT>'\""`
4. Formulate the recommended subagent execution payload or topology plan.
