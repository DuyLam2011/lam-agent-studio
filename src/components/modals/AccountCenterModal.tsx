import React from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import { X, Sparkles, HardDrive, Blocks, Compass } from 'lucide-react';
import { GoogleAccountCard } from './account/GoogleAccountCard';
import { CodexAccountCard } from './account/CodexAccountCard';
import { ClaudeAccountCard } from './account/ClaudeAccountCard';
import { GitHubAccountCard } from './account/GitHubAccountCard';

const AccountCenterModal: React.FC = () => {
  const { isAccountModalOpen, setAccountModalOpen } = useAgentStore();

  if (!isAccountModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div 
        className="w-full max-w-lg bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <div>
            <h2 className="text-sm font-bold text-gray-200 tracking-wide uppercase">Account Center</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Manage connected AI engines, OAuth profiles & developer credentials</p>
          </div>
          <button 
            onClick={() => setAccountModalOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Active Integrations */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              AI Engines & Developer Identity
            </h3>
            
            {/* Google Antigravity Session */}
            <GoogleAccountCard />

            {/* OpenAI Codex (ChatGPT Plan) */}
            <CodexAccountCard />

            {/* Anthropic Claude Code (Official Runtime) */}
            <ClaudeAccountCard />

            {/* GitHub Account */}
            <GitHubAccountCard />
          </div>

          {/* Upcoming Integrations */}
          <div>
            <h3 className="text-[10px] uppercase font-bold text-gray-500 mb-2.5 tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-purple-400" /> Additional Providers
            </h3>
            
            <div className="grid grid-cols-3 gap-2.5">
              {/* Cursor */}
              <div className="flex flex-col gap-1.5 bg-black/20 border border-white/5 rounded-xl p-2.5 opacity-60 grayscale cursor-not-allowed">
                <div className="flex items-center gap-1.5">
                  <Blocks size={13} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-300">Cursor</span>
                </div>
                <div className="text-[9px] text-gray-500 leading-tight">Sync IDE settings</div>
              </div>

              {/* Local AI / Ollama */}
              <div className="flex flex-col gap-1.5 bg-black/20 border border-white/5 rounded-xl p-2.5 opacity-60 grayscale cursor-not-allowed">
                <div className="flex items-center gap-1.5">
                  <HardDrive size={13} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-300">Ollama</span>
                </div>
                <div className="text-[9px] text-gray-500 leading-tight">Local GPU inference</div>
              </div>

              {/* Perplexity */}
              <div className="flex flex-col gap-1.5 bg-black/20 border border-white/5 rounded-xl p-2.5 opacity-60 grayscale cursor-not-allowed">
                <div className="flex items-center gap-1.5">
                  <Compass size={13} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-300">Perplexity</span>
                </div>
                <div className="text-[9px] text-gray-500 leading-tight">Sonar Pro Engine</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AccountCenterModal;
