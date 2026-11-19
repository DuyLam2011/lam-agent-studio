import React, { useState } from 'react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { Lock, Globe, Plus, X, Cpu } from 'lucide-react';
import { SandboxRunnerSection } from './SandboxRunnerSection';
import clsx from 'clsx';

export const FileSandboxTab: React.FC = () => {
  const { agentPermissions, updateAgentPermissions, addToast } = useAgentStore();
  const [newDomain, setNewDomain] = useState('');
  const sandbox = agentPermissions.sandbox;

  const update = (patch: Partial<typeof sandbox>) => {
    updateAgentPermissions({ sandbox: { ...sandbox, ...patch } });
  };

  const handleAddDomain = () => {
    const val = newDomain.trim().toLowerCase();
    if (!val || (sandbox.allowedOutboundDomains || []).includes(val)) return;
    update({ allowedOutboundDomains: [...(sandbox.allowedOutboundDomains || []), val] });
    setNewDomain('');
    addToast(`Added allowed domain: ${val}`, 'success');
  };

  const handleRemoveDomain = (dom: string) => {
    update({ allowedOutboundDomains: (sandbox.allowedOutboundDomains || []).filter(d => d !== dom) });
  };

  return (
    <div className="space-y-3.5 p-1 select-none text-xs">
      {/* Sandbox Isolation Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl surface-card border border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-app-text text-[11px]">Strict Workspace Isolation</div>
              <div className="text-[9.5px] text-muted">Strictly blocks read/write access outside the workspace</div>
            </div>
          </div>
          <button type="button" onClick={() => update({ sandboxStrict: !sandbox.sandboxStrict })} className={clsx("w-9 h-5 rounded-full transition-colors relative cursor-pointer border border-subtle", sandbox.sandboxStrict ? "bg-emerald-600" : "bg-white/10")}>
            <span className={clsx("block w-3 h-3 rounded-full bg-white transition-transform transform shadow-sm", sandbox.sandboxStrict ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </div>

        <div className="p-2.5 rounded-xl surface-card border border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={15} className="text-cyan-400 shrink-0" />
            <div>
              <div className="font-semibold text-app-text text-[11px]">Strip Sensitive Environment (Secrets)</div>
              <div className="text-[9.5px] text-muted">Automatically sanitize API keys & tokens from sandbox process.env</div>
            </div>
          </div>
          <button type="button" onClick={() => update({ stripSensitiveEnvInSandbox: !sandbox.stripSensitiveEnvInSandbox })} className={clsx("w-9 h-5 rounded-full transition-colors relative cursor-pointer border border-subtle", sandbox.stripSensitiveEnvInSandbox ? "bg-cyan-600" : "bg-white/10")}>
            <span className={clsx("block w-3 h-3 rounded-full bg-white transition-transform transform shadow-sm", sandbox.stripSensitiveEnvInSandbox ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </div>
      </div>

      {/* Outbound Link Policy */}
      <div className="p-3 rounded-xl surface-card border border-subtle space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-primary" />
            <span className="font-semibold text-[11px] text-app-text uppercase tracking-wider">Outbound Network & Link Policy</span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-[10.5px] text-muted">
            <input type="checkbox" checked={sandbox.blockOutboundLinks} onChange={(e) => update({ blockOutboundLinks: e.target.checked })} className="rounded border-subtle text-rose-500 cursor-pointer" />
            <span>Block all outbound URLs</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-1 p-1.5 rounded-lg bg-black/30 border border-subtle max-h-20 overflow-y-auto custom-scrollbar">
          {(sandbox.allowedOutboundDomains || ['localhost:*', '127.0.0.1:*', 'github.com', 'npmjs.com']).map((dom) => (
            <span key={dom} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/10 border border-primary/20 text-primary">
              {dom}
              <button type="button" onClick={() => handleRemoveDomain(dom)} className="hover:text-rose-400 cursor-pointer"><X size={9} /></button>
            </span>
          ))}
        </div>

        <div className="flex gap-1.5">
          <input
            type="text" value={newDomain} onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDomain())}
            placeholder="Add allowed domain (e.g. api.anthropic.com, *.github.com)..."
            className="flex-1 surface-input px-2.5 py-1 rounded-lg text-[11px] font-mono border border-subtle text-app-text outline-none"
          />
          <button type="button" onClick={handleAddDomain} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary hover:bg-primary-hover text-white flex items-center gap-1 cursor-pointer">
            <Plus size={11} /><span>Add</span>
          </button>
        </div>
      </div>

      {/* Interactive Sandbox Test Runner */}
      <SandboxRunnerSection />
    </div>
  );
};
