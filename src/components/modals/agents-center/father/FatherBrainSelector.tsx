import React, { useMemo, useState } from 'react';
import { Brain, RefreshCw, Edit3 } from 'lucide-react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { detectConnectedPackages, getPackageAwareModelOptions, SubagentModelOption } from '../../../../services/subagents/subagentPackageResolver';
import { SettingsSection, SettingsChoiceCard } from '../../../ui/settings/SettingsPrimitives';
import { FatherModelFilterBar } from './FatherModelFilterBar';
import clsx from 'clsx';

export const FatherBrainSelector: React.FC = () => {
  const store = useAgentStore();
  const { engineSettings, assignFatherAgentModel, fetchLiveModels, isFetchingLiveModels, setAccountModalOpen, addToast } = store;
  const [filterPkg, setFilterPkg] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState(engineSettings.selectedModel || '');

  const packages = detectConnectedPackages(store);
  const allOptions = useMemo(() => getPackageAwareModelOptions(store), [
    store.googleAccount, store.codexAccount, store.claudeAccount, store.liveModels, engineSettings.customApiKey, engineSettings.provider
  ]);

  const currentModel = engineSettings.selectedModel || 'auto-smart-router';
  const visibleModels = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allOptions.filter((opt) => {
      if (filterPkg === 'connected' && !opt.connected && opt.packageId !== 'auto') return false;
      if (filterPkg !== 'all' && filterPkg !== 'connected' && opt.packageId !== filterPkg) return false;
      return !q || opt.id.toLowerCase().includes(q) || opt.label.toLowerCase().includes(q) || opt.packageName.toLowerCase().includes(q);
    });
  }, [allOptions, filterPkg, search]);

  const handleSelectModel = async (opt: SubagentModelOption) => {
    const targetProvider = opt.packageId === 'auto' ? (engineSettings.provider || 'antigravity') : opt.packageId;
    await assignFatherAgentModel(targetProvider, opt.id);
    window.lamApi?.settingsAPI?.saveSettings?.({ aiProvider: targetProvider, aiModel: opt.id });
    setCustomInput(opt.id);
  };

  const handleApplyCustom = async () => {
    const val = customInput.trim();
    if (!val) return addToast('Please enter a valid model ID', 'error');
    await assignFatherAgentModel(engineSettings.provider || 'openai', val);
    setCustomMode(false);
  };

  const headerTools = (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => { void fetchLiveModels(); addToast('Refreshing live provider models...', 'info'); }}
        disabled={isFetchingLiveModels}
        className="px-2 py-1 rounded-lg surface-input hover:bg-primary/10 border border-subtle text-[10.5px] font-medium text-secondary hover:text-app-text flex items-center gap-1 cursor-pointer"
      >
        <RefreshCw size={11} className={clsx(isFetchingLiveModels && 'animate-spin text-primary')} />
        <span>Refresh</span>
      </button>
      <button
        type="button"
        onClick={() => setCustomMode(!customMode)}
        className="px-2 py-1 rounded-lg surface-input hover:bg-primary/10 border border-subtle text-[10.5px] font-medium text-secondary hover:text-app-text flex items-center gap-1 cursor-pointer"
      >
        <Edit3 size={11} />
        <span>{customMode ? 'Browse Catalog' : 'Custom ID'}</span>
      </button>
    </div>
  );

  return (
    <SettingsSection
      title="Master Brain & Model Integration"
      description="Pick any connected Chat AI, Reasoning, or Coding model across OpenAI, Codex, Claude, Google, DeepSeek, or Ollama."
      icon={Brain}
      rightSlot={headerTools}
    >
      <div className="space-y-3">
        <FatherModelFilterBar
          packages={packages} filterPkg={filterPkg} setFilterPkg={setFilterPkg}
          search={search} setSearch={setSearch} onConnectAccount={() => setAccountModalOpen(true)}
        />

        {customMode ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text" value={customInput} onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter any model ID (e.g. gpt-4o, o3-mini, claude-3-7-sonnet, argon)..."
              className="flex-1 surface-input border border-subtle rounded-xl px-3 py-2 text-xs font-mono text-app-text outline-none focus:border-primary"
            />
            <button type="button" onClick={handleApplyCustom} className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer shrink-0">
              Apply Model
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(215px,1fr))] gap-2.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
            {visibleModels.map((opt) => {
              const isSelected = currentModel === opt.id && (opt.packageId === 'auto' || (engineSettings.provider || opt.packageId) === opt.packageId || currentModel !== 'auto-smart-router');
              return (
                <SettingsChoiceCard
                  key={`${opt.packageId}-${opt.id}`}
                  selected={isSelected}
                  onClick={() => handleSelectModel(opt)}
                  title={opt.label.replace(/^\[.*?\]\s*/, '')}
                  badge={opt.id}
                  meta={
                    <>
                      <span className="truncate">{opt.packageName}</span>
                      <span className={clsx('shrink-0', opt.connected ? 'text-emerald-400' : 'text-muted')}>{opt.roleTag || 'Chat & Coding'}</span>
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </SettingsSection>
  );
};
