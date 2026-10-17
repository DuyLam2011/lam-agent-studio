import React from 'react';
import { ShieldCheck, X, RefreshCw } from 'lucide-react';
import { useRulesetStore, ComplianceMode } from '../../../store/useRulesetStore';
import clsx from 'clsx';

interface SecurityHeaderProps {
  onClose: () => void;
  onRefresh: () => void;
  isScanning: boolean;
  overallScore: number;
}

export const SecurityHeader: React.FC<SecurityHeaderProps> = ({ onClose, onRefresh, isScanning, overallScore }) => {
  const { complianceMode, setComplianceMode } = useRulesetStore();

  return (
    <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0 gap-3">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg">
          <ShieldCheck size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">AI Security & Harness Inspector</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Safety Score: {overallScore}/100
            </span>
          </div>
          <p className="text-[10px] text-gray-400">Strict Directive Enforcement • Anti-Injection • MCP & Skill Quarantine</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Compliance Mode Toggle */}
        <div className="flex items-center bg-white/5 p-0.5 rounded-xl border border-white/10 text-[10px]">
          {(['strict', 'permissive', 'quarantine'] as ComplianceMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setComplianceMode(mode)}
              className={clsx(
                "px-2.5 py-1 rounded-lg font-medium transition-all capitalize",
                complianceMode === mode
                  ? "bg-emerald-500 text-black font-bold shadow-md"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        <button
          onClick={onRefresh}
          disabled={isScanning}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
          title="Re-scan all items"
        >
          <RefreshCw size={13} className={clsx(isScanning && "animate-spin text-emerald-400")} />
        </button>

        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          title="Close Inspector"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
