import React, { useState, useEffect } from 'react';
import { RECOMMENDED_OLLAMA_MODELS } from './ollamaData';
import { Terminal, Download, Sparkles, Cpu, HardDrive } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface OllamaModelLibraryProps {
  onSelectModel: (tag: string) => void;
}

export const OllamaModelLibrary: React.FC<OllamaModelLibraryProps> = ({ onSelectModel }) => {
  const { addToast, setPanelVisible, updateEngineSettings } = useAgentStore();
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<{ status: string; percent?: number } | null>(null);

  useEffect(() => {
    // @ts-ignore
    const cleanup = window.lamApi?.ollama?.onPullProgress?.((p: any) => {
      setPullProgress(p);
      if (p.status?.includes('success') || p.percent === 100) {
        setPullingModel(null);
        addToast('Model download complete! Ready for use', 'success');
      }
    });
    return () => cleanup?.();
  }, []);

  const handlePullInApp = async (tag: string) => {
    setPullingModel(tag);
    setPullProgress({ status: 'Connecting to Ollama service...', percent: 0 });
    try {
      // @ts-ignore
      const res = await window.lamApi?.ollama?.pullModel?.(tag);
      if (res?.success) {
        updateEngineSettings({ provider: 'ollama', selectedModel: tag });
        onSelectModel(tag);
      } else {
        addToast(res?.error || 'Failed to pull model', 'error');
        setPullingModel(null);
      }
    } catch (err: any) {
      addToast(err.message, 'error');
      setPullingModel(null);
    }
  };

  const handleRunInTerminal = (tag: string) => {
    // @ts-ignore
    const api = window.lamApi?.terminal;
    if (api) {
      setPanelVisible('terminal', true);
      api.write('term-main', `ollama run ${tag}\r\n`);
      updateEngineSettings({ provider: 'ollama', selectedModel: tag });
      onSelectModel(tag);
      addToast(`Running ${tag} in Studio Terminal`, 'info');
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-400" /> Recommended Models for Agents
        </h4>
        <span className="text-[10px] text-gray-400">Select model matching your RAM/GPU specs</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {RECOMMENDED_OLLAMA_MODELS.map((model) => {
          const isPulling = pullingModel === model.tag;
          return (
            <div
              key={model.id}
              className={clsx(
                "p-3 rounded-2xl border transition-all flex flex-col justify-between group",
                model.isTopPick
                  ? "bg-gradient-to-br from-primary/10 via-purple-900/10 to-transparent border-primary/30"
                  : "bg-white/[0.02] border-white/5 hover:border-white/15"
              )}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-1.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h5 className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                        {model.name}
                      </h5>
                      {model.isTopPick && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                          Top Pick
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 block">{model.tag}</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-2">{model.description}</p>

                <div className="flex items-center gap-3 text-[10px] text-gray-400 pt-1 border-t border-white/5 font-mono">
                  <span className="flex items-center gap-1">
                    <HardDrive size={10} className="text-gray-500" /> {model.downloadSize}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                    <Cpu size={10} /> {model.ramRequirement}
                  </span>
                </div>
              </div>

              {isPulling ? (
                <div className="mt-3 pt-2 border-t border-white/5 space-y-1">
                  <div className="flex justify-between text-[10px] text-primary font-mono">
                    <span className="truncate max-w-[180px]">{pullProgress?.status || 'Downloading...'}</span>
                    <span>{pullProgress?.percent || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-150" style={{ width: `${pullProgress?.percent || 0}%` }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handlePullInApp(model.tag)}
                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors shadow-sm"
                  >
                    <Download size={12} /> Download In-App
                  </button>
                  <button
                    onClick={() => handleRunInTerminal(model.tag)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 transition-colors"
                    title="Run in Studio Terminal"
                  >
                    <Terminal size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
