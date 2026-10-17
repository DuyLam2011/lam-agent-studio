import React, { useState } from 'react';
import { Plus, Sparkles, BookOpen, Globe, Folder, GitBranch } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentRule } from '../../../types/rules';
import { RuleCard } from './RuleCard';
import { RuleEditorModal } from './RuleEditorModal';
import { AiRuleGeneratorModal } from './AiRuleGeneratorModal';
import { ScopeAccordion } from './ScopeAccordion';

export const RulesTab: React.FC = () => {
  const { currentRuleScope, agentRules, toggleRuleActive, deleteRule, systemContext } = useAgentStore();
  const [selectedRule, setSelectedRule] = useState<AgentRule | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ global: true, workspace: true, repo: true });

  const activeWs = currentRuleScope.workspaceId
    ? systemContext.workspaces.find(w => w.id === currentRuleScope.workspaceId)
    : systemContext.workspaces.find(w => w.folders.includes(currentRuleScope.repoPath || ''));
  const repoName = currentRuleScope.repoPath?.split(/[/\\]/).pop();
  const targetScopeId = currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : (currentRuleScope.type === 'workspace' ? currentRuleScope.workspaceId : undefined);

  const globalRules = agentRules.filter(r => r.scope === 'global');
  const workspaceRules = agentRules.filter(r => r.scope === 'workspace' && (!activeWs || r.targetId === activeWs.id));
  const repoRules = agentRules.filter(r => r.scope === 'repo' && (!currentRuleScope.repoPath || r.targetId === currentRuleScope.repoPath));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-900">
      <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-primary" />
            <h3 className="text-sm font-semibold text-gray-200">Rule Governance Architecture</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 max-w-xl">
            Global standards (overridable per target), workspace directives (locked), and repo rules (git locked).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Sparkles size={13} className="text-purple-300" />
            <span>AI Architect Rules</span>
          </button>
          <button
            onClick={() => { setSelectedRule(null); setIsEditorOpen(true); }}
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Plus size={13} />
            <span>New Rule</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {/* Global standards are always visible so user can toggle them for current scope */}
        <ScopeAccordion
          title="Global Standards"
          subtitle={targetScopeId ? "Inherited baseline (Toggle switch to override/disable here)" : "Applies across all projects"}
          icon={Globe}
          iconColor="text-cyan-400"
          badgeCount={globalRules.length}
          badgeColor="cyan"
          isOpen={openSections.global}
          onToggle={() => setOpenSections(s => ({ ...s, global: !s.global }))}
          emptyMessage="No global rules defined. Global rules set baseline architectural standards."
        >
          {globalRules.map(rule => (
            <RuleCard key={rule.id} rule={rule} onToggle={toggleRuleActive} onEdit={(r) => { setSelectedRule(r); setIsEditorOpen(true); }} onDelete={deleteRule} currentScopeTargetId={targetScopeId} />
          ))}
        </ScopeAccordion>

        {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
          <ScopeAccordion
            title="Workspace Directives"
            subtitle={activeWs ? `Workspace: ${activeWs.name} (Enforced)` : 'All workspaces (Enforced)'}
            icon={Folder}
            iconColor="text-purple-400"
            badgeCount={workspaceRules.length}
            badgeColor="purple"
            isOpen={openSections.workspace}
            onToggle={() => setOpenSections(s => ({ ...s, workspace: !s.workspace }))}
            emptyMessage="No workspace rules defined for this workspace."
          >
            {workspaceRules.map(rule => (
              <RuleCard key={rule.id} rule={rule} onToggle={toggleRuleActive} onEdit={(r) => { setSelectedRule(r); setIsEditorOpen(true); }} onDelete={deleteRule} currentScopeTargetId={targetScopeId} />
            ))}
          </ScopeAccordion>
        )}

        {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
          <ScopeAccordion
            title="Repository Directives"
            subtitle={repoName ? `Repo: ${repoName} (Git Enforced)` : 'All repositories (Git Enforced)'}
            icon={GitBranch}
            iconColor="text-amber-400"
            badgeCount={repoRules.length}
            badgeColor="amber"
            isOpen={openSections.repo}
            onToggle={() => setOpenSections(s => ({ ...s, repo: !s.repo }))}
            emptyMessage="No repository rules found (GEMINI.md, CLAUDE.md, .cursorrules)."
          >
            {repoRules.map(rule => (
              <RuleCard key={rule.id} rule={rule} onToggle={toggleRuleActive} onEdit={(r) => { setSelectedRule(r); setIsEditorOpen(true); }} onDelete={deleteRule} currentScopeTargetId={targetScopeId} />
            ))}
          </ScopeAccordion>
        )}
      </div>

      <RuleEditorModal rule={selectedRule} isOpen={isEditorOpen} onClose={() => { setIsEditorOpen(false); setSelectedRule(null); }} />
      <AiRuleGeneratorModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </div>
  );
};
