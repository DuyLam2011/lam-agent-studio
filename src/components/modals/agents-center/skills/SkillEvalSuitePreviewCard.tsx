import React from 'react';
import { SkillEvalSuite } from '../../../../types/skill-eval';
import { FlaskConical, CheckCircle, Ban, Gauge } from 'lucide-react';

interface SkillEvalSuitePreviewCardProps {
  suite: SkillEvalSuite;
}

export const SkillEvalSuitePreviewCard: React.FC<SkillEvalSuitePreviewCardProps> = ({ suite }) => {
  return (
    <div className="surface-card rounded-xl border border-emerald-500/30 p-3.5 space-y-3 bg-emerald-950/10">
      <div className="flex items-center justify-between border-b border-subtle pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <FlaskConical size={14} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-app-text">Generated Evaluation Test Suite</h4>
            <p className="text-[10px] text-muted">{suite.testCases.length} Deterministic Test Cases Ready to Run</p>
          </div>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
          EVAL FILE READY
        </span>
      </div>

      <div className="space-y-2">
        {suite.testCases.map((tc) => (
          <div key={tc.id} className="p-2.5 rounded-lg surface-input border border-subtle space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-primary font-bold">{tc.id}</span>
              <span className="font-semibold text-app-text text-[11px] truncate">{tc.name}</span>
            </div>
            <p className="text-[10px] text-muted italic">"{tc.userPrompt}"</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 border-t border-subtle text-[10px]">
              <div>
                <span className="text-muted block text-[9px] font-medium flex items-center gap-0.5">
                  <CheckCircle size={9} className="text-emerald-400" /> Must Include
                </span>
                <span className="font-mono text-emerald-300 text-[10px]">
                  {tc.expectedBehavior.mustInclude?.join(', ') || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted block text-[9px] font-medium flex items-center gap-0.5">
                  <Ban size={9} className="text-rose-400" /> Must Not Include
                </span>
                <span className="font-mono text-rose-300 text-[10px]">
                  {tc.expectedBehavior.mustNotInclude?.join(', ') || 'None'}
                </span>
              </div>
              <div>
                <span className="text-muted block text-[9px] font-medium flex items-center gap-0.5">
                  <Gauge size={9} className="text-cyan-400" /> Max Budget
                </span>
                <span className="font-mono text-cyan-300 text-[10px]">
                  ~{tc.expectedBehavior.maxTokens || 500} tokens
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
