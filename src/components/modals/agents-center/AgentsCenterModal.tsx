import React, { useEffect } from 'react';
import { X, BookOpen, Wrench, Workflow, Cpu, Bot, Brain, Sparkles, LucideIcon, Layers } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { ScopeSidebar } from './ScopeSidebar';
import { RulesTab } from './RulesTab';
import { SkillsTab } from './SkillsTab';
import { WorkflowsTab } from './WorkflowsTab';
import { PluginsTab } from './PluginsTab';
import { SubagentsTab } from './SubagentsTab';
import { CombosTab } from './CombosTab';
import { MemoryTab } from './MemoryTab';
import { UniversalImportModal } from './UniversalImportModal';
import clsx from 'clsx';

export const AgentsCenterModal: React.FC = () => {
  const {
    isAgentsCenterOpen,
    setAgentsCenterOpen,
    agentsCenterTab,
    setAgentsCenterTab,
    setImportModalOpen,
    scanAllWorkspaceRules,
    scanAllWorkspaceSkills
  } = useAgentStore();

  useEffect(() => {
    if (isAgentsCenterOpen) {
      scanAllWorkspaceRules();
      scanAllWorkspaceSkills();
    }
  }, [isAgentsCenterOpen]);

  if (!isAgentsCenterOpen) return null;

  const tabs: { key: typeof agentsCenterTab; label: string; icon: LucideIcon }[] = [
    { key: 'rules', label: 'Rules', icon: BookOpen },
    { key: 'skills', label: 'Skills', icon: Wrench },
    { key: 'workflows', label: 'Workflows', icon: Workflow },
    { key: 'plugins', label: 'Plugins & MCP', icon: Cpu },
    { key: 'subagents', label: 'Subagents', icon: Bot },
    { key: 'combos', label: 'Combos', icon: Layers },
    { key: 'memory', label: 'Memory & ADRs', icon: Brain },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-modal w-[1100px] h-[720px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-4 py-3 border-b border-subtle flex items-center justify-between surface-header shrink-0 gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-md">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-app-text uppercase tracking-wider">Agents Center</h2>
              <p className="text-[10px] text-muted">Total Governance: Rules, Skills, Pipelines, MCP & Personas</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 surface-input p-1 rounded-xl border border-subtle overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = agentsCenterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setAgentsCenterTab(tab.key)}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer",
                    isActive
                      ? "bg-primary text-white shadow"
                      : "text-secondary hover:text-app-text hover:bg-primary/10"
                  )}
                >
                  <Icon size={13} className={isActive ? "text-white" : "text-muted"} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-semibold shadow-md transition-all cursor-pointer"
              title="Import Rules, Skills, Workflows, MCP or ADRs from Local Files or GitHub"
            >
              <Sparkles size={13} className="text-primary" />
              <span>Universal Import</span>
            </button>

            <button
              onClick={() => setAgentsCenterOpen(false)}
              className="p-1.5 hover:bg-primary/10 rounded-lg text-muted hover:text-app-text transition-colors cursor-pointer"
              title="Close Agents Center"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 flex overflow-hidden">
          <ScopeSidebar />
          {agentsCenterTab === 'rules' && <RulesTab />}
          {agentsCenterTab === 'skills' && <SkillsTab />}
          {agentsCenterTab === 'workflows' && <WorkflowsTab />}
          {agentsCenterTab === 'plugins' && <PluginsTab />}
          {agentsCenterTab === 'subagents' && <SubagentsTab />}
          {agentsCenterTab === 'combos' && <CombosTab />}
          {agentsCenterTab === 'memory' && <MemoryTab />}
        </div>
      </div>

      {/* Universal Import Modal */}
      <UniversalImportModal />
    </div>
  );
};

export default AgentsCenterModal;
