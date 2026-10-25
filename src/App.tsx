import { useEffect } from 'react';
import { useAgentStore, PanelId } from './store/useAgentStore';
import { useConversationStore } from './store/useConversationStore';
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
import { AddContextModal } from './components/agent/context/AddContextModal';
import { SkillSelectorModal } from './components/agent/skills/SkillSelectorModal';
import { AgentDiffReviewModal } from './components/agent/diff/AgentDiffReviewModal';
import { ThemeSettingsModal } from './components/modals/theme/ThemeSettingsModal';
import { AutomationModal } from './components/automation/AutomationModal';

function App() {
  const { setWsStatus } = useAgentStore();

  const queryStr = window.location.search || (window.location.hash.includes('?') ? '?' + window.location.hash.split('?')[1] : '');
  const urlParams = new URLSearchParams(queryStr);
  const detachedPanelId = (urlParams.get('panel') ||
    (window.location.hash.includes('panel=') ? new URLSearchParams(window.location.hash.replace(/^#\/?/, '')).get('panel') : null)) as PanelId | null;
  const isDetached = urlParams.get('detached') === 'true' || window.location.hash.includes('detached=true');

  useEffect(() => {
    // Initialize high-performance disk storage for conversations
    useConversationStore.getState().initStorage();

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        useAgentStore.getState().togglePanelVisible('agent');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isDetached && detachedPanelId) {
    return <DetachedWindowView panelId={detachedPanelId} />;
  }

  return (
    <div className="flex flex-col h-screen bg-app text-app-text overflow-hidden font-sans selection:bg-primary selection:text-white">
      <TitleBar />
      <GlobalContextMenu />
      <AccountCenterModal />
      <CloneRepositoryModal />
      <ToastContainer />
      <ThemeSettingsModal />
      <AgentInspectorDrawer />
      <GitAgentReviewModalHost />
      <OllamaDeployModal />
      <CreateAgentModal />
      <AddContextModal />
      <SkillSelectorModal />
      <AgentDiffReviewModal />
      <AutomationModal />

      {/* Dynamic multi-panel layout with drawer and dockable panels */}
      <DynamicLayout />
    </div>
  );
}

export default App;
