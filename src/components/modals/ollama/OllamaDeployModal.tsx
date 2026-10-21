import React, { useState, useEffect } from 'react';
import { X, Server, BookOpen, Sparkles, DownloadCloud, Cloud } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { OllamaStatusCard } from './OllamaStatusCard';
import { OllamaModelLibrary } from './OllamaModelLibrary';
import { OllamaGuideTab } from './OllamaGuideTab';
import { OllamaTargetDeployStep } from './OllamaTargetDeployStep';
import { CloudAgentHubTab } from './CloudAgentHubTab';
import clsx from 'clsx';

export const OllamaDeployModal: React.FC = () => {
  const { isOllamaModalOpen, setOllamaModalOpen } = useAgentStore();
  const [activeTab, setActiveTab] = useState<'cloud' | 'deploy' | 'models' | 'guide'>('cloud');

  useEffect(() => {
    if (!isOllamaModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOllamaModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOllamaModalOpen, setOllamaModalOpen]);

  if (!isOllamaModalOpen) return null;

  const tabs = [
    { key: 'cloud' as const, label: 'Cloud API (Gemini / OpenAI)', icon: Cloud },
    { key: 'deploy' as const, label: 'Ollama Setup (Local)', icon: DownloadCloud },
    { key: 'models' as const, label: 'Model Library', icon: Sparkles },
    { key: 'guide' as const, label: 'Guide & FAQ', icon: BookOpen },
  ];

  return (
    <div
      onClick={() => setOllamaModalOpen(false)}
      className="fixed top-10 inset-x-0 bottom-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[calc(100vh-5rem)] bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/30 via-primary/30 to-purple-600/30 border border-white/10 flex items-center justify-center shadow-inner">
              <Server size={16} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                AI Engine & Provider Hub (Cloud & Local)
              </h3>
              <p className="text-[11px] text-gray-400">
                Connect Google Gemini, OpenAI, DeepSeek or deploy offline Ollama
              </p>
            </div>
          </div>
          <button
            onClick={() => setOllamaModalOpen(false)}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close (ESC)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Always-on Status & Connection Tester */}
          <OllamaStatusCard onSelectModel={() => {}} />

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0",
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab View */}
          {activeTab === 'deploy' && <OllamaTargetDeployStep />}
          {activeTab === 'models' && <OllamaModelLibrary onSelectModel={() => {}} />}
          {activeTab === 'cloud' && <CloudAgentHubTab />}
          {activeTab === 'guide' && <OllamaGuideTab />}
        </div>
      </div>
    </div>
  );
};
