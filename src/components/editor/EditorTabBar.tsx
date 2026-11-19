import React from 'react';
import { X, Bot, Globe } from 'lucide-react';
import clsx from 'clsx';
import { ActiveFile, useAgentStore } from '../../store/useAgentStore';

interface EditorTabBarProps {
  openTabs: ActiveFile[];
  activeTabIndex: number;
  onSelectTab: (index: number) => void;
  onPinTab: (index: number) => void;
  onCloseTab: (index: number) => void;
}

export const EditorTabBar: React.FC<EditorTabBarProps> = ({
  openTabs,
  activeTabIndex,
  onSelectTab,
  onPinTab,
  onCloseTab,
}) => {
  const { openAgentsCenterTab, openLinkedBrowserTab } = useAgentStore();

  const renderTabIcon = (tab: ActiveFile) => {
    if (tab.tabType === 'agents-center' || tab.path === '__agent_center__') {
      return <Bot size={13} className="text-purple-400 mr-1.5 shrink-0" />;
    }
    if (tab.tabType === 'linked-browser' || tab.path === '__linked_browser__') {
      return <Globe size={13} className="text-sky-400 mr-1.5 shrink-0" />;
    }
    return (
      <span
        className={clsx(
          "w-2 h-2 rounded-full mr-2 shrink-0",
          tab.isDiff ? "bg-purple-500/80 shadow-[0_0_6px_rgba(168,85,247,0.4)]" : "bg-blue-500/80 shadow-[0_0_6px_rgba(59,130,246,0.4)]"
        )}
      />
    );
  };

  return (
    <div className="flex overflow-x-auto custom-scrollbar surface-header shrink-0 min-h-[40px] px-2 gap-1 items-center border-b border-white/5">
      {openTabs.map((tab, index) => {
        const tabFilename = tab.name || tab.path.split(/[/\\]/).pop() || '';
        const isActive = index === activeTabIndex;
        const isSpecialTab = tab.tabType === 'agents-center' || tab.tabType === 'linked-browser' || tab.path.startsWith('__');

        return (
          <div
            key={`${tab.path}-${index}`}
            onClick={() => onSelectTab(index)}
            onDoubleClick={() => onPinTab(index)}
            className={clsx(
              "group flex items-center h-8 px-3 rounded-lg cursor-pointer shrink-0 transition-all text-xs select-none border",
              isActive
                ? "surface-card border-primary/40 text-gray-200 font-medium shadow-md shadow-primary/5"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5",
              isSpecialTab && isActive && "ring-1 ring-primary/20"
            )}
          >
            {renderTabIcon(tab)}
            <span className={clsx("tracking-wide mr-2", tab.isPreview && "italic", isSpecialTab && "font-semibold")}>
              {tabFilename}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(index);
              }}
              className={clsx(
                "p-0.5 rounded transition-colors",
                isActive
                  ? "text-gray-400 hover:text-white hover:bg-white/10"
                  : "text-transparent group-hover:text-gray-500 hover:text-white hover:bg-white/10"
              )}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      {/* Quick Add Dynamic Tab Shortcuts */}
      <div className="flex items-center gap-0.5 ml-1">
        <button
          onClick={openAgentsCenterTab}
          className="p-1.5 rounded-lg text-gray-500 hover:text-purple-300 hover:bg-purple-500/10 transition-colors flex items-center gap-1 text-[10.5px]"
          title="Open Agents Center in Tab"
        >
          <Bot size={12} />
        </button>
        <button
          onClick={() => openLinkedBrowserTab()}
          className="p-1.5 rounded-lg text-gray-500 hover:text-sky-300 hover:bg-sky-500/10 transition-colors flex items-center gap-1 text-[10.5px]"
          title="Open Linked Browser in Tab"
        >
          <Globe size={12} />
        </button>
      </div>
    </div>
  );
};
