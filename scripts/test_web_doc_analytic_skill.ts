import path from 'path';
import { ToolSkillReader } from '../electron/agent/tools/ToolSkillReader';
import { DocReaderService } from '../electron/services/DocReaderService';
import { ToolExecutor } from '../electron/agent/tools/ToolExecutor';
import { CodeModeService } from '../electron/services/CodeModeService';
import { AgentPromptBuilder } from '../electron/services/AgentPromptBuilder';

async function runTests() {
  const workspaceRoot = path.resolve(__dirname, '..');
  console.log('🧪 Starting Verification: Web & Doc Analytic Skill & Agent Class...\n');

  // Test 1: Skill Discovery & Content
  console.log('Pass 1: Checking skill discovery via ToolSkillReader...');
  const skillContent = await ToolSkillReader.readSkill(workspaceRoot, 'web_doc_analytic');
  if (!skillContent.includes('Web Browser Telemetry & Documentation Analytic Skill')) {
    throw new Error('Failed to discover web_doc_analytic skill content');
  }
  if (!skillContent.includes('read_doc') || !skillContent.includes('summarize_web_ui')) {
    throw new Error('Skill missing required browser/doc tool directives');
  }
  console.log('✅ Pass 1: Skill discovery and directives verified successfully.');

  // Test 2: DocReaderService Local & Filter
  console.log('\nPass 2: Testing DocReaderService local file read with query filtering...');
  const docResult = await DocReaderService.readDoc(workspaceRoot, {
    path: '.agents/skills/web_doc_analytic/SKILL.md',
    query: 'Token-Efficient'
  });
  if (!docResult.includes('[📖 Doc Reader:') || !docResult.includes('Token-Efficient')) {
    throw new Error('DocReaderService failed to filter by query');
  }
  console.log('✅ Pass 2: Local document query filtering verified:\n' + docResult.slice(0, 260) + '...\n');

  // Test 3: ToolExecutor Dispatch (read_doc)
  console.log('Pass 3: Testing ToolExecutor dispatch with read_doc...');
  const executor = new ToolExecutor(workspaceRoot);
  const toolRes = await executor.execute('read_doc', {
    path: '.agents/skills/web_doc_analytic/SKILL.md',
    query: 'Protocol 1'
  });
  if (toolRes.status !== 'success' || !String(toolRes.result).includes('Protocol 1')) {
    throw new Error('ToolExecutor read_doc failed: ' + JSON.stringify(toolRes));
  }
  console.log('✅ Pass 3: ToolExecutor read_doc tool executed successfully.');

  // Test 4: Subagent Delegation (subagent-web-doc-analytic)
  console.log('\nPass 4: Testing subagent delegation to subagent-web-doc-analytic...');
  const subRes = await executor.execute('delegate_to_subagent', {
    subagentId: 'subagent-web-doc-analytic',
    task: 'Audit live localhost preview and extract semantic DOM landmarks'
  });
  if (subRes.status !== 'success' || !String(subRes.result).includes('Class: Analytic')) {
    throw new Error('Subagent delegation failed to resolve Analytic class');
  }
  console.log('✅ Pass 4: Subagent delegation verified:\n' + String(subRes.result).slice(0, 200) + '...\n');

  // Test 5: Code Mode tools.readDoc integration
  console.log('Pass 5: Testing Code Mode programmatic workflow with tools.readDoc...');
  const codeModeRes = await CodeModeService.executeScript(
    `const doc = await tools.readDoc('.agents/skills/web_doc_analytic/SKILL.md', 'Philosophy');
     return { success: true, docSnippet: doc.slice(0, 120) };`,
    workspaceRoot,
    'Verify Analytic Doc Code Mode'
  );
  if (!codeModeRes.success || !codeModeRes.output.includes('Philosophy')) {
    throw new Error('Code Mode tools.readDoc failed: ' + codeModeRes.output);
  }
  console.log('✅ Pass 5: Code Mode tools.readDoc execution verified:\n' + codeModeRes.output + '\n');

  // Test 6: AgentPromptBuilder Persona & Directives
  console.log('Pass 6: Verifying Analytic Persona prompt builder...');
  const prompt = AgentPromptBuilder.buildSystemInstruction('WORKSPACE CONTEXT', {
    persona: 'analytic'
  });
  if (!prompt.includes('[Active Persona: Analytic Specialist - Web & Doc Intelligence]')) {
    throw new Error('AgentPromptBuilder missing analytic persona prompt');
  }
  if (!prompt.includes('Analytic class agents specialize in read-only web verification')) {
    throw new Error('AgentPromptBuilder missing analytic class boundary safeguards');
  }
  console.log('✅ Pass 6: Analytic Persona system instruction verified.\n');

  console.log('🎉 ALL 6 WEB & DOC ANALYTIC TESTS PASSED 100%!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
