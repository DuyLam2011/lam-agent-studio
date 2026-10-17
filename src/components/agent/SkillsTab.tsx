import React from 'react';
import { Terminal, Code, GitBranch, Search, Wrench, Shield, Sliders, CheckCircle2, Zap } from 'lucide-react';
import { useAgentStore, ConfigItem, AutonomyLevel } from '../../store/useAgentStore';
import clsx from 'clsx';

const SkillsTab: React.FC = () => {
  const { globalConfig, toggleGlobalConfig, engineSettings, updateEngineSettings, setConfigModalOpen, addToast } = useAgentStore();

  const handleAutonomyChange = (level: AutonomyLevel) => {
    updateEngineSettings({ autonomyLevel: level });
    addToast(`Execution Policy: ${level === 'full-auto' ? 'Full Autonomous (Say Yes)' : level}`, 'success');
  };

  const getSkillIcon = (icon?: string) => {
    switch (icon) {
      case 'terminal': return <Terminal size={13} className="text-cyan-400" />;
      case 'code': return <Code size={13} className="text-purple-400" />;
      case 'git': return <GitBranch size={13} className="text-amber-400" />;
      case 'search': return <Search size={13} className="text-emerald-400" />;
      default: return <Wrench size={13} className="text-primary" />;
    }
  };

  return (
    <div className="p-3 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar h-full">
      {/* Autonomy Level Policy ("Say Yes to All" Vibecoder Mode) */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
            <Zap size={11} className="text-amber-400" /> Autonomy & Tool Policy
          </span>
          {engineSettings.autonomyLevel === 'full-auto' && (
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
              Full Auto
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => handleAutonomyChange('full-auto')}
            className={clsx(
              "p-2 rounded-lg text-center transition-all border flex flex-col items-center gap-1",
              engineSettings.autonomyLevel === 'full-auto'
                ? "bg-gradient-to-b from-primary/25 to-indigo-600/20 border-primary/50 text-white shadow"
                : "bg-white/5 border-transparent text-gray-400 hover:text-gray-200"
            )}
            title="Auto-approves all tool runs and bash commands without confirmation popups"
          >
            <Zap size={13} className="text-amber-400" />
            <span className="text-[10px] font-semibold">Say Yes (Auto)</span>
          </button>

          <button
            onClick={() => handleAutonomyChange('ask-dangerous')}
            className={clsx(
              "p-2 rounded-lg text-center transition-all border flex flex-col items-center gap-1",
              engineSettings.autonomyLevel === 'ask-dangerous'
                ? "bg-primary/20 border-primary/40 text-white shadow"
                : "bg-white/5 border-transparent text-gray-400 hover:text-gray-200"
            )}
            title="Auto-runs safe tools, asks on rm/delete/push"
          >
            <Shield size={13} className="text-cyan-400" />
            <span className="text-[10px] font-semibold">Safe Auto</span>
          </button>

          <button
            onClick={() => handleAutonomyChange('ask-all')}
            className={clsx(
              "p-2 rounded-lg text-center transition-all border flex flex-col items-center gap-1",
              engineSettings.autonomyLevel === 'ask-all'
                ? "bg-primary/20 border-primary/40 text-white shadow"
                : "bg-white/5 border-transparent text-gray-400 hover:text-gray-200"
            )}
            title="Prompt confirmation before each tool invocation"
          >
            <CheckCircle2 size={13} className="text-gray-400" />
            <span className="text-[10px] font-semibold">Confirm All</span>
          </button>
        </div>
      </div>

      {/* Skills List */}
      <div className="flex-1 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Active Agent Skills
          </span>
          <button
            onClick={() => setConfigModalOpen(true)}
            className="text-[10px] text-primary hover:underline flex items-center gap-1"
          >
            <Sliders size={11} /> Advanced
          </button>
        </div>

        <div className="space-y-1.5 overflow-y-auto custom-scrollbar">
          {globalConfig.map((item: ConfigItem) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5 text-xs text-gray-300"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {getSkillIcon(item.icon)}
                <div className="min-w-0">
                  <div className="font-medium text-gray-200 truncate">{item.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{item.description}</div>
                </div>
              </div>

              <button
                disabled={item.disabled}
                onClick={() => toggleGlobalConfig(item.id, !item.active)}
                className={clsx(
                  "w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 ml-2 p-0.5",
                  item.disabled ? "bg-white/5 opacity-50 cursor-not-allowed" : (item.active ? "bg-primary" : "bg-white/10")
                )}
              >
                <div
                  className={clsx(
                    "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200",
                    item.disabled ? "translate-x-0 bg-gray-500" : (item.active ? "translate-x-4" : "translate-x-0")
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillsTab;
