import React, { useState } from 'react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { Terminal, Shield, Plus, X } from 'lucide-react';
import clsx from 'clsx';

export const TerminalPermissionsTab: React.FC = () => {
  const { agentPermissions, updateAgentPermissions, addToast } = useAgentStore();
  const [newAllowed, setNewAllowed] = useState('');
  const [newBlocked, setNewBlocked] = useState('');
  const terminal = agentPermissions.terminal;

  const handleModeChange = (mode: 'restricted' | 'guarded' | 'turbo') => {
    updateAgentPermissions({ terminal: { ...terminal, executionMode: mode } });
    addToast(`Đã chuyển chế độ Terminal sang ${mode.toUpperCase()}`, 'info');
  };

  const handleAddAllowed = () => {
    const val = newAllowed.trim();
    if (!val || terminal.allowedCommands.includes(val)) return;
    updateAgentPermissions({
      terminal: { ...terminal, allowedCommands: [...terminal.allowedCommands, val] }
    });
    setNewAllowed('');
  };

  const handleRemoveAllowed = (cmd: string) => {
    updateAgentPermissions({
      terminal: { ...terminal, allowedCommands: terminal.allowedCommands.filter(c => c !== cmd) }
    });
  };

  const handleAddBlocked = () => {
    const val = newBlocked.trim();
    if (!val || terminal.blockedCommands.includes(val)) return;
    updateAgentPermissions({
      terminal: { ...terminal, blockedCommands: [...terminal.blockedCommands, val] }
    });
    setNewBlocked('');
  };

  const handleRemoveBlocked = (cmd: string) => {
    updateAgentPermissions({
      terminal: { ...terminal, blockedCommands: terminal.blockedCommands.filter(c => c !== cmd) }
    });
  };

  return (
    <div className="space-y-4 p-1">
      {/* Execution Policy Mode */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Shield size={13} className="text-primary" />
          Chế Độ Thực Thi Terminal (Execution Policy)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['guarded', 'restricted', 'turbo'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              className={clsx(
                "p-2.5 rounded-xl border text-left transition-all cursor-pointer surface-card",
                terminal.executionMode === m ? "border-primary bg-primary/10 text-primary" : "border-subtle text-secondary hover:text-app-text"
              )}
            >
              <div className="font-semibold text-xs capitalize flex items-center gap-1">
                <Terminal size={12} /> {m}
              </div>
              <div className="text-[10px] text-muted mt-0.5">
                {m === 'guarded' ? 'Tự chặn lệnh phá hủy (Khuyên dùng)' : (m === 'restricted' ? 'Hỏi từng lệnh' : 'Tự động chạy nhanh')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Allowed Whitelist Commands */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
          Danh Sách Lệnh Được Phép (Whitelisted Commands)
        </label>
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl surface-card border border-subtle max-h-32 overflow-y-auto custom-scrollbar">
          {terminal.allowedCommands.map((cmd) => (
            <span key={cmd} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              {cmd}
              <button type="button" onClick={() => handleRemoveAllowed(cmd)} className="hover:text-red-400 cursor-pointer">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newAllowed}
            onChange={(e) => setNewAllowed(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllowed())}
            placeholder="Thêm lệnh (ví dụ: pytest, cargo test, pip list)..."
            className="flex-1 surface-input px-3 py-1.5 rounded-lg text-xs font-mono border border-subtle text-app-text focus:outline-none focus:border-primary"
          />
          <button type="button" onClick={handleAddAllowed} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer">
            <Plus size={13} /> Thêm
          </button>
        </div>
      </div>

      {/* Blocked Commands */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
          Danh Sách Lệnh Tuyệt Đối Cấm (Blocked Commands)
        </label>
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl surface-card border border-subtle max-h-24 overflow-y-auto custom-scrollbar">
          {terminal.blockedCommands.map((cmd) => (
            <span key={cmd} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {cmd}
              <button type="button" onClick={() => handleRemoveBlocked(cmd)} className="hover:text-white cursor-pointer">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newBlocked}
            onChange={(e) => setNewBlocked(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBlocked())}
            placeholder="Thêm lệnh cấm (ví dụ: rm -rf *, format d:)..."
            className="flex-1 surface-input px-3 py-1.5 rounded-lg text-xs font-mono border border-subtle text-app-text focus:outline-none focus:border-rose-500"
          />
          <button type="button" onClick={handleAddBlocked} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1 cursor-pointer">
            <Plus size={13} /> Chặn
          </button>
        </div>
      </div>
    </div>
  );
};
