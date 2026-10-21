import { useState } from 'react';
import { Folder, Code2, Zap, RotateCcw, Bot, Terminal } from 'lucide-react';
import { useAgentStore, PanelId } from '../../store/useAgentStore';
import { SecurityHarnessModal } from '../modals/security-harness/SecurityHarnessModal';
import { LayoutPresetMenu } from '../layout/LayoutPresetMenu';
import { AgentStatusWidget } from '../agent/AgentStatusWidget';
import { WindowControls } from './WindowControls';
import clsx from 'clsx';

const TitleBar = () => {
  const {
    panelVisible, panelDetached, togglePanelVisible, setPanelDetached,
    setPanelVisible, resetPanelLayout, addToast, agentRules
  } = useAgentStore();

  const [isSecurityModalOpen, setSecurityModalOpen] = useState(false);

  const handleToggle = (id: PanelId, name: string) => {
    if (panelDetached[id]) {
      // @ts-ignore
      window.lamApi?.panel?.close?.(id);
      setPanelDetached(id, false);
      setPanelVisible(id, false);
      addToast(`Closed ${name} window`, 'info');
      return;
    }
    togglePanelVisible(id);
    if (!panelDetached[id]) {
      addToast(`${name} panel ${panelVisible[id] ? 'hidden' : 'shown'}`, 'info');
    }
  };

  const panelButtons = [
    { id: 'explorer' as PanelId, name: 'Explorer', icon: Folder, activeColor: 'text-primary bg-primary/10' },
    { id: 'editor' as PanelId, name: 'Editor', icon: Code2, activeColor: 'text-emerald-400 bg-emerald-500/10' },
    { id: 'terminal' as PanelId, name: 'Terminal', icon: Terminal, activeColor: 'text-emerald-400 bg-emerald-500/10' },
    { id: 'agent' as PanelId, name: 'AI Studio', icon: Zap, activeColor: 'text-amber-400 bg-amber-500/10' },
    { id: 'agents-center' as PanelId, name: 'Agents Center', icon: Bot, activeColor: 'text-purple-400 bg-purple-500/10' },
  ];

  return (
    <div className="h-10 w-full flex items-center justify-between select-none bg-transparent m-0 p-0 rounded-none border-b border-white/5 shrink-0 [-webkit-app-region:drag]">
      <div className="pl-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-primary/80 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
        <span className="text-xs font-semibold tracking-wider text-gray-300 uppercase">L.A.M Studio</span>
      </div>

      {/* Dynamic Panel Toggles & Presets */}
      <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/5">
          {panelButtons.map(({ id, name, icon: Icon, activeColor }) => {
            const isDetached = panelDetached[id];
            const isVisible = panelVisible[id] && !isDetached;
            return (
              <button
                key={id}
                onClick={() => handleToggle(id, name)}
                className={clsx(
                  "p-1 rounded text-[10px] flex items-center gap-1 transition-colors",
                  isDetached ? "text-purple-300 bg-purple-500/25 border border-purple-500/40 font-medium" :
                  isVisible ? `${activeColor} font-medium` : "text-gray-500 hover:text-gray-300"
                )}
                title={isDetached ? `${name} (Floating Window • Click to Close)` : `Toggle ${name}`}
              >
                <Icon size={11} />
              </button>
            );
          })}
          <div className="w-px h-3 bg-white/10 mx-0.5" />
          <button
            onClick={() => { resetPanelLayout(); addToast('Layout reset to default', 'info'); }}
            className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            title="Reset Panel Positions"
          >
            <RotateCcw size={10} />
          </button>
        </div>

        <LayoutPresetMenu />
        <AgentStatusWidget />
      </div>

      {/* Right Controls */}
      <div style={{ WebkitAppRegion: 'no-drag', zIndex: 9999, position: 'relative' } as any} className="flex h-full m-0 p-0 items-center">
        <button
          onClick={() => handleToggle('agents-center', 'Agents Center')}
          className={clsx(
            "h-full px-3 transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer border-r border-white/5 text-xs",
            panelDetached['agents-center']
              ? "text-purple-300 bg-purple-500/30 border-b-2 border-purple-400 font-bold"
              : panelVisible['agents-center']
              ? "text-purple-300 bg-purple-500/20 font-medium"
              : "text-gray-300 hover:text-white hover:bg-white/10"
          )}
          title={panelDetached['agents-center'] ? "Agents Center (Floating Window • Click to Close)" : "Agents Center"}
        >
          <Bot size={13} className="text-purple-400" />
          <span className="text-[11px] font-semibold text-purple-200">Agents Center</span>
          <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-200 text-[9px] font-mono font-bold">
            {agentRules.filter(r => r.active).length}
          </span>
        </button>

        <WindowControls onOpenSecurityModal={() => setSecurityModalOpen(true)} />
      </div>

      <SecurityHarnessModal isOpen={isSecurityModalOpen} onClose={() => setSecurityModalOpen(false)} />
    </div>
  );
};

export default TitleBar;
