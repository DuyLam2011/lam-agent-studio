import { useEffect } from 'react';
import { useAgentStore, PanelId } from './store/useAgentStore';
import TitleBar from './components/core/TitleBar';
import { GlobalContextMenu } from './components/core/GlobalContextMenu';
import AccountCenterModal from './components/modals/AccountCenterModal';
import CloneRepositoryModal from './components/modals/CloneRepositoryModal';
import { ToastContainer } from './components/core/ToastContainer';
import { DynamicLayout } from './components/layout/DynamicLayout';
import { DetachedWindowView } from './components/layout/DetachedWindowView';

function App() {
  const { setWsStatus, setPanelDetached, setPanelVisible, addToast } = useAgentStore();

  const urlParams = new URLSearchParams(window.location.search);
  const detachedPanelId = urlParams.get('panel') as PanelId | null;
  const isDetached = urlParams.get('detached') === 'true';

  useEffect(() => {
    // @ts-ignore
    if (window.lamApi?.panel?.onRedocked) {
      // @ts-ignore
      const cleanup = window.lamApi.panel.onRedocked((panelId: PanelId) => {
        setPanelDetached(panelId, false);
        setPanelVisible(panelId, true);
        addToast(`${panelId} re-docked into workspace`, 'success');
      });
      return cleanup;
    }
  }, [setPanelDetached, setPanelVisible, addToast]);

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

      {/* Dynamic multi-panel layout with drawer and dockable panels */}
      <DynamicLayout />
    </div>
  );
}

export default App;
