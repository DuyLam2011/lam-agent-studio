import React, { useState } from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { Link2 } from 'lucide-react';
import clsx from 'clsx';
import { ProviderLinkModal } from './ProviderLinkModal';

const formatProviderShort = (p: string) => {
  if (p === 'claudecode') return 'Claude';
  if (p === 'codex') return 'Codex';
  if (p === 'antigravity') return 'AGY';
  if (p === 'gemini') return 'Gemini';
  return p;
};

export const ProviderLinkPill: React.FC = () => {
  const { providerLinkConfig } = useAgentStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isEnabled = providerLinkConfig.enabled;
  const label = isEnabled
    ? `${formatProviderShort(providerLinkConfig.sourceProvider)} ➔ ${formatProviderShort(providerLinkConfig.targetProvider)}`
    : 'Link AI';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={clsx(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all font-medium border",
          isEnabled
            ? "bg-violet-950/40 border-violet-500/40 text-violet-200 hover:bg-violet-900/50 shadow-sm"
            : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10"
        )}
        title={isEnabled ? `Provider Link Active: ${label} (${providerLinkConfig.mode})` : 'Configure Cross-AI Provider Link Pipeline'}
      >
        <Link2 size={12} className={clsx("shrink-0", isEnabled ? "text-violet-400" : "text-gray-400")} />
        <span className="truncate max-w-[130px]">{label}</span>
        {isEnabled && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        )}
      </button>

      <ProviderLinkModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
