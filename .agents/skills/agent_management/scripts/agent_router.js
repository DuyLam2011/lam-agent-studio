#!/usr/bin/env node
/**
 * Agent Router & Orchestrator CLI
 * Evaluates incoming user tasks, scores intents, and outputs optimal
 * agent routing, model tier, and subagent invocation payloads.
 */

const fs = require('fs');
const path = require('path');

const AGENT_CATALOG = [
  {
    id: 'researcher',
    role: 'Codebase & Web Researcher',
    type: 'research',
    model: 'flash',
    keywords: ['find', 'search', 'where is', 'locate', 'explain how', 'investigate', 'read docs', 'api reference', 'trace'],
    description: 'Fast read-only exploration of codebase and documentation without polluting primary context.'
  },
  {
    id: 'builder',
    role: 'Targeted Code Builder',
    type: 'self',
    model: 'flash',
    keywords: ['fix', 'add function', 'implement', 'edit file', 'update code', 'patch', 'create component', 'add test'],
    description: 'Direct code authoring and single/multi-file modification with syntax verification.'
  },
  {
    id: 'architect',
    role: 'System Architect',
    type: 'self',
    model: 'pro',
    keywords: ['architecture', 'design', 'plan', 'refactor system', 'ipc protocol', 'schema migration', 'state management', 'workflow'],
    description: 'Deep reasoning, structural planning, and multi-component system design.'
  },
  {
    id: 'reviewer',
    role: 'Code & Security Auditor',
    type: 'self',
    model: 'pro',
    keywords: ['audit', 'security', 'vulnerability', 'review pr', 'owasp', 'performance bottleneck', 'memory leak'],
    description: 'Comprehensive code review, static analysis, security vetting, and quality assurance.'
  },
  {
    id: 'ui_designer',
    role: 'UI/UX Specialist',
    type: 'self',
    model: 'flash',
    keywords: ['ui', 'ux', 'tailwind', 'glassmorphism', 'modal', 'css', 'style', 'component layout', 'responsive'],
    description: 'Glassmorphic aesthetic enforcement, responsive styling, and UI component construction.'
  },
  {
    id: 'debugger',
    role: 'Root Cause Debugger',
    type: 'self',
    model: 'pro',
    keywords: ['error', 'exception', 'stack trace', 'crash', 'fail', 'hang', 'deadlock', 'bug', 'cannot connect'],
    description: 'Iron-law root cause analysis, reproducible test creation, and failure isolation.'
  }
];

function scoreQuery(query) {
  const normalized = query.toLowerCase();
  const scores = AGENT_CATALOG.map(agent => {
    let score = 0;
    const matches = [];

    for (const kw of agent.keywords) {
      if (normalized.includes(kw)) {
        score += 1.0;
        matches.push(kw);
      }
    }

    // Complexity heuristic
    if (normalized.length > 200) {
      if (agent.model === 'pro') score += 0.5;
    }

    return {
      agent,
      score,
      matches
    };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores;
}

function classifyComplexity(query) {
  const len = query.length;
  const normalized = query.toLowerCase();

  const heavyMarkers = ['refactor', 'migrate', 'architecture', 'security audit', 'entire system', 'full rewrite'];
  const hasHeavyMarker = heavyMarkers.some(m => normalized.includes(m));

  if (hasHeavyMarker || len > 350) {
    return { tier: 'T4-T5', complexity: 'High', recommendedTopology: 'Supervisor-Worker / Multi-Agent', supervisorModel: 'pro' };
  } else if (len > 120 || normalized.includes('plan') || normalized.includes('debug')) {
    return { tier: 'T2-T3', complexity: 'Moderate', recommendedTopology: 'Delegated Subagent', supervisorModel: 'pro' };
  } else {
    return { tier: 'T0-T1', complexity: 'Low / Targeted', recommendedTopology: 'Direct Single Agent', supervisorModel: 'flash' };
  }
}

function route(query) {
  const ranked = scoreQuery(query);
  const best = ranked[0];
  const complexityInfo = classifyComplexity(query);

  const selectedAgent = (best && best.score > 0) ? best.agent : AGENT_CATALOG.find(a => a.id === 'architect');
  const confidence = best && best.score > 0 ? Math.min(1.0, (best.score / 2.5)).toFixed(2) : '0.50 (Default fallback)';

  const subagentPayload = {
    TypeName: selectedAgent.type,
    Role: selectedAgent.role,
    Model: complexityInfo.complexity === 'High' ? 'pro' : selectedAgent.model,
    Prompt: `Task: ${query.trim()}\nOperating Protocol: Follow .agents/skills/agent_management/SKILL.md directives.`
  };

  return {
    query: query.trim(),
    complexity: complexityInfo,
    selectedAgent,
    confidence,
    topCandidates: ranked.slice(0, 3).map(r => ({
      role: r.agent.role,
      score: r.score.toFixed(1),
      matchedKeywords: r.matches
    })),
    subagentPayload
  };
}

// CLI Execution
const args = process.argv.slice(2);
const isJson = args.includes('--json');
const queryArgs = args.filter(a => a !== '--json');
const query = queryArgs.join(' ') || 'Debug persistent socket connection failure in Electron main process';

const result = route(query);

if (isJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('='.repeat(65));
  console.log(' AI AGENT ROUTING & ORCHESTRATION REPORT');
  console.log('='.repeat(65));
  console.log(`Query       : "${result.query}"`);
  console.log(`Complexity  : ${result.complexity.complexity} (${result.complexity.tier})`);
  console.log(`Topology    : ${result.complexity.recommendedTopology}`);
  console.log(`Model Tier  : ${result.subagentPayload.Model.toUpperCase()}`);
  console.log(`Target Agent: ${result.selectedAgent.role} [${result.selectedAgent.type}]`);
  console.log(`Confidence  : ${result.confidence}`);
  console.log('-'.repeat(65));
  console.log('Top Evaluated Agents:');
  result.topCandidates.forEach((c, idx) => {
    console.log(`  ${idx + 1}. ${c.role.padEnd(28)} Score: ${c.score.padStart(4)} | Matches: [${c.matchedKeywords.join(', ')}]`);
  });
  console.log('-'.repeat(65));
  console.log('Recommended invoke_subagent Payload:');
  console.log(JSON.stringify(result.subagentPayload, null, 2));
  console.log('='.repeat(65));
}
