import React from 'react';
import { X, Save, Sparkles, BookTemplate, Play, Wrench, Check, FlaskConical } from 'lucide-react';
import { AgentSkill } from '../../../../types/skills';
import { validateSkillQuality } from '../../../../services/skills/skillValidationService';
import { SkillLinterBar } from './SkillLinterBar';
import { SkillTemplatesDrawer } from './SkillTemplatesDrawer';
import { SkillDryRunModal } from './SkillDryRunModal';
import { SkillEvalDrawer } from './SkillEvalDrawer';
import { SkillPrDiffModal } from './SkillPrDiffModal';
import { SkillStudioFormFields } from './SkillStudioFormFields';
import { useSkillStudioState } from './useSkillStudioState';

interface SkillStudioModalProps {
  skill: AgentSkill | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SkillStudioModal: React.FC<SkillStudioModalProps> = ({ skill, isOpen, onClose }) => {
  const {
    formData, setFormData, isDrawerOpen, setDrawerOpen,
    isDryRunOpen, setDryRunOpen, isEvalOpen, setEvalOpen,
    isPrDiffOpen, setPrDiffOpen, evalReport, handleOpenPrAnalysis,
    originalContent, isSaving, handleApplyTemplate,
    handleAiPolish, handleSave
  } = useSkillStudioState(skill, isOpen, onClose);

  if (!isOpen) return null;

  const qualityReport = validateSkillQuality(formData.content, formData.name, formData.description);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <div className="surface-modal w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-xs shadow-2xl relative">
        <div className="p-3.5 border-b border-subtle surface-header flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/15 text-primary border border-primary/25"><Wrench size={16} /></div>
            <div>
              <h3 className="font-bold text-app-text text-sm">{skill ? `Skill Studio: ${formData.name}` : 'Skill Studio: Tạo Skill Mới'}</h3>
              <p className="text-[11px] text-muted">Bộ công cụ thiết kế, chuẩn hóa và kiểm định Agent Skill</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setDrawerOpen(true)} className="px-2 py-1 rounded-lg surface-card border border-subtle text-secondary hover:text-app-text flex items-center gap-1 cursor-pointer font-medium"><BookTemplate size={12} /> Templates</button>
            <button onClick={handleAiPolish} className="px-2 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 flex items-center gap-1 cursor-pointer font-medium"><Sparkles size={12} /> AI Chuẩn Hóa</button>
            <button onClick={() => setDryRunOpen(true)} className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 cursor-pointer font-medium"><Play size={12} /> Dry-Run</button>
            <button onClick={() => setEvalOpen(true)} className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 cursor-pointer font-medium"><FlaskConical size={12} /> Eval & PR</button>
            <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-app-text hover:bg-primary/10 transition-colors cursor-pointer ml-1"><X size={16} /></button>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
          <SkillLinterBar report={qualityReport} />
          <SkillStudioFormFields formData={formData} onChange={(p) => setFormData((prev: any) => ({ ...prev, ...p }))} />
          <div className="flex-1 flex flex-col min-h-[220px]">
            <label className="text-[10px] font-semibold text-app-text uppercase tracking-wider block mb-1">Chỉ Thị & Quy Trình Thao Tác (SKILL.md)</label>
            <textarea value={formData.content} onChange={(e) => setFormData((prev: any) => ({ ...prev, content: e.target.value }))} className="flex-1 w-full surface-input border border-subtle rounded-xl p-3 text-xs text-app-text font-mono leading-relaxed outline-none focus:border-primary transition-colors resize-none custom-scrollbar" placeholder="# Tên Skill..." />
          </div>
        </div>

        <div className="p-3.5 border-t border-subtle surface-header flex items-center justify-between">
          <div className="text-[11px] text-muted font-mono">{formData.scope.toUpperCase()} SCOPE {skill?.filePath ? `• ${skill.filePath.split(/[/\\]/).pop()}` : ''}</div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3.5 py-1.5 rounded-xl text-muted hover:text-app-text hover:bg-primary/10 transition-colors cursor-pointer">Hủy</button>
            <button onClick={handleSave} disabled={isSaving} className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer">
              {isSaving ? <Check size={13} className="animate-spin" /> : <Save size={13} />}
              <span>{skill?.filePath ? 'Lưu & Đồng Bộ SKILL.md' : 'Lưu Skill'}</span>
            </button>
          </div>
        </div>
        <SkillTemplatesDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} onSelectTemplate={handleApplyTemplate} />
        <SkillDryRunModal skill={{ name: formData.name, description: formData.description, content: formData.content }} isOpen={isDryRunOpen} onClose={() => setDryRunOpen(false)} />
        <SkillEvalDrawer skillId={formData.folderName || formData.name} skillName={formData.name} content={formData.content} isOpen={isEvalOpen} onClose={() => setEvalOpen(false)} onOpenPrAnalysis={handleOpenPrAnalysis} />
        <SkillPrDiffModal isOpen={isPrDiffOpen} onClose={() => setPrDiffOpen(false)} oldContent={originalContent} newContent={formData.content} skillName={formData.name} evalReport={evalReport} />
      </div>
    </div>
  );
};
