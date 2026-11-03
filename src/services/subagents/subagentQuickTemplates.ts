import { AgentClassType } from '../../types/agent-class';

export interface QuickTemplateData {
  name: string;
  folderOrId: string;
  description: string;
  content: string;
}

export const getSkillTemplateForClass = (cls: AgentClassType, agentName: string): QuickTemplateData => {
  switch (cls) {
    case 'architecture':
      return {
        name: `${agentName} Architecture Guard`,
        folderOrId: `skill-${cls}-guard`,
        description: 'Enforces architectural boundaries, module sizing, and zero circular dependencies.',
        content: `# ${agentName} Architecture Audit Skill\n\n## Directives\n1. Strictly enforce single responsibility and module sizes (< 150 lines).\n2. Audit IPC contracts and state flow between layers.\n3. Reject monolithic anti-patterns and unisolated mutations.`,
      };
    case 'planner':
      return {
        name: `${agentName} Task Planner`,
        folderOrId: `skill-${cls}-planner`,
        description: 'Breaks down multi-tier user objectives into verifiable execution phases.',
        content: `# ${agentName} Planning & Roadmap Skill\n\n## Directives\n1. Decompose ambiguous prompts into atomic phases (Phase 1 to Phase N).\n2. Define clear verification gates for each phase.\n3. Identify missing context and dependencies before execution.`,
      };
    case 'analytic':
      return {
        name: `${agentName} Analytic Intelligence`,
        folderOrId: `skill-${cls}-analyst`,
        description: 'Scans repositories, profiles capabilities, and synthesizes verifiable evaluation suites.',
        content: `# ${agentName} Repo Analytic Skill\n\n## Directives\n1. Scan repository structure, dependencies, and configuration matrices in English.\n2. Decompose capabilities into distinct triggers, actions, and safety boundaries.\n3. Synthesize deterministic evaluation suites with quantitative pass/fail assertions.`,
      };
    case 'executor':
    default:
      return {
        name: `${agentName} Surgical Executor`,
        folderOrId: `skill-${cls}-executor`,
        description: 'Executes targeted code patches, runs test suites, and validates invariants.',
        content: `# ${agentName} Surgical Execution Skill\n\n## Directives\n1. Implement exact, production-ready code with zero placeholders.\n2. Run automated test suites and verify compilation after editing.\n3. Maintain strict TypeScript type-safety across all touched files.`,
      };
  }
};

export const getRuleTemplateForClass = (cls: AgentClassType, agentName: string): QuickTemplateData => {
  switch (cls) {
    case 'architecture':
      return {
        name: `${agentName} Architecture Invariant Rule`,
        folderOrId: `rule-${cls}-invariant`,
        description: 'Guardrail ensuring architectural integrity and strict modular boundaries.',
        content: `# Architecture Guardrail\n- Every new module must strictly remain <= 150 lines of code.\n- All high-level tasks must use predefined IPC channels.\n- Prevent tight coupling between Renderer and File System.`,
      };
    case 'planner':
      return {
        name: `${agentName} Planning Discipline Rule`,
        folderOrId: `rule-${cls}-discipline`,
        description: 'Enforces planning phase discipline: no premature code mutations.',
        content: `# Planning Discipline Guardrail\n- NEVER modify source code directly while in planning mode.\n- Clarify underspecified constraints using targeted questions.\n- Provide structured task matrices with risks and alternatives.`,
      };
    case 'analytic':
      return {
        name: `${agentName} Analytic Intelligence Rule`,
        folderOrId: `rule-${cls}-intelligence`,
        description: 'Enforces evidence-based AST analysis, English capability breakdown, and quantitative eval testing.',
        content: `# Analytic Discipline Rule\n- All repository findings, capability breakdowns, and eval assertions must be written in English.\n- Ground all recommendations in scanned repository files (zero guessing).\n- Always provide automated verification and negative test cases for every synthesized skill.`,
      };
    case 'executor':
    default:
      return {
        name: `${agentName} Safe Execution Rule`,
        folderOrId: `rule-${cls}-safe-exec`,
        description: 'Strict guardrail for executing code mutations and verifying invariants.',
        content: `# Safe Execution Guardrail\n- Always preserve existing comments and docstrings.\n- Run verification check (tsc and test suites) after every mutation.\n- Revert immediately if breaking invariants are detected.`,
      };
  }
};
