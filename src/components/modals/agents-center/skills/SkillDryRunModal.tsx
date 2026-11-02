import React, { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, X, Terminal, Cpu } from 'lucide-react';
import { simulateSkillRouting } from '../../../../services/skills/skillValidationService';
import { SkillDryRunResult } from '../../../../types/skill-studio';
import clsx from 'clsx';

interface SkillDryRunModalProps {
  skill: { name: string; description: string; content: string };
  isOpen: boolean;
  onClose: () => void;
}

export const SkillDryRunModal: React.FC<SkillDryRunModalProps> = ({ skill, isOpen, onClose }) => {
  const [testPrompt, setTestPrompt] = useState('Hãy review code vừa commit và kiểm tra vi phạm Rule 4');
  const [result, setResult] = useState<SkillDryRunResult | null>(null);

  if (!isOpen) return null;

  const handleSimulate = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!testPrompt.trim()) return;
    const sim = simulateSkillRouting(skill, testPrompt);
    setResult(sim);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <div className="surface-modal w-full max-w-lg p-5 rounded-2xl border border-subtle shadow-2xl flex flex-col gap-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-subtle surface-header">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-app-text">Kiểm Thử Kích Hoạt Skill (Dry-Run Simulator)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-app-text hover:bg-primary/10 transition-colors cursor-pointer"><X size={15} /></button>
        </div>

        <form onSubmit={handleSimulate} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-app-text block mb-1">Prompt Thử Nghiệm Từ Người Dùng</label>
            <textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Nhập câu lệnh mà người dùng có thể gửi vào ô chat..."
              rows={3}
              className="w-full surface-input border border-subtle rounded-xl p-2.5 text-xs text-app-text outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button type="submit" className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold flex items-center gap-1.5 shadow-md cursor-pointer">
              <Play size={12} /> Chạy Mô Phỏng Định Tuyến
            </button>
          </div>
        </form>

        {result && (
          <div className="space-y-2 pt-2 border-t border-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-app-text">Kết Quả Đánh Giá Tương Thích:</span>
              <span className={clsx(
                "px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border flex items-center gap-1",
                result.status === 'pass' ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : result.status === 'warning' ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-rose-500/15 text-rose-300 border-rose-500/30"
              )}>
                {result.status === 'pass' ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                Độ Khớp {result.routingConfidence}% ({result.status.toUpperCase()})
              </span>
            </div>

            <div className="surface-card p-2.5 rounded-xl border border-subtle space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-muted">Từ khóa phát hiện:</span>
                {result.matchedKeywords.length === 0 ? (
                  <span className="text-muted italic">Không có từ khóa trùng</span>
                ) : (
                  result.matchedKeywords.map((k: string) => (
                    <span key={k} className="px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-mono text-[10px]">{k}</span>
                  ))
                )}
              </div>

              <div className="text-muted leading-relaxed">
                {result.diagnosticNotes.map((n: string, i: number) => <p key={i}>• {n}</p>)}
              </div>

              <div className="text-[10px] text-muted font-mono pt-1 border-t border-subtle flex items-center gap-1">
                <Cpu size={11} className="text-primary" /> Tiêu thụ ước tính khi nạp vào system context: ~{result.estimatedTokens} tokens
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
