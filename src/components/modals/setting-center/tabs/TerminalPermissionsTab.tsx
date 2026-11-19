import React, { useState } from 'react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { Terminal, Shield, Plus, X } from 'lucide-react';
import { ExecutionEnvironmentSection } from './ExecutionEnvironmentSection';
import clsx from 'clsx';

export const TerminalPermissionsTab: React.FC = () => {
  const { agentPermissions, updateAgentPermissions, addToast } = useAgentStore();
  const [newAllowed, setNewAllowed] = useState('');
  const [newBlocked, setNewBlocked] = useState('');
  const terminal = agentPermissions.terminal;

  const handleModeChange = (mode: 'restricted' | 'guarded' | 'turbo') => {
    updateAgentPermissions({ terminal: { ...terminal, executionMode: mode } });
    addToast(`Switched Terminal execution mode to ${mode.toUpperCase()}`, 'info');
  };

  const handleAddAllowed = () => {
    const val = newAllowed.trim();
    if (!val || terminal.allowedCommands.includes(val)) return;
    updateAgentPermissions({ terminal: { ...terminal, allowedCommands: [...terminal.allowedCommands, val] } });
    setNewAllowed('');
  };

  const handleAddBlocked = () => {
    const val = newBlocked.trim();
    if (!val || terminal.blockedCommands.includes(val)) return;
    updateAgentPermissions({ terminal: { ...terminal, blockedCommands: [...terminal.blockedCommands, val] } });
    setNewBlocked('');
  };

  return (
    <div className="space-y-4 p-1 select-none text-xs">
      {/* 1. Agent Execution Shell Environment Section */}
      <ExecutionEnvironmentSection />

      {/* 2. Execution Policy Mode */}
      <div className="space-y-1.5 pt-1 border-t border-subtle">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Shield size={13} className="text-primary" />
          <span>Terminal Execution Safeguard Policy</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['guarded', 'restricted', 'turbo'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              className={clsx(
                "p-2 rounded-xl border text-left transition-all cursor-pointer surface-card",
                terminal.executionMode === m ? "border-primary bg-primary/10 text-primary" : "border-subtle text-secondary hover:text-app-text"
              )}
            >
              <div className="font-semibold text-xs capitalize flex items-center gap-1">
                <Terminal size={12} /> {m}
              </div>
              <div className="text-[9.5px] text-muted mt-0.5">
                {m === 'guarded' ? 'Auto-block destructive operations (Default)' : (m === 'restricted' ? 'Ask confirmation for every command' : 'Fast automatic execution')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Whitelisted & Blacklisted Commands */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-subtle">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Pre-Approved Whitelist</label>
          <div className="flex flex-wrap gap-1 p-1.5 rounded-lg surface-card border border-subtle max-h-20 overflow-y-auto custom-scrollbar">
            {terminal.allowedCommands.map((cmd) => (
              <span key={cmd} className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                {cmd}
                <button type="button" onClick={() => updateAgentPermissions({ terminal: { ...terminal, allowedCommands: terminal.allowedCommands.filter(c => c !== cmd) } })} className="hover:text-red-400"><X size={10} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text" value={newAllowed} onChange={(e) => setNewAllowed(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllowed())}
              placeholder="Add command (pytest, git log)..."
              className="flex-1 surface-input px-2 py-1 rounded-lg text-[11px] font-mono border border-subtle text-app-text outline-none"
            />
            <button type="button" onClick={handleAddAllowed} className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1"><Plus size={11} /> Add</button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Blacklisted (Strictly Blocked)</label>
          <div className="flex flex-wrap gap-1 p-1.5 rounded-lg surface-card border border-subtle max-h-20 overflow-y-auto custom-scrollbar">
            {terminal.blockedCommands.map((cmd) => (
              <span key={cmd} className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/10 border border-rose-500/30 text-rose-300">
                {cmd}
                <button type="button" onClick={() => updateAgentPermissions({ terminal: { ...terminal, blockedCommands: terminal.blockedCommands.filter(c => c !== cmd) } })} className="hover:text-white"><X size={10} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text" value={newBlocked} onChange={(e) => setNewBlocked(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBlocked())}
              placeholder="Block command (rm -rf, mkfs)..."
              className="flex-1 surface-input px-2 py-1 rounded-lg text-[11px] font-mono border border-subtle text-app-text outline-none"
            />
            <button type="button" onClick={handleAddBlocked} className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1"><Plus size={11} /> Block</button>
          </div>
        </div>
      </div>
    </div>
  );
};
