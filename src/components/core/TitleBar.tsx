import { useState } from 'react';
import { Folder, Code2, Zap, RotateCcw, Bot, Terminal, Palette, Globe, Workflow } from 'lucide-react';
import { useAgentStore, PanelId } from '../../store/useAgentStore';
import { SecurityHarnessModal } from '../modals/security-harness/SecurityHarnessModal';
import { LayoutPresetMenu } from '../layout/LayoutPresetMenu';
import { AgentStatusWidget } from '../agent/AgentStatusWidget';
import { ResourceMonitorWidget } from './ResourceMonitorWidget';
import { WindowControls } from './WindowControls';
import clsx from 'clsx';

const PANEL_BUTTONS: { id: PanelId; name: string; icon: any }[] = [
  { id: 'explorer', name: 'Explorer', icon: Folder }, { id: 'editor', name: 'Editor', icon: Code2 },
  { id: 'terminal', name: 'Terminal', icon: Terminal }, { id: 'browser', name: 'Browser', icon: Globe },
  { id: 'agent', name: 'AI Studio', icon: Zap }, { id: 'agents-center', name: 'Agents Center', icon: Bot },
];

const TitleBar = () => {
  const {
    panelVisible, panelDetached, togglePanelVisible, setPanelDetached,
    setPanelVisible, resetPanelLayout, addToast, agentRules, setThemeModalOpen,
    isAutomationModalOpen, setAutomationModalOpen
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
    if (!panelDetached[id]) addToast(`${name} panel ${panelVisible[id] ? 'hidden' : 'shown'}`, 'info');
  };

  return (
    <div className="h-10 w-full flex items-center justify-between select-none surface-header m-0 p-0 rounded-none shrink-0 [-webkit-app-region:drag]">
      <div className="pl-4 flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
        <span className="text-xs font-semibold tracking-wider text-app-text uppercase">L.A.M Studio</span>
      </div>

      {/* Dynamic Panel Toggles & Presets */}
      <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 bg-black/20 rounded-lg p-0.5 border border-border">
          {PANEL_BUTTONS.map(({ id, name, icon: Icon }) => {
            const isDetached = panelDetached[id];
            const isVisible = panelVisible[id] && !isDetached;
            return (
              <button
                key={id}
                onClick={() => handleToggle(id, name)}
                className={clsx(
                  "p-1.5 rounded text-[11px] flex items-center gap-1 transition-all",
                  isDetached ? "text-primary bg-primary/25 border border-primary/40 font-medium" :
                  isVisible ? "text-primary bg-primary/15 font-medium shadow-sm" : "text-app-muted hover:text-app-text hover:bg-white/5"
                )}
                title={isDetached ? `${name} (Floating Window • Click to Close)` : `Toggle ${name}`}
              >
                <Icon size={12} />
              </button>
            );
          })}
          <div className="w-px h-3 bg-border mx-0.5" />
          <button
            onClick={() => { resetPanelLayout(); addToast('Layout reset to default', 'info'); }}
            className="p-1 rounded text-app-muted hover:text-app-text hover:bg-white/10 transition-colors"
            title="Reset Panel Positions"
          >
            <RotateCcw size={11} />
          </button>
        </div>

        <LayoutPresetMenu />
        <div className="hidden lg:flex items-center gap-2">
          <AgentStatusWidget />
          <ResourceMonitorWidget />
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex h-full m-0 p-0 items-center">
        <button
          onClick={() => handleToggle('agent', 'Agents Conversation')}
          className={clsx(
            "h-full px-3 transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer border-r border-border text-xs",
            panelVisible['agent']
              ? "text-primary bg-primary/10 border-b-2 border-primary font-medium"
              : "text-app-muted hover:text-app-text hover:bg-white/5"
          )}
          title="Toggle Agents Conversation (Ctrl+L)"
        >
          <Bot size={13} className={panelVisible['agent'] ? "text-primary" : "text-app-muted"} />
          <span className="text-[11px] font-medium hidden md:inline">Chat</span>
        </button>

        <button
          onClick={() => setAutomationModalOpen(!isAutomationModalOpen)}
          className={clsx(
            "h-full px-3 transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer border-r border-border text-xs",
            isAutomationModalOpen
              ? "text-primary bg-primary/10 border-b-2 border-primary font-medium"
              : "text-app-muted hover:text-app-text hover:bg-white/5"
          )}
          title="Visual Automation Studio"
        >
          <Workflow size={13} className={isAutomationModalOpen ? "text-primary" : "text-app-muted"} />
          <span className="text-[11px] font-medium hidden md:inline">Automation</span>
        </button>

        <button
          onClick={() => handleToggle('agents-center', 'Agents Center')}
          className={clsx(
            "h-full px-3 transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer border-r border-border text-xs",
            panelVisible['agents-center']
              ? "text-primary bg-primary/10 border-b-2 border-primary font-medium"
              : "text-app-muted hover:text-app-text hover:bg-white/5"
          )}
          title="Agents Center"
        >
          <Bot size={13} className={panelVisible['agents-center'] ? "text-primary" : "text-app-muted"} />
          <span className="text-[11px] font-medium hidden md:inline">Agents</span>
          <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[9px] font-mono font-bold">{agentRules.filter((r) => r.active).length}</span>
        </button>

        <button
          onClick={() => setThemeModalOpen(true)}
          className="h-full px-2.5 transition-colors flex items-center justify-center gap-1 cursor-pointer border-r border-border text-xs text-app-muted hover:text-app-text hover:bg-white/5"
          title="Theme & Main Color Settings"
        >
          <Palette size={13} className="text-primary" />
          <span className="text-[10px] font-medium hidden sm:inline">Theme</span>
        </button>

        <WindowControls onOpenSecurityModal={() => setSecurityModalOpen(true)} />
      </div>

      <SecurityHarnessModal isOpen={isSecurityModalOpen} onClose={() => setSecurityModalOpen(false)} />
    </div>
  );
};

export default TitleBar;
