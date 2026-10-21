import { useEffect } from 'react';
import { useAgentStore, PanelId } from './store/useAgentStore';
import TitleBar from './components/core/TitleBar';
import { GlobalContextMenu } from './components/core/GlobalContextMenu';
import AccountCenterModal from './components/modals/AccountCenterModal';
import CloneRepositoryModal from './components/modals/CloneRepositoryModal';
import { ToastContainer } from './components/core/ToastContainer';
import { DynamicLayout } from './components/layout/DynamicLayout';
import { DetachedWindowView } from './components/layout/DetachedWindowView';
import { AgentInspectorDrawer } from './components/agent/inspector/AgentInspectorDrawer';
import { GitAgentReviewModalHost } from './components/git/GitAgentReviewModalHost';
import { OllamaDeployModal } from './components/modals/ollama/OllamaDeployModal';
import { CreateAgentModal } from './components/modals/agents-center/CreateAgentModal';

function App() {
  const { setWsStatus } = useAgentStore();

  const urlParams = new URLSearchParams(window.location.search);
  const detachedPanelId = urlParams.get('panel') as PanelId | null;
  const isDetached = urlParams.get('detached') === 'true';

  useEffect(() => {
    // @ts-ignore
    const api = window.lamApi?.panel;
    if (api) {
      const unsubRedock = api.onRedocked?.((panelId: PanelId) => {
        useAgentStore.getState().redockPanel(panelId);
      });
      const unsubClose = api.onClosed?.((panelId: PanelId) => {
        const store = useAgentStore.getState();
        store.setPanelDetached(panelId, false);
        store.setPanelVisible(panelId, false);
        store.addToast(`${panelId} panel closed`, 'info');
      });
      return () => {
        unsubRedock?.();
        unsubClose?.();
      };
    }
  }, []);

  useEffect(() => {
    // @ts-ignore
    if (window.lamApi?.ai?.onToolCall) {
      // @ts-ignore
      window.lamApi.ai.onToolCall((tool: { name: string, args: any }) => {
        const store = useAgentStore.getState();
        if (tool.name === 'aiSetSkillActive') {
          store.aiSetSkillActive(tool.args.skillName, tool.args.active);
        } else if (tool.name === 'aiAddContextPayload') {
          store.aiAddContextPayload(tool.args.path);
        } else if (tool.name === 'aiNavigate') {
          store.aiNavigate(tool.args.target);
        }
      });
    }
  }, []);

  useEffect(() => {
    // @ts-ignore
    if (window.lamApi) {
      // @ts-ignore
      window.lamApi.onWebSocketStatus?.((status: string) => {
        setWsStatus(status);
      });

      // @ts-ignore
      window.lamApi.settingsAPI?.loadSettings().then((settings: any) => {
        useAgentStore.getState().loadSettings(settings);
      });
    }
  }, [setWsStatus]);

  if (isDetached && detachedPanelId) {
    return <DetachedWindowView panelId={detachedPanelId} />;
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-foreground overflow-hidden font-sans selection:bg-primary selection:text-white">
      <TitleBar />
      <GlobalContextMenu />
      <AccountCenterModal />
      <CloneRepositoryModal />
      <ToastContainer />
      <AgentInspectorDrawer />
      <GitAgentReviewModalHost />
      <OllamaDeployModal />
      <CreateAgentModal />

      {/* Dynamic multi-panel layout with drawer and dockable panels */}
      <DynamicLayout />
    </div>
  );
}

export default App;
