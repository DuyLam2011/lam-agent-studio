import React, { useEffect, useState } from 'react';
import { BookOpen, Wrench, Workflow, Cpu, Bot, Brain, Sparkles, ShieldCheck, LucideIcon } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { ScopeSidebar } from '../modals/agents-center/ScopeSidebar';
import { RulesTab } from '../modals/agents-center/RulesTab';
import { SkillsTab } from '../modals/agents-center/SkillsTab';
import { WorkflowsTab } from '../modals/agents-center/WorkflowsTab';
import { PluginsTab } from '../modals/agents-center/PluginsTab';
import { SubagentsTab } from '../modals/agents-center/SubagentsTab';
import { MemoryTab } from '../modals/agents-center/MemoryTab';
import { UniversalImportModal } from '../modals/agents-center/UniversalImportModal';
import { SecurityHarnessModal } from '../modals/security-harness/SecurityHarnessModal';
import { DynamicPanelHeader } from '../layout/DynamicPanelHeader';
import clsx from 'clsx';

export const AgentsCenterPanel: React.FC<{ isCenter?: boolean }> = ({ isCenter = false }) => {
  const {
    agentsCenterTab,
    setAgentsCenterTab,
    setImportModalOpen,
    scanAllWorkspaceRules,
    scanAllWorkspaceSkills
  } = useAgentStore();

  const [isSecurityModalOpen, setSecurityModalOpen] = useState(false);

  useEffect(() => {
    scanAllWorkspaceRules();
    scanAllWorkspaceSkills();
  }, []);

  const tabs: { key: typeof agentsCenterTab; label: string; icon: LucideIcon }[] = [
    { key: 'rules', label: 'Rules', icon: BookOpen },
    { key: 'skills', label: 'Skills', icon: Wrench },
    { key: 'workflows', label: 'Workflows', icon: Workflow },
    { key: 'plugins', label: 'Plugins & MCP', icon: Cpu },
    { key: 'subagents', label: 'Subagents', icon: Bot },
    { key: 'memory', label: 'Memory', icon: Brain },
  ];

  return (
    <div className={clsx("flex flex-col h-full overflow-hidden bg-neutral-900/60 backdrop-blur-xl", isCenter && "w-full")}>
      <DynamicPanelHeader panelId="agents-center">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSecurityModalOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold transition-all"
            title="AI Security Audit & Harness Review"
          >
            <ShieldCheck size={11} className="text-emerald-400" />
            <span>Audit</span>
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-[10px] font-semibold transition-all"
            title="Import Rules, Skills, Workflows, MCP"
          >
            <Sparkles size={11} className="text-purple-300" />
            <span>Import</span>
          </button>
        </div>
      </DynamicPanelHeader>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-black/40 border-b border-white/5 overflow-x-auto custom-scrollbar shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = agentsCenterTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setAgentsCenterTab(tab.key)}
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0",
                isActive
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              )}
            >
              <Icon size={12} className={isActive ? "text-white" : "text-gray-400"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content with ScopeSidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <ScopeSidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {agentsCenterTab === 'rules' && <RulesTab />}
          {agentsCenterTab === 'skills' && <SkillsTab />}
          {agentsCenterTab === 'workflows' && <WorkflowsTab />}
          {agentsCenterTab === 'plugins' && <PluginsTab />}
          {agentsCenterTab === 'subagents' && <SubagentsTab />}
          {agentsCenterTab === 'memory' && <MemoryTab />}
        </div>
      </div>

      <UniversalImportModal />
      <SecurityHarnessModal isOpen={isSecurityModalOpen} onClose={() => setSecurityModalOpen(false)} />
    </div>
  );
};

export default AgentsCenterPanel;
