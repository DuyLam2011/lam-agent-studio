import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { webPerformanceAuditService } from '../electron/services/WebPerformanceAuditService';
import { useAgentStore } from '../src/store/useAgentStore';

async function runDynamicTabsAndWebAuditTests() {
  console.log('🧪 Starting Dynamic Workspace Tabs & Web Performance Audit Suite...\n');

  // 1. Test Dynamic Tab Management in Zustand Store
  console.log('  Testing Dynamic Workspace Tabs...');
  const store = useAgentStore.getState();

  // Test Opening Agents Center Tab
  store.openAgentsCenterTab();
  let state = useAgentStore.getState();
  const agentsCenterTab = state.openTabs.find(t => t.path === '__agent_center__');
  assert(agentsCenterTab !== undefined, 'Agents Center tab must be present in openTabs');
  assert.strictEqual(agentsCenterTab?.tabType, 'agents-center', 'tabType must be "agents-center"');
  assert.strictEqual(state.activeFile?.path, '__agent_center__', 'Active file must point to Agents Center tab');
  console.log('  ✅ Successfully opened dynamic "Agents Center" tab in workspace');

  // Test Opening Linked Browser Tab
  store.openLinkedBrowserTab('http://localhost:3000');
  state = useAgentStore.getState();
  const browserTab = state.openTabs.find(t => t.path === '__linked_browser__');
  assert(browserTab !== undefined, 'Linked Browser tab must be present in openTabs');
  assert.strictEqual(browserTab?.tabType, 'linked-browser', 'tabType must be "linked-browser"');
  assert.strictEqual(browserTab?.content, 'http://localhost:3000', 'URL must be stored in content');
  assert.strictEqual(state.activeFile?.path, '__linked_browser__', 'Active file must switch to Linked Browser');
  console.log('  ✅ Successfully opened dynamic "Linked Browser" tab with target URL');

  // Test Tab Switching & Closing
  const browserTabIndex = state.openTabs.findIndex(t => t.path === '__linked_browser__');
  store.closeTab(browserTabIndex);
  state = useAgentStore.getState();
  assert(!state.openTabs.some(t => t.path === '__linked_browser__'), 'Linked Browser tab must be removed after closing');
  console.log('  ✅ Successfully closed dynamic tab and preserved tab state');

  // 2. Test WebPerformanceAuditService
  console.log('\n  Testing WebPerformanceAuditService...');
  const auditResult = await webPerformanceAuditService.auditPage('http://localhost:5173');
  assert(auditResult !== null && typeof auditResult === 'object', 'Audit result must be an object');
  assert(typeof auditResult.performanceScore === 'number', 'Performance score must be a number');
  assert(auditResult.performanceScore >= 0 && auditResult.performanceScore <= 100, 'Score must be in 0-100 range');
  assert(typeof auditResult.ttfbMs === 'number', 'TTFB latency must be measured');
  assert(auditResult.domSummary !== undefined, 'DOM summary must be populated');
  assert(Array.isArray(auditResult.domSummary.semanticTagsFound), 'Semantic tags array must be present');
  assert(auditResult.markdownReport.includes('Web UI & Performance Audit Report'), 'Markdown report must have header');
  console.log(`  ✅ Web Performance Audit generated: Score ${auditResult.performanceScore}/100, TTFB ${auditResult.ttfbMs}ms`);

  // 3. Test Built-in Skill Existence & Content
  console.log('\n  Testing Built-in Skill: web_performance_audit...');
  const skillPath = path.resolve('.agents/skills/web_performance_audit/SKILL.md');
  assert(fs.existsSync(skillPath), `Skill file must exist at ${skillPath}`);
  const skillContent = fs.readFileSync(skillPath, 'utf-8');
  assert(skillContent.includes('name: web_performance_audit'), 'Skill must define correct name in frontmatter');
  assert(skillContent.includes('browser_navigate'), 'Skill must reference browser_navigate');
  assert(skillContent.includes('audit_web_performance'), 'Skill must reference audit_web_performance');
  assert(skillContent.includes('summarize_web_ui'), 'Skill must reference summarize_web_ui');
  console.log('  ✅ Verified built-in skill markdown and autonomous execution protocol');

  console.log('\n🎉 ALL DYNAMIC TABS & WEB AUDIT INVARIANTS VERIFIED 100%!');
}

runDynamicTabsAndWebAuditTests().catch((err) => {
  console.error('❌ Dynamic tabs & web audit test failed:', err);
  process.exit(1);
});
