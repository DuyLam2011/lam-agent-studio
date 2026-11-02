import React, { useState } from 'react';
import { X, UploadCloud, Github, FileText, Sparkles, Loader2, Check } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { ImportCategory, UniversalImportResult } from '../../../types/import';
import { analyzeAndClassifyWithAi } from './importHelper';
import { auditResourceContent } from '../../../services/audit/resourceAuditService';
import { ResourceAuditReportCard } from './ResourceAuditReportCard';
import clsx from 'clsx';

export const UniversalImportModal: React.FC = () => {
  const {
    isImportModalOpen, setImportModalOpen, addToast, engineSettings,
    currentRuleScope, addRule, addSkill, addWorkflow, addPlugin, addSubagent, addMemory
  } = useAgentStore();

  const [importMode, setImportMode] = useState<'file' | 'github'>('file');
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [importResult, setImportResult] = useState<UniversalImportResult | null>(null);
  const [useSanitized, setUseSanitized] = useState(true);

  if (!isImportModalOpen) return null;

  const processImportContent = async (rawContent: string, fileName?: string) => {
    const classified = await analyzeAndClassifyWithAi(rawContent, fileName, engineSettings.selectedModel);
    classified.auditReport = auditResourceContent(rawContent, classified.name, classified.detectedType);
    setImportResult(classified);
    setUseSanitized(classified.auditReport.verdict !== 'SAFE');
  };

  const handlePickFile = async () => {
    setIsFetching(true);
    try {
      // @ts-ignore
      const res = await window.lamApi?.import?.pickLocalFile?.();
      if (res?.success && res.content) {
        await processImportContent(res.content, res.fileName);
        addToast(`Kiểm duyệt & phân loại thành công ${res.fileName}`, 'info');
      }
    } catch { addToast('Không thể đọc tệp cục bộ', 'error'); }
    finally { setIsFetching(false); }
  };

  const handleFetchGithub = async () => {
    if (!githubUrl.trim()) return addToast('Vui lòng nhập GitHub URL', 'error');
    setIsFetching(true);
    try {
      // @ts-ignore
      const res = await window.lamApi?.import?.fetchGithub?.(githubUrl);
      if (res?.success && res.content) {
        await processImportContent(res.content, githubUrl.split('/').pop());
        addToast('Đã tải và thẩm định tài nguyên từ GitHub', 'success');
      } else { addToast(res?.error || 'Lỗi tải từ GitHub', 'error'); }
    } catch { addToast('Lỗi mạng khi kết nối GitHub', 'error'); }
    finally { setIsFetching(false); }
  };

  const handleCommitImport = () => {
    if (!importResult) return;
    const scope = currentRuleScope.type === 'workspace' ? 'workspace' : (currentRuleScope.type === 'repo' ? 'repo' : 'global');
    const targetId = scope === 'workspace' ? currentRuleScope.workspaceId : (scope === 'repo' ? currentRuleScope.repoPath : undefined);
    const id = `imported-${Date.now()}`;
    const { detectedType, name, description } = importResult;
    const content = (useSanitized && importResult.auditReport?.sanitizedContent) ? importResult.auditReport.sanitizedContent : importResult.content;

    const commitMap: Record<string, () => void> = {
      rule: () => addRule({ id, name, description, content, scope, targetId, source: 'custom', active: true }),
      skill: () => addSkill({ id, name, folderName: name.toLowerCase().replace(/\s+/g, '_'), description, content, scope, targetId, source: 'custom', active: true }),
      workflow: () => addWorkflow({ id, name, description, trigger: 'manual', scope, targetId, active: true, steps: [{ id: 's1', name: 'Execute', role: 'Builder', instructions: content, autoApprove: true }] }),
      plugin: () => addPlugin({ id, name, description, type: 'mcp', command: 'npx', toolsExposed: ['imported_tool'], status: 'connected', scope, targetId, active: true }),
      subagent: () => addSubagent({ id, name, role: 'Specialist', systemPrompt: content, model: engineSettings.selectedModel, temperature: 0.2, reasoningEffort: 'medium', allowedSkills: [], scope, targetId, active: true }),
      memory: () => addMemory({ id, title: name, category: 'architecture', content, scope, targetId, pinned: true })
    };
    commitMap[detectedType]?.();

    addToast(`Đã cài đặt thành công vào ${detectedType.toUpperCase()}!`, 'success');
    setImportModalOpen(false);
    setImportResult(null);
  };

  const isBlocked = importResult?.auditReport?.verdict === 'REJECTED' && !useSanitized;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-[660px] max-h-[85vh] bg-neutral-900 border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-xs">
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <UploadCloud size={16} className="text-primary" />
            <h3 className="font-semibold text-gray-200 uppercase tracking-wider text-[11px]">Universal Import & AI Security Audit</h3>
          </div>
          <button onClick={() => setImportModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"><X size={15} /></button>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
          <div className="flex gap-2 border-b border-white/10 pb-2">
            <button onClick={() => setImportMode('file')} className={clsx("px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors cursor-pointer", importMode === 'file' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}><FileText size={13} /> Local File</button>
            <button onClick={() => setImportMode('github')} className={clsx("px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors cursor-pointer", importMode === 'github' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}><Github size={13} /> GitHub URL</button>
          </div>

          {importMode === 'file' ? (
            <div className="p-5 border border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center text-center gap-2">
              <FileText size={22} className="text-gray-500" />
              <p className="text-gray-300 font-medium">Hỗ trợ .md, .rules, .json, hoặc SKILL.md</p>
              <button onClick={handlePickFile} disabled={isFetching} className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer">
                {isFetching ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />} Chọn tệp cục bộ
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input type="text" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/owner/repo hoặc file raw..." className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-gray-200 outline-none focus:border-primary" />
              <button onClick={handleFetchGithub} disabled={isFetching} className="w-full py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                {isFetching ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Thẩm định & phân tích từ GitHub
              </button>
            </div>
          )}

          {importResult && (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-black/40 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1"><Sparkles size={11} /> Phân loại tài nguyên</span>
                  <select value={importResult.detectedType} onChange={(e) => setImportResult({ ...importResult, detectedType: e.target.value as ImportCategory })} className="bg-white/10 border border-white/10 rounded px-2 py-0.5 text-[11px] text-gray-200">
                    {['rule', 'skill', 'workflow', 'plugin', 'subagent', 'memory'].map(t => <option key={t} value={t} className="bg-neutral-900">{t.toUpperCase()}</option>)}
                  </select>
                </div>
                <input type="text" value={importResult.name} onChange={(e) => setImportResult({ ...importResult, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded p-1.5 text-gray-200 font-semibold" />
              </div>

              {importResult.auditReport && (
                <ResourceAuditReportCard report={importResult.auditReport} useSanitized={useSanitized} onToggleSanitized={setUseSanitized} />
              )}
            </div>
          )}
        </div>

        <div className="p-3.5 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <button onClick={() => setImportModalOpen(false)} className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white cursor-pointer">Hủy</button>
          {importResult && (
            <button onClick={handleCommitImport} disabled={isBlocked} className={clsx("px-4 py-1.5 rounded-lg text-white font-semibold flex items-center gap-1.5 shadow-lg transition-all", isBlocked ? "bg-red-900/60 cursor-not-allowed opacity-60" : "bg-emerald-600 hover:bg-emerald-500 cursor-pointer")}>
              <Check size={13} /> {isBlocked ? 'Từ chối (Cần bật khử độc)' : `Cài đặt ${importResult.detectedType.toUpperCase()}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
