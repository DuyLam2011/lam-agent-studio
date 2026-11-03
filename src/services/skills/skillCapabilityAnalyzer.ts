import {
  AnalyticSkillDraftRequest,
  ScannedRepoIntelligence,
  SkillCapabilityAnalysis
} from '../../types/skill-analytic';

export const buildCapabilityAnalysis = (
  name: string,
  folderName: string,
  req: AnalyticSkillDraftRequest,
  repo: ScannedRepoIntelligence
): SkillCapabilityAnalysis => {
  const triggers = [
    `"run ${folderName}"`,
    `"${folderName}"`,
    `"/${folderName}"`,
    `"audit ${repo.repoName}"`
  ];
  const responsibilities = [
    `Parse and inspect active files within ${req.contextTag}.`,
    `Execute core domain task: ${req.desiredSkillObjectives.trim().slice(0, 120)}.`,
    `Validate output against project direction: ${req.projectWorkDirection.trim().slice(0, 120)}.`
  ];
  const tools = ['read_file', 'edit_file', 'run_command', 'git_status'];
  const safety = [
    `Enforce user constraints: ${req.qualityInvariants.trim().slice(0, 100)}.`,
    'Never delete user workspace files without explicit confirmation.',
    'Maintain Rule 4 modular decomposition (<150 lines per file).'
  ];
  const outputs = [
    `Validated source code or test patch in ${req.contextTag}`,
    'Quantitative verification check report (clean compile & zero regression)'
  ];

  const summaryMarkdown = [
    `### 🧠 Skill Capability Breakdown: ${name}`,
    `- **Primary Role:** Automated domain execution for \`${repo.repoName}\` within \`${req.workspaceName}\`.`,
    `- **Supported Triggers:** ${triggers.map(t => `\`${t}\``).join(', ')}`,
    `- **Key Workflow Responsibilities:**\n${responsibilities.map(r => `  1. ${r}`).join('\n')}`,
    `- **Authorized Toolchain:** ${tools.map(t => `\`${t}\``).join(', ')}`,
    `- **Safety & Sandbox Boundaries:**\n${safety.map(s => `  - 🛡️ ${s}`).join('\n')}`,
    `- **Expected Deliverables:**\n${outputs.map(o => `  - 📦 ${o}`).join('\n')}`
  ].join('\n');

  return {
    primaryRole: `Specialized domain automation for ${repo.repoName}`,
    supportedTriggers: triggers,
    keyResponsibilities: responsibilities,
    orchestratedTools: tools,
    safetyBoundaries: safety,
    expectedOutputs: outputs,
    summaryMarkdown
  };
};
