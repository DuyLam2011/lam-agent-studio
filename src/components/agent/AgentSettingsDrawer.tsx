import React from 'react';
import { X, Sliders, Zap, Palette } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { ProviderConfigCard } from './ProviderConfigCard';
import { AgentInferenceConfig } from './AgentInferenceConfig';
import { AvatarStyleSelector } from './avatar/AvatarStyleSelector';
import clsx from 'clsx';

interface AgentSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentSettingsDrawer: React.FC<AgentSettingsDrawerProps> = ({ isOpen, onClose }) => {
  const { globalConfig, toggleGlobalConfig, setThemeModalOpen } = useAgentStore();

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 surface-modal rounded-none flex flex-col p-4 overflow-y-auto custom-scrollbar animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <Sliders size={14} className="text-primary" />
          <h3 className="text-xs font-semibold text-app-text uppercase tracking-wider">Agent Settings</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-app-muted hover:text-app-text hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      <div className="py-3 space-y-4 flex-1 text-xs">
        {/* Appearance & Design System shortcut */}
        <div className="surface-card p-2.5 rounded-xl border border-border flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Palette size={14} className="text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-app-text">Appearance & Design System</div>
              <div className="text-[10px] text-app-muted truncate">Light/Dark Mode & Glassmorphism/Minimalism</div>
            </div>
          </div>
          <button
            onClick={() => setThemeModalOpen(true)}
            className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium border border-primary/20 transition-colors shrink-0"
          >
            Customize
          </button>
        </div>

        {/* Customizable Agent Avatar Style */}
        <div className="p-3 rounded-2xl surface-card border border-border">
          <AvatarStyleSelector />
        </div>

        {/* Real LLM Provider & API Key Configuration */}
        <ProviderConfigCard />

        {/* Autonomy Policy */}
        <div className="p-2.5 rounded-xl surface-card border border-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-app-muted tracking-wider flex items-center gap-1.5">
              <Zap size={12} className="text-amber-500" /> Autonomy Policy
            </span>
            <span className="text-[9px] bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
              Auto Approve: ON
            </span>
          </div>
          <p className="text-[11px] text-app-sub leading-relaxed">
            All code modifications and terminal commands run autonomously without interrupting modal popups.
          </p>
        </div>

        {/* Temperature & Reasoning Effort sliders */}
        <AgentInferenceConfig />

        {/* Active Skills Toggles */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold text-app-muted tracking-wider">Core Skills</span>
          <div className="space-y-1">
            {globalConfig.slice(0, 4).map((skill) => (
              <div key={skill.id} className="flex items-center justify-between p-2 rounded-lg surface-card border border-subtle text-xs">
                <span className="text-app-text truncate font-medium">{skill.name}</span>
                <button
                  type="button"
                  onClick={() => toggleGlobalConfig(skill.id, !skill.active)}
                  className={clsx("w-8 h-4 rounded-full relative transition-colors duration-200 shrink-0 p-0.5 cursor-pointer border border-subtle", skill.active ? "bg-primary border-primary" : "surface-input")}
                >
                  <div className={clsx("w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-200", skill.active ? "translate-x-4" : "translate-x-0")} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-lg transition-colors shrink-0"
      >
        Save & Return to Chat
      </button>
    </div>
  );
};
