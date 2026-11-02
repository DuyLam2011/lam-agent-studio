import React from 'react';
import { Compass, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { ClarificationOption } from '../../../services/agentClarificationService';
import { useAgentStore } from '../../../store/useAgentStore';

interface ClarificationCardProps {
  plan?: string[];
  options?: ClarificationOption[];
  riskAssessment?: string;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({
  plan = [],
  options = [],
  riskAssessment,
}) => {
  const { setPendingChatPrompt, addToast } = useAgentStore();

  const handleSelectOption = (opt: ClarificationOption) => {
    setPendingChatPrompt(opt.promptPayload);
    addToast(`Đã chọn ${opt.title}. Bấm Gửi để tiếp tục thực thi!`, 'info');
  };

  if (options.length === 0 && plan.length === 0) return null;

  return (
    <div className="my-2.5 rounded-2xl border border-primary/30 surface-card p-4 space-y-3.5 select-none shadow-xl">
      <div className="flex items-center justify-between pb-2.5 border-b border-subtle">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Compass size={16} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-app-text tracking-wide">
              Tư Vấn Quy Trình & Lựa Chọn Bước Thực Thi Tối Ưu (Grill-Me)
            </h4>
            <p className="text-[10.5px] text-muted">
              Định hướng các bước an toàn và giảm thiểu rủi ro trước khi thay đổi mã nguồn
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-2 py-0.5 rounded-full">
          <Sparkles size={11} /> Step Optimizer
        </span>
      </div>

      {/* Preliminary Execution Steps */}
      {plan.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            Các Bước Khuyến Nghị Thực Hiện (Recommended Steps):
          </div>
          <div className="space-y-1 pl-1">
            {plan.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-secondary leading-snug">
                <span className="w-4 h-4 rounded-full bg-white/5 border border-subtle text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5 text-primary">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {riskAssessment && (
        <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
          <ShieldCheck size={14} className="shrink-0 text-amber-400" />
          <span>{riskAssessment}</span>
        </div>
      )}

      {/* Interactive Options Cards */}
      {options.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Chọn Phương Án Bạn Muốn Agent Triển Khai (1-Click Selection):
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className="p-3 rounded-xl border border-subtle surface-card hover:border-primary hover:bg-primary/5 transition-all text-left flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-primary group-hover:text-primary-hover flex items-center gap-1">
                      Phương án {opt.id}
                    </span>
                    <ArrowRight size={12} className="text-muted group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="text-xs font-semibold text-app-text mb-1 leading-snug">{opt.title}</div>
                  <p className="text-[10px] text-muted line-clamp-2 leading-relaxed mb-2">{opt.description}</p>
                </div>
                <div className="text-[9.5px] font-mono text-emerald-400 pt-1.5 border-t border-subtle/50">
                  {opt.impact}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
