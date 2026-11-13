import React from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { detectConnectedPackages } from '../../../services/subagents/subagentPackageResolver';
import { Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';

export const ConnectedPackagesBar: React.FC = () => {
  const store = useAgentStore();
  const packages = detectConnectedPackages(store);

  return (
    <div className="px-4 py-2 surface-card border-b border-subtle flex items-center justify-between gap-2 flex-wrap text-xs">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10.5px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1 mr-1">
          <Sparkles size={11} className="text-primary" /> Gói Đã Kết Nối (Auto-Router Pool):
        </span>
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={clsx(
              "px-2 py-0.5 rounded-full border text-[10px] font-mono flex items-center gap-1 transition-all",
              pkg.connected
                ? `${pkg.colorClass} shadow-xs font-semibold`
                : "border-white/5 bg-white/[0.02] text-gray-500 opacity-60"
            )}
            title={pkg.connected ? `${pkg.name}: Sẵn sàng định tuyến subagent` : `${pkg.name}: Chưa kết nối (Bỏ qua định tuyến)`}
          >
            {pkg.connected ? (
              <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
            ) : (
              <XCircle size={10} className="text-gray-500 shrink-0" />
            )}
            <span>{pkg.name}</span>
            <span className="text-[9px] opacity-75">({pkg.connected ? 'Active' : 'Offline'})</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-[9.5px] font-semibold">
          🎯 Auto-Router: Chỉ chọn trong gói Active
        </span>
      </div>
    </div>
  );
};
