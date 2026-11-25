import type { ToolDefinition } from './toolList';

export const BROWSER_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'browser_navigate',
    description: 'Navigate browser preview to a local or web URL (e.g. http://localhost:5173).',
    properties: { url: { type: 'string', description: 'Target URL to visit' } },
    required: ['url'],
    readOnly: false
  },
  {
    name: 'browser_inspect_element',
    description: 'Inspect a rendered DOM element in browser preview.',
    properties: { selector: { type: 'string', description: 'CSS selector' } },
    required: ['selector'],
    readOnly: true
  },
  {
    name: 'browser_screenshot',
    description: 'Capture visual screenshot telemetry of the rendered UI preview.',
    properties: {},
    readOnly: true
  },
  {
    name: 'browser_console_logs',
    description: 'Retrieve recent browser console logs, warnings, and runtime errors.',
    properties: {},
    readOnly: true
  },
  {
    name: 'browser_eval',
    description: 'Evaluate JavaScript safely inside the rendered browser page context.',
    properties: { code: { type: 'string', description: 'JavaScript expression to run' } },
    required: ['code'],
    readOnly: false
  },
  {
    name: 'audit_web_performance',
    description: 'Audit response latency, TTFB, DOM payload size, console errors, and performance health score of a web page.',
    properties: { url: { type: 'string', description: 'Target URL to audit (defaults to active browser URL)' } },
    readOnly: true
  },
  {
    name: 'summarize_web_ui',
    description: 'Extract visual hierarchy, layout landmarks, interactive controls, and accessibility gaps of a web page.',
    properties: { url: { type: 'string', description: 'Target URL to inspect (defaults to active browser URL)' } },
    readOnly: true
  },
  {
    name: 'read_doc',
    description: 'Fetch and distill external web documentation (via URL) or local workspace doc (via path), stripping noise and filtering by query.',
    properties: {
      url: { type: 'string', description: 'Documentation URL to fetch and convert to clean markdown' },
      path: { type: 'string', description: 'Local document path relative to workspace' },
      query: { type: 'string', description: 'Optional keyword or topic filter to distill sections' }
    },
    readOnly: true
  }
];
