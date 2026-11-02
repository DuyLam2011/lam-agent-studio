import React, { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, X, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { SkillEvalSuite, SkillEvalReport } from '../../../../types/skill-eval';
import { DEFAULT_SKILL_EVAL_SUITES } from '../../../../data/skills/defaultSkillEvals';
import { runSkillEvaluationSuite } from '../../../../services/skills/skillEvalRunner';
import clsx from 'clsx';

interface SkillEvalDrawerProps {
  skillId: string;
  skillName: string;
  content: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrAnalysis: (report?: SkillEvalReport) => void;
}

export const SkillEvalDrawer: React.FC<SkillEvalDrawerProps> = ({
  skillId,
  skillName,
  content,
  isOpen,
  onClose,
  onOpenPrAnalysis
}) => {
  const [report, setReport] = useState<SkillEvalReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const suite: SkillEvalSuite = DEFAULT_SKILL_EVAL_SUITES[skillId] || {
    skillId,
    skillName,
    schemaVersion: '1.0.0',
    testCases: [
      {
        id: `tc-${skillId}-01`,
        name: 'Directive & Invariant Compliance',
        description: 'Verify agent output adheres to single responsibility and verification steps.',
        userPrompt: `Execute ${skillName} task for active workspace files.`,
        expectedBehavior: { mustInclude: ['verify', 'strict', 'rule'], mustNotInclude: ['// TODO', 'ignore'] }
      }
    ]
  };

  const handleRunEval = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runSkillEvaluationSuite(suite, content);
      setReport(res);
      setIsRunning(false);
    }, 150);
  };

  return (
    <div className="absolute inset-y-0 right-0 w-80 sm:w-96 surface-modal border-l border-subtle shadow-2xl flex flex-col z-30 animate-in slide-in-from-right duration-200">
      <div className="p-3.5 border-b border-subtle surface-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-primary" />
          <h4 className="text-xs font-semibold text-app-text">Skill Evaluation Suite (Eval Files)</h4>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-app-text hover:bg-primary/10 transition-colors cursor-pointer"><X size={15} /></button>
      </div>

      <div className="flex-1 p-3.5 overflow-y-auto custom-scrollbar space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted font-mono">{suite.testCases.length} Test Cases Có Sẵn</span>
          <button
            onClick={handleRunEval}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            {isRunning ? <Check size={12} className="animate-spin" /> : <Play size={12} />}
            <span>Chạy Eval File</span>
          </button>
        </div>

        {report && (
          <div className="surface-card p-3 rounded-xl border border-subtle space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-app-text">Kết Quả Đánh Giá:</span>
              <span className={clsx(
                "px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border",
                report.passRate === 100 ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-amber-500/15 text-amber-300 border-amber-500/30"
              )}>
                {report.passRate}% Pass ({report.passedCount}/{report.totalTests})
              </span>
            </div>

            <div className="space-y-1.5">
              {report.results.map((r) => (
                <div key={r.testCaseId} className="p-2 rounded-lg surface-input border border-subtle flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-app-text text-[11px] truncate">{r.name}</span>
                    <span className={clsx("text-[10px] font-mono font-bold flex items-center gap-0.5", r.passed ? "text-emerald-400" : "text-rose-400")}>
                      {r.passed ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />} {r.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  {r.failureReason && <span className="text-[10px] text-rose-300 font-mono">⚠️ {r.failureReason}</span>}
                  <div className="text-[9px] text-muted font-mono flex items-center justify-between">
                    <span>Điểm: {r.score}/100</span>
                    <span>~{r.tokensConsumed} tokens</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2 border-t border-subtle">
          <h5 className="font-semibold text-app-text text-[11px]">Danh Sách Kịch Bản Kiểm Định (Test Cases)</h5>
          {suite.testCases.map((tc) => (
            <div key={tc.id} className="p-2.5 rounded-xl surface-card border border-subtle space-y-1">
              <span className="font-mono text-[10px] text-primary font-bold">{tc.id} • {tc.name}</span>
              <p className="text-[10px] text-muted leading-relaxed">{tc.description}</p>
              <div className="text-[9px] text-muted font-mono flex items-center gap-1">
                <span>Must include: {tc.expectedBehavior.mustInclude?.slice(0, 3).join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-subtle surface-header flex items-center justify-between">
        <button
          onClick={() => onOpenPrAnalysis(report || undefined)}
          className="w-full py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ShieldAlert size={13} />
          <span>Phân Tích PR / Diff Thay Đổi</span>
        </button>
      </div>
    </div>
  );
};
