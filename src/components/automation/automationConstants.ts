import { AutomationCategory, AutomationPipeline } from '../../types/automation';

export const CATEGORY_COLORS: Record<AutomationCategory, { bg: string; border: string; text: string; header: string }> = {
  trigger: { bg: 'bg-emerald-950/40', border: 'border-emerald-500/40', text: 'text-emerald-300', header: 'bg-emerald-500/20' },
  agent: { bg: 'bg-purple-950/40', border: 'border-purple-500/40', text: 'text-purple-300', header: 'bg-purple-500/20' },
  tool: { bg: 'bg-cyan-950/40', border: 'border-cyan-500/40', text: 'text-cyan-300', header: 'bg-cyan-500/20' },
  condition: { bg: 'bg-amber-950/40', border: 'border-amber-500/40', text: 'text-amber-300', header: 'bg-amber-500/20' },
  output: { bg: 'bg-rose-950/40', border: 'border-rose-500/40', text: 'text-rose-300', header: 'bg-rose-500/20' },
};

export const NODE_CATALOG: Array<{ category: AutomationCategory; name: string; sublabel: string; defaultConfig: Record<string, any> }> = [
  { category: 'trigger', name: 'Manual Trigger', sublabel: 'Run on Button Click', defaultConfig: { event: 'manual' } },
  { category: 'trigger', name: 'On Git Commit', sublabel: 'Trigger before git commit', defaultConfig: { event: 'pre-commit' } },
  { category: 'trigger', name: 'On File Save', sublabel: 'Trigger on file modify', defaultConfig: { event: 'on-save', pattern: '*.ts' } },
  { category: 'agent', name: 'Father Agent', sublabel: 'Plan and orchestrate tasks', defaultConfig: { persona: 'lead-architect', prompt: 'Analyze workspace status' } },
  { category: 'agent', name: 'QA Reviewer Agent', sublabel: 'Audit diffs and code safety', defaultConfig: { persona: 'subagent-qa-reviewer', prompt: 'Review recent modified files' } },
  { category: 'agent', name: 'Log Diagnostician', sublabel: 'Diagnose runtime errors', defaultConfig: { persona: 'subagent-log-analyzer', prompt: 'Inspect terminal error stream' } },
  { category: 'tool', name: 'Run Shell Command', sublabel: 'Execute terminal command', defaultConfig: { tool: 'run_command', command: 'npm test' } },
  { category: 'tool', name: 'Git Status Check', sublabel: 'Inspect branch & dirty files', defaultConfig: { tool: 'git_status' } },
  { category: 'tool', name: 'Read Workspace File', sublabel: 'Read file content', defaultConfig: { tool: 'read_file', path: 'package.json' } },
  { category: 'condition', name: 'If Exit Code Success', sublabel: 'Branch on command success', defaultConfig: { condition: 'exit_zero' } },
  { category: 'output', name: 'Show Toast Alert', sublabel: 'Notify developer on UI', defaultConfig: { type: 'toast', message: 'Automation Pipeline completed!' } },
  { category: 'output', name: 'Post to AI Chat', sublabel: 'Send summary to active chat', defaultConfig: { type: 'chat', title: 'Automation Output' } }
];

export const PRESET_PIPELINES: AutomationPipeline[] = [
  {
    id: 'pipe-auto-qa',
    name: 'Auto Test & QA Remediation',
    description: 'Runs npm test, audits regressions, and dispatches QA Reviewer if tests fail.',
    updatedAt: Date.now(),
    nodes: [
      { id: 'n-1', category: 'trigger', name: 'Manual Trigger', sublabel: 'Run on Button Click', position: { x: 80, y: 180 }, config: { event: 'manual' } },
      { id: 'n-2', category: 'tool', name: 'Run Shell Command', sublabel: 'Execute npm test', position: { x: 380, y: 180 }, config: { tool: 'run_command', command: 'npm test' } },
      { id: 'n-3', category: 'agent', name: 'QA Reviewer Agent', sublabel: 'Audit diffs & syntax', position: { x: 680, y: 180 }, config: { persona: 'subagent-qa-reviewer', prompt: 'Review modified files' } },
      { id: 'n-4', category: 'output', name: 'Show Toast Alert', sublabel: 'Notify developer', position: { x: 980, y: 180 }, config: { type: 'toast', message: 'QA Remediation pipeline succeeded!' } }
    ],
    edges: [
      { id: 'e-1-2', sourceNodeId: 'n-1', targetNodeId: 'n-2' },
      { id: 'e-2-3', sourceNodeId: 'n-2', targetNodeId: 'n-3' },
      { id: 'e-3-4', sourceNodeId: 'n-3', targetNodeId: 'n-4' }
    ]
  },
  {
    id: 'pipe-precommit',
    name: 'Pre-Commit Security & Git Gate',
    description: 'Checks Git status, audits sensitive keys, and notifies developer before committing.',
    updatedAt: Date.now(),
    nodes: [
      { id: 'p-1', category: 'trigger', name: 'On Git Commit', sublabel: 'Trigger before git commit', position: { x: 80, y: 180 }, config: { event: 'pre-commit' } },
      { id: 'p-2', category: 'tool', name: 'Git Status Check', sublabel: 'Inspect branch & dirty files', position: { x: 400, y: 180 }, config: { tool: 'git_status' } },
      { id: 'p-3', category: 'output', name: 'Post to AI Chat', sublabel: 'Send summary to active chat', position: { x: 720, y: 180 }, config: { type: 'chat', title: 'Pre-commit Git Status' } }
    ],
    edges: [
      { id: 'ep-1-2', sourceNodeId: 'p-1', targetNodeId: 'p-2' },
      { id: 'ep-2-3', sourceNodeId: 'p-2', targetNodeId: 'p-3' }
    ]
  }
];
