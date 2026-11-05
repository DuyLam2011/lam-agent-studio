import React, { useState } from 'react';
import { Compass, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Edit3, Loader2 } from 'lucide-react';
import { ClarificationOption } from '../../../services/advisory/agentClarificationService';
import { useAgentStore } from '../../../store/useAgentStore';
import { sendChatMessage } from '../../../services/agent-chat/agentRunService';
import clsx from 'clsx';

interface ClarificationCardProps {
  plan?: string[];
  options?: ClarificationOption[];
  riskAssessment?: string;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({ plan = [], options = [], riskAssessment }) => {
  const { setChatInputDraft, addToast } = useAgentStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  if (options.length === 0 && plan.length === 0) return null;
  const isVi = options.some(o => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(o.title || ''));

  const handleSelectOption = async (opt: ClarificationOption) => {
    if (isExecuting) return;
    setSelectedId(opt.id);
    setIsExecuting(true);
    addToast(isVi ? `Đã chọn ${opt.title}. Đang thực thi...` : `Selected ${opt.title}. Executing...`, 'info');
    try {
      await sendChatMessage(opt.promptPayload);
    } catch (err: any) {
      addToast(err?.message || 'Failed to dispatch option', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleEditDraft = (e: React.MouseEvent, opt: ClarificationOption) => {
    e.stopPropagation();
    setChatInputDraft(opt.promptPayload);
    addToast(isVi ? 'Đã đưa vào ô chat để sửa' : 'Drafted into chat input for editing', 'info');
  };

  return (
    <div className="my-2.5 rounded-2xl border border-primary/30 surface-card p-4 space-y-3 shadow-xl">
      <div className="flex items-center justify-between pb-2 border-b border-subtle">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><Compass size={16} /></div>
          <div>
            <h4 className="text-xs font-semibold text-app-text tracking-wide">
              {isVi ? 'Tư Vấn Quy Trình & Làm Rõ (Grill-Me)' : 'Grill-Me Step Advisory & Clarification'}
            </h4>
            <p className="text-[10px] text-muted">
              {isVi ? 'Tối ưu ngữ cảnh & chọn hướng thực thi an toàn' : 'Optimize context & select an execution path before mutating code'}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-2 py-0.5 rounded-full">
          <Sparkles size={11} /> Step Optimizer
        </span>
      </div>

      {plan.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            {isVi ? 'Các Bước Khuyến Nghị Thực Hiện:' : 'Recommended Execution Steps:'}
          </div>
          <div className="space-y-0.5 pl-1">
            {plan.map((step, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs text-secondary leading-snug">
                <span className="w-3.5 h-3.5 rounded-full bg-white/5 border border-subtle text-[9px] font-mono flex items-center justify-center shrink-0 mt-0.5 text-primary">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {riskAssessment && (
        <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
          <ShieldCheck size={14} className="shrink-0 text-amber-400" />
          <span>{riskAssessment}</span>
        </div>
      )}

      {options.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            {isVi ? 'Chọn Phương Án Bạn Muốn Agent Triển Khai (1-Click Selection):' : 'Select an Option to Execute (1-Click Selection):'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {options.map((opt) => {
              const isSelected = selectedId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isExecuting}
                  onClick={() => handleSelectOption(opt)}
                  className={clsx(
                    "p-3 rounded-xl border text-left flex flex-col justify-between group transition-all cursor-pointer relative",
                    isSelected ? "border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/30" : "border-subtle surface-card hover:border-primary hover:bg-primary/5"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={clsx("font-bold text-xs flex items-center gap-1", isSelected ? "text-emerald-400" : "text-primary group-hover:text-primary-hover")}>
                        {isSelected ? <CheckCircle2 size={13} className="text-emerald-400" /> : null}
                        {isVi ? `Phương án ${opt.id}` : `Option ${opt.id}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleEditDraft(e, opt)}
                          title={isVi ? "Đưa vào ô chat để sửa" : "Edit in chat"}
                          className="p-1 rounded hover:bg-white/10 text-muted hover:text-app-text transition-colors cursor-pointer"
                        >
                          <Edit3 size={11} />
                        </button>
                        {isExecuting && isSelected ? <Loader2 size={12} className="animate-spin text-emerald-400" /> : <ArrowRight size={12} className="text-muted group-hover:text-primary transition-transform group-hover:translate-x-0.5" />}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-app-text mb-0.5 leading-snug">{opt.title}</div>
                    <p className="text-[10px] text-muted line-clamp-2 leading-relaxed mb-1.5">{opt.description}</p>
                  </div>
                  <div className={clsx("text-[9px] font-mono pt-1 border-t border-subtle/50", isSelected ? "text-emerald-300 font-semibold" : "text-emerald-400")}>
                    {isSelected ? (isVi ? '✓ Đang chạy' : '✓ Executing choice') : opt.impact}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
