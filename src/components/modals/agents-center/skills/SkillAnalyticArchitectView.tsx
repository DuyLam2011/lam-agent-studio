import React, { useState } from 'react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { resolveWorkspaceRepoInfo } from '../../../../services/workspace/workspaceRepoResolver';
import { synthesizeSkillWithAnalyticAgent } from '../../../../services/skills/skillAnalyticSynthesizer';
import { AnalyticSkillSynthesisResult } from '../../../../types/skill-analytic';
import { SkillCapabilityBreakdownCard } from './SkillCapabilityBreakdownCard';
import { SkillEvalSuitePreviewCard } from './SkillEvalSuitePreviewCard';
import { LineChart, FolderGit2, Check, ArrowRight, Sparkles } from 'lucide-react';

interface SkillAnalyticArchitectViewProps {
  onApplyDraft: (res: AnalyticSkillSynthesisResult) => void;
  onCancel: () => void;
}

export const SkillAnalyticArchitectView: React.FC<SkillAnalyticArchitectViewProps> = ({ onApplyDraft, onCancel }) => {
  const { systemContext, addToast } = useAgentStore();
  const activeWs = systemContext.workspaces.find(w => w.id === systemContext.activeWorkspaceId) || systemContext.workspaces[0];
  const [selectedWsId, setSelectedWsId] = useState<string>(activeWs?.id || '');
  const [selectedRepoPath, setSelectedRepoPath] = useState<string>(activeWs?.folders?.[0] || systemContext.cwd || '');

  const [projectWorkDirection, setProjectWorkDirection] = useState('Refactoring backend API routes to strict TypeScript, eliminating any types and adding runtime Zod validation.');
  const [desiredSkillObjectives, setDesiredSkillObjectives] = useState('Audit API endpoints for loose types, enforce single responsibility and generate regression test fixtures.');
  const [qualityInvariants, setQualityInvariants] = useState('Rule 4 decompose <150 lines, verify via npx tsc --noEmit, never mutate .env or delete files without prompt.');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState<AnalyticSkillSynthesisResult | null>(null);

  const currentWs = systemContext.workspaces.find(w => w.id === selectedWsId) || activeWs;
  const repoInfo = resolveWorkspaceRepoInfo(selectedRepoPath, systemContext.workspaces, currentWs?.id, systemContext.cwd);

  const handleSynthesize = () => {
    if (!projectWorkDirection.trim() || !desiredSkillObjectives.trim() || !qualityInvariants.trim()) {
      return addToast('Vui lòng điền đầy đủ cả 3 đề mục (Bối cảnh, Nhiệm vụ mong muốn & Ràng buộc an toàn)', 'error');
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      const res = synthesizeSkillWithAnalyticAgent({
        workspaceId: currentWs?.id || 'ws-default',
        workspaceName: repoInfo.workspaceName,
        targetRepoPath: repoInfo.repoRoot || selectedRepoPath,
        targetRepoName: repoInfo.repoName,
        contextTag: repoInfo.formattedTag,
        projectWorkDirection,
        desiredSkillObjectives,
        qualityInvariants
      });
      setSynthesisResult(res);
      setIsAnalyzing(false);
      addToast('Analytic Agent đã quét repo và thiết kế Skill + Eval Suite hoàn chỉnh bằng tiếng Anh!', 'success');
    }, 200);
  };

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar p-1 text-xs">
      <div className="surface-card p-3 rounded-xl border border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FolderGit2 size={15} className="text-primary shrink-0" />
          <div>
            <div className="font-semibold text-app-text flex items-center gap-1.5">
              <span>Target Workspace & Repository Focus</span>
              <span className="font-mono text-[10px] text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">{repoInfo.formattedTag}</span>
            </div>
            <p className="text-[10px] text-muted">Skill sẽ được liên kết và thiết kế đo ni đóng giày cho repo đích</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <select value={selectedWsId} onChange={(e) => { setSelectedWsId(e.target.value); const w = systemContext.workspaces.find(x => x.id === e.target.value); if (w?.folders?.[0]) setSelectedRepoPath(w.folders[0]); }} className="surface-input border border-subtle rounded-lg px-2 py-1 text-xs text-app-text outline-none cursor-pointer">
            {systemContext.workspaces.map(w => <option key={w.id} value={w.id}>{w.name || 'Workspace'}</option>)}
          </select>
          <select value={selectedRepoPath} onChange={(e) => setSelectedRepoPath(e.target.value)} className="surface-input border border-subtle rounded-lg px-2 py-1 text-xs text-app-text outline-none cursor-pointer">
            {(currentWs?.folders || [systemContext.cwd]).map(f => <option key={f} value={f}>{f.split(/[/\\]/).pop() || f}</option>)}
          </select>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center gap-2.5 text-cyan-300">
        <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0"><LineChart size={15} /></div>
        <div className="text-[11px] leading-snug">
          <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/25 border border-cyan-500/30 mr-1.5">Subagent Class: ANALYTIC</span>
          Chuyên gia phân tích sẽ quét repo, bóc tách capabilities và tự động sinh bản thiết kế Skill kèm bộ Eval hoàn toàn bằng tiếng Anh.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-app-text uppercase tracking-wider flex items-center gap-1"><span>1. Project Work Direction</span></label>
          <textarea value={projectWorkDirection} onChange={(e) => setProjectWorkDirection(e.target.value)} rows={3} className="w-full surface-input border border-subtle rounded-xl p-2.5 text-xs text-app-text leading-relaxed outline-none focus:border-cyan-500 resize-none custom-scrollbar" placeholder="Bối cảnh dự án & công việc đang hướng tới..." />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-app-text uppercase tracking-wider flex items-center gap-1"><span>2. Desired Skill Objectives</span></label>
          <textarea value={desiredSkillObjectives} onChange={(e) => setDesiredSkillObjectives(e.target.value)} rows={3} className="w-full surface-input border border-subtle rounded-xl p-2.5 text-xs text-app-text leading-relaxed outline-none focus:border-cyan-500 resize-none custom-scrollbar" placeholder="Kỹ năng, workflow & nhiệm vụ mong muốn..." />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-app-text uppercase tracking-wider flex items-center gap-1"><span>3. Invariants & Safety Constraints</span></label>
          <textarea value={qualityInvariants} onChange={(e) => setQualityInvariants(e.target.value)} rows={3} className="w-full surface-input border border-subtle rounded-xl p-2.5 text-xs text-app-text leading-relaxed outline-none focus:border-cyan-500 resize-none custom-scrollbar" placeholder="Ràng buộc chất lượng, an toàn & tiêu chí kiểm định..." />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button onClick={handleSynthesize} disabled={isAnalyzing} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer">
            {isAnalyzing ? <Check size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{isAnalyzing ? 'Analytic Agent Đang Phân Tích & Quét Repo...' : 'Quét Repo & Thiết Kế Skill (Analytic Agent)'}</span>
          </button>
          <button onClick={onCancel} className="px-3 py-2 rounded-xl text-muted hover:text-app-text hover:bg-white/5 transition-colors cursor-pointer">
            Quay Lại
          </button>
        </div>
        {synthesisResult && (
          <button onClick={() => onApplyDraft(synthesisResult)} className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer">
            <span>Áp Dụng Vào Editor & Lưu</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {synthesisResult && (
        <div className="space-y-3 pt-2 border-t border-subtle">
          <SkillCapabilityBreakdownCard analysis={synthesisResult.capabilityAnalysis} />
          <SkillEvalSuitePreviewCard suite={synthesisResult.generatedEvalSuite} />
        </div>
      )}
    </div>
  );
};
