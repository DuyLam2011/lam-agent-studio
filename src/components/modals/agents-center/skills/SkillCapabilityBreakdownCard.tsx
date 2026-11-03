import React from 'react';
import { SkillCapabilityAnalysis } from '../../../../types/skill-analytic';
import { Cpu, Zap, ShieldAlert, CheckCircle2, Terminal } from 'lucide-react';

interface SkillCapabilityBreakdownCardProps {
  analysis: SkillCapabilityAnalysis;
}

export const SkillCapabilityBreakdownCard: React.FC<SkillCapabilityBreakdownCardProps> = ({ analysis }) => {
  return (
    <div className="surface-card rounded-xl border border-cyan-500/30 p-3.5 space-y-3 bg-cyan-950/10">
      <div className="flex items-center justify-between border-b border-subtle pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Cpu size={14} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-app-text">What This Skill Can Do (Capability Breakdown)</h4>
            <p className="text-[10px] text-muted">Synthesized by Analytic Agent • 100% English Specification</p>
          </div>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 uppercase">
          Analytic Verified
        </span>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Primary Role</span>
        <p className="text-xs text-app-text font-medium leading-snug">{analysis.primaryRole}</p>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Supported Triggers</span>
        <div className="flex flex-wrap gap-1.5">
          {analysis.supportedTriggers.map((t, i) => (
            <span key={i} className="font-mono text-[10px] px-2 py-0.5 rounded-lg surface-input border border-subtle text-primary font-bold">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Key Workflow Responsibilities</span>
        <ul className="space-y-1 text-[11px] text-app-text">
          {analysis.keyResponsibilities.map((r, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Zap size={12} className="text-cyan-400 shrink-0 mt-0.5" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
            <Terminal size={11} className="text-cyan-400" /> Authorized Toolchain
          </span>
          <div className="flex flex-wrap gap-1">
            {analysis.orchestratedTools.map((tool, i) => (
              <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-secondary">
                {tool}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert size={11} className="text-amber-400" /> Safety Boundaries
          </span>
          <div className="space-y-0.5 text-[10px] text-amber-300">
            {analysis.safetyBoundaries.slice(0, 2).map((s, i) => (
              <div key={i} className="truncate">• {s}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1 pt-1 border-t border-subtle">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Expected Deliverables</span>
        <div className="space-y-0.5 text-[10px] text-emerald-300">
          {analysis.expectedOutputs.map((o, i) => (
            <div key={i} className="flex items-center gap-1">
              <CheckCircle2 size={10} className="shrink-0 text-emerald-400" />
              <span>{o}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
