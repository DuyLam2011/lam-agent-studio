import React, { useState } from 'react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { ShieldAlert, Lock, Plus, X, HardDrive } from 'lucide-react';
import clsx from 'clsx';

export const FileSandboxTab: React.FC = () => {
  const { agentPermissions, updateAgentPermissions, addToast } = useAgentStore();
  const [newPattern, setNewPattern] = useState('');
  const sandbox = agentPermissions.sandbox;

  const handleToggleStrict = () => {
    updateAgentPermissions({
      sandbox: { ...sandbox, sandboxStrict: !sandbox.sandboxStrict }
    });
    addToast(`Sandbox updated: ${!sandbox.sandboxStrict ? 'Strict Isolation ON' : 'Strict Isolation OFF'}`, 'info');
  };

  const handleAddPattern = () => {
    const val = newPattern.trim();
    if (!val || sandbox.quarantinePatterns.includes(val)) return;
    updateAgentPermissions({
      sandbox: { ...sandbox, quarantinePatterns: [...sandbox.quarantinePatterns, val] }
    });
    setNewPattern('');
  };

  const handleRemovePattern = (pat: string) => {
    updateAgentPermissions({
      sandbox: { ...sandbox, quarantinePatterns: sandbox.quarantinePatterns.filter(p => p !== pat) }
    });
  };

  const handleSizeChange = (bytes: number) => {
    updateAgentPermissions({
      sandbox: { ...sandbox, maxFileSizeBytes: bytes }
    });
    addToast(`Max file read limit: ${(bytes / (1024 * 1024)).toFixed(0)}MB`, 'info');
  };

  return (
    <div className="space-y-4 p-1 select-none">
      {/* Strict Workspace Isolation */}
      <div className="p-3.5 rounded-xl surface-card border border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Lock size={18} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-app-text">Workspace Boundary Isolation (Strict Sandbox)</h4>
            <p className="text-[11px] text-muted">Strictly prevents Agent from accessing or mutating files outside workspace directories</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggleStrict}
          className={clsx(
            "w-11 h-6 rounded-full transition-colors relative cursor-pointer border border-subtle",
            sandbox.sandboxStrict ? "bg-emerald-600" : "bg-white/10"
          )}
        >
          <span className={clsx(
            "block w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm",
            sandbox.sandboxStrict ? "translate-x-6" : "translate-x-1"
          )} />
        </button>
      </div>

      {/* Quarantine Patterns */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert size={13} />
          Quarantined Sensitive File Patterns
        </label>
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl surface-card border border-subtle max-h-28 overflow-y-auto custom-scrollbar">
          {sandbox.quarantinePatterns.map((pat) => (
            <span key={pat} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300">
              {pat}
              <button type="button" onClick={() => handleRemovePattern(pat)} className="hover:text-red-400 cursor-pointer">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPattern())}
            placeholder="Add sensitive pattern (e.g. **/*.pem, **/.secret, **/.env*)..."
            className="flex-1 surface-input px-3 py-1.5 rounded-lg text-xs font-mono border border-subtle text-app-text focus:outline-none focus:border-amber-400"
          />
          <button type="button" onClick={handleAddPattern} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 cursor-pointer">
            <Plus size={13} /> Quarantine
          </button>
        </div>
      </div>

      {/* Max File Size */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <HardDrive size={13} className="text-primary" />
          Maximum File Size Threshold (Read Limit)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[1048576, 2097152, 5242880, 10485760].map((bytes) => {
            const mb = bytes / (1024 * 1024);
            const isSelected = sandbox.maxFileSizeBytes === bytes;
            return (
              <button
                key={bytes}
                type="button"
                onClick={() => handleSizeChange(bytes)}
                className={clsx(
                  "py-2 px-3 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer surface-card text-center",
                  isSelected ? "border-primary bg-primary/10 text-primary font-bold" : "border-subtle text-secondary hover:text-app-text"
                )}
              >
                {mb} MB
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
