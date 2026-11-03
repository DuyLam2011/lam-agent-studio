import { useState, useEffect } from 'react';
import { AgentSkill } from '../../../../types/skills';
import { SkillStudioFormData, SkillTemplate } from '../../../../types/skill-studio';
import { SkillEvalReport } from '../../../../types/skill-eval';
import { AnalyticSkillSynthesisResult } from '../../../../types/skill-analytic';
import { DEFAULT_SKILL_EVAL_SUITES } from '../../../../data/skills/defaultSkillEvals';
import { useAgentStore } from '../../../../store/useAgentStore';
import { serializeSkillMarkdown } from '../../../../services/skills/skillValidationService';
import { polishSkillContent } from '../../../../services/skills/skillAiAssistantService';

export const useSkillStudioState = (skill: AgentSkill | null, isOpen: boolean, onClose: () => void) => {
  const { updateSkill, addSkill, addToast, currentRuleScope, systemContext } = useAgentStore();
  const [formData, setFormData] = useState<SkillStudioFormData>({
    name: '', folderName: '', description: '', content: '', category: 'workflow', scope: 'global'
  });
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isDryRunOpen, setDryRunOpen] = useState(false);
  const [isEvalOpen, setEvalOpen] = useState(false);
  const [isPrDiffOpen, setPrDiffOpen] = useState(false);
  const [isAnalyticMode, setAnalyticMode] = useState(false);
  const [evalReport, setEvalReport] = useState<SkillEvalReport | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (skill) {
      setFormData({
        name: skill.name,
        folderName: skill.folderName || skill.name.toLowerCase().replace(/[^a-z0-9_\-]/g, '_'),
        description: skill.description || '',
        content: skill.content || '',
        category: skill.category || 'workflow',
        scope: skill.scope,
        targetId: skill.targetId
      });
    } else {
      const initFolder = 'custom_skill';
      const initDesc = 'Automate tasks with surgical precision. Trigger on "run skill" or "/custom_skill".';
      setFormData({
        name: 'New Custom Skill',
        folderName: initFolder,
        description: initDesc,
        content: serializeSkillMarkdown(initFolder, initDesc, '# New Skill\n\n## Inputs\n- Target files\n\n## Workflow\n1. Inspect context\n2. Execute action\n\n## Verification\n- Verify clean compilation\n\n## Safety Constraints\n- Never delete user files without prompt\n'),
        category: 'workflow',
        scope: currentRuleScope.type === 'repo' ? 'repo' : currentRuleScope.type === 'workspace' ? 'workspace' : 'global',
        targetId: currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : (currentRuleScope.type === 'workspace' ? currentRuleScope.workspaceId : undefined)
      });
    }
  }, [skill, isOpen, currentRuleScope]);

  const handleApplyTemplate = (tpl: SkillTemplate) => {
    setFormData((prev: SkillStudioFormData) => ({
      ...prev, name: tpl.title, folderName: tpl.defaultFolderName,
      description: tpl.description, category: tpl.category, content: tpl.templateContent
    }));
    addToast(`Đã áp dụng template: ${tpl.title}`, 'info');
  };

  const handleAiPolish = () => {
    const polished = polishSkillContent(formData.content, formData.name);
    setFormData((prev: SkillStudioFormData) => ({ ...prev, content: polished }));
    addToast('Đã chuẩn hóa chỉ thị Skill theo tiêu chuẩn Antigravity Progressive Disclosure!', 'success');
  };

  const handleOpenPrAnalysis = (report?: SkillEvalReport) => {
    if (report) setEvalReport(report);
    setPrDiffOpen(true);
  };

  const handleApplyAnalyticDraft = (res: AnalyticSkillSynthesisResult) => {
    setFormData((prev: SkillStudioFormData) => ({
      ...prev,
      name: res.suggestedName,
      folderName: res.suggestedFolderName,
      description: res.suggestedDescription,
      category: res.suggestedCategory,
      content: res.generatedSkillContent
    }));
    if (res.generatedEvalSuite) {
      DEFAULT_SKILL_EVAL_SUITES[res.suggestedFolderName] = res.generatedEvalSuite;
    }
    setAnalyticMode(false);
    addToast(`Đã áp dụng thiết kế từ Analytic Agent: ${res.suggestedName}`, 'success');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return addToast('Tên skill không được để trống', 'error');
    setIsSaving(true);
    try {
      const cleanFolder = (formData.folderName || formData.name).toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
      const finalContent = serializeSkillMarkdown(cleanFolder, formData.description, formData.content);
      const ws = systemContext.workspaces.find((w: any) => w.id === currentRuleScope.workspaceId) || systemContext.workspaces[0];
      const targetRepo = currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : ws?.folders?.[0];

      let savedFilePath = skill?.filePath;
      if (formData.scope === 'repo' && targetRepo && typeof window !== 'undefined') {
        // @ts-ignore
        const saveRes = await window.lamApi?.skills?.saveSkill?.(targetRepo, cleanFolder, finalContent);
        if (saveRes?.success) savedFilePath = saveRes.filePath;
      }

      if (skill) {
        updateSkill(skill.id, { ...formData, folderName: cleanFolder, content: finalContent, filePath: savedFilePath, updatedAt: Date.now() });
        addToast(`Đã lưu thay đổi skill: ${formData.name}`, 'success');
      } else {
        addSkill({
          id: `skill-${Date.now()}`, name: formData.name, folderName: cleanFolder,
          description: formData.description, content: finalContent, scope: formData.scope,
          targetId: formData.targetId, source: savedFilePath ? 'file' : 'custom',
          filePath: savedFilePath, active: true, category: formData.category, updatedAt: Date.now()
        });
        addToast(savedFilePath ? `Đã tạo skill tại ${cleanFolder}/SKILL.md` : `Đã tạo skill ${formData.name}`, 'success');
      }
      onClose();
    } catch {
      addToast('Lỗi khi lưu skill', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData, setFormData, isDrawerOpen, setDrawerOpen,
    isDryRunOpen, setDryRunOpen, isEvalOpen, setEvalOpen,
    isPrDiffOpen, setPrDiffOpen, isAnalyticMode, setAnalyticMode,
    evalReport, handleOpenPrAnalysis, handleApplyAnalyticDraft,
    originalContent: skill?.content || '', isSaving,
    handleApplyTemplate, handleAiPolish, handleSave
  };
};
