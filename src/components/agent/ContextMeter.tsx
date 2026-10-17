import React from 'react';
import { Layers } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { AVAILABLE_MODELS } from './agentConstants';

export const ContextMeter: React.FC = () => {
  const { engineSettings, contextAttachments, chatMessages, activeFile } = useAgentStore();

  const currentModel = AVAILABLE_MODELS.find(m => m.id === engineSettings.selectedModel) || AVAILABLE_MODELS[0];
  const maxTokens = currentModel.contextWindow;

  // Compute live approximate tokens
  const filesTokens = contextAttachments.reduce((sum, item) => sum + (item.tokenEstimate || 200), 0);
  const activeFileTokens = activeFile?.content ? Math.ceil(activeFile.content.length / 3.8) : 0;
  const chatTokens = chatMessages.reduce((sum, m) => sum + Math.ceil((m.text.length + (m.thinking?.length || 0)) / 3.8), 0);
  const systemBaseTokens = 3200; // Base system instructions & GEMINI.md
  
  const totalTokens = systemBaseTokens + filesTokens + activeFileTokens + chatTokens;
  const usagePercent = Math.min(100, Math.max(1, (totalTokens / maxTokens) * 100));

  const formatTokens = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const getColorClass = (percent: number) => {
    if (percent < 50) return 'from-emerald-500 to-cyan-500';
    if (percent < 80) return 'from-yellow-500 to-amber-500';
    return 'from-rose-500 to-red-600';
  };

  return (
    <div className="w-full bg-black/30 rounded-lg p-2 border border-white/5 space-y-1.5" title={`Tokens: ${totalTokens.toLocaleString()} / ${maxTokens.toLocaleString()}`}>
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5 text-gray-400 font-medium">
          <Layers size={11} className="text-primary" />
          <span>Context Window</span>
        </div>
        <div className="flex items-center gap-1 font-mono">
          <span className="text-gray-200 font-semibold">{formatTokens(totalTokens)}</span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400">{formatTokens(maxTokens)}</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-white/5 text-gray-400 ml-1">
            {usagePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getColorClass(usagePercent)} transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.2)]`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>
    </div>
  );
};
