import React, { useEffect } from 'react';
import { X, BookOpen, Wrench, Workflow, Cpu, Bot, Brain, Sparkles, LucideIcon } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { ScopeSidebar } from './ScopeSidebar';
import { RulesTab } from './RulesTab';
import { SkillsTab } from './SkillsTab';
import { WorkflowsTab } from './WorkflowsTab';
import { PluginsTab } from './PluginsTab';
import { SubagentsTab } from './SubagentsTab';
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
    { key: 'memory', label: 'Memory & ADRs', icon: Brain },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-[1100px] h-[720px] bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0 gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-md">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Agents Center</h2>
              <p className="text-[10px] text-gray-400">Total Governance: Rules, Skills, Pipelines, MCP & Personas</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = agentsCenterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setAgentsCenterTab(tab.key)}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0",
                    isActive
                      ? "bg-primary text-white shadow"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  )}
                >
                  <Icon size={13} className={isActive ? "text-white" : "text-gray-400"} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-semibold shadow-md transition-all"
              title="Import Rules, Skills, Workflows, MCP or ADRs from Local Files or GitHub"
            >
              <Sparkles size={13} className="text-purple-300" />
              <span>Universal Import</span>
            </button>

            <button
              onClick={() => setAgentsCenterOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
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
          {agentsCenterTab === 'memory' && <MemoryTab />}
        </div>
      </div>

      {/* Universal Import Modal */}
      <UniversalImportModal />
    </div>
  );
};

export default AgentsCenterModal;
