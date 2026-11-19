import React, { useState } from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { KeyRound, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

export const ClaudeDirectKeyInput: React.FC = () => {
  const { setClaudeDirectKey } = useAgentStore();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setLoading(true);
    try {
      await setClaudeDirectKey(apiKey.trim());
      setApiKey('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-2">
      <div className="flex items-center justify-between text-[11px] text-gray-300">
        <span className="flex items-center gap-1 font-medium">
          <KeyRound size={12} className="text-amber-400" />
          <span>Direct Anthropic API Key (Zero CLI Install)</span>
        </span>
        <span className="text-[10px] text-gray-400">sk-ant-api03-...</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste Anthropic API Key here..."
            className="w-full text-xs font-mono bg-black/50 border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
          >
            {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading || !apiKey.trim()}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white transition-all flex items-center gap-1.5 shrink-0"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
          <span>Connect</span>
        </button>
      </div>
      <p className="text-[9.5px] text-gray-400 leading-relaxed">
        Connects directly to Anthropic Cloud REST API without requiring Claude Code CLI or Node.js toolchains.
      </p>
    </form>
  );
};
