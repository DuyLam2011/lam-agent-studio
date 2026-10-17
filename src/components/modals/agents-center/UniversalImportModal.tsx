import React, { useState } from 'react';
import { X, UploadCloud, Github, FileText, Sparkles, Loader2, Check } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { ImportCategory, UniversalImportResult } from '../../../types/import';
import { analyzeAndClassifyWithAi } from './importHelper';
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

  if (!isImportModalOpen) return null;

  const handlePickFile = async () => {
    setIsFetching(true);
    try {
      // @ts-ignore
      const res = await window.lamApi?.import?.pickLocalFile?.();
      if (res?.success && res.content) {
        const classified = await analyzeAndClassifyWithAi(res.content, res.fileName, engineSettings.selectedModel);
        setImportResult(classified);
        addToast(`Parsed & classified ${res.fileName}`, 'info');
      }
    } catch {
      addToast('Failed to read local file', 'error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleFetchGithub = async () => {
    if (!githubUrl.trim()) return addToast('Please enter a GitHub URL', 'error');
    setIsFetching(true);
    try {
      // @ts-ignore
      const res = await window.lamApi?.import?.fetchGithub?.(githubUrl);
      if (res?.success && res.content) {
        const classified = await analyzeAndClassifyWithAi(res.content, githubUrl.split('/').pop(), engineSettings.selectedModel);
        setImportResult(classified);
        addToast('Fetched and analyzed GitHub resource', 'success');
      } else {
        addToast(res?.error || 'Failed to fetch from GitHub', 'error');
      }
    } catch {
      addToast('Network error fetching GitHub URL', 'error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleCommitImport = () => {
    if (!importResult) return;
    const scope = currentRuleScope.type === 'workspace' ? 'workspace' : (currentRuleScope.type === 'repo' ? 'repo' : 'global');
    const targetId = scope === 'workspace' ? currentRuleScope.workspaceId : (scope === 'repo' ? currentRuleScope.repoPath : undefined);
    const id = `imported-${Date.now()}`;
    const { detectedType, name, description, content } = importResult;

    if (detectedType === 'rule') addRule({ id, name, description, content, scope, targetId, source: 'custom', active: true });
    else if (detectedType === 'skill') addSkill({ id, name, folderName: name.toLowerCase().replace(/\s+/g, '_'), description, content, scope, targetId, source: 'custom', active: true });
    else if (detectedType === 'workflow') addWorkflow({ id, name, description, trigger: 'manual', scope, targetId, active: true, steps: [{ id: 's1', name: 'Execute', role: 'Builder', instructions: content, autoApprove: true }] });
    else if (detectedType === 'plugin') addPlugin({ id, name, description, type: 'mcp', command: 'npx', toolsExposed: ['imported_tool'], status: 'connected', scope, targetId, active: true });
    else if (detectedType === 'subagent') addSubagent({ id, name, role: 'Specialist', systemPrompt: content, model: engineSettings.selectedModel, temperature: 0.2, reasoningEffort: 'medium', allowedSkills: [], scope, targetId, active: true });
    else if (detectedType === 'memory') addMemory({ id, title: name, category: 'architecture', content, scope, targetId, pinned: true });

    addToast(`Successfully imported into ${detectedType.toUpperCase()}!`, 'success');
    setImportModalOpen(false);
    setImportResult(null);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-[660px] max-h-[85vh] bg-neutral-900 border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <UploadCloud size={16} className="text-primary" />
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Universal Import & AI Classifier</h3>
          </div>
          <button onClick={() => setImportModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><X size={15} /></button>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar text-xs">
          <div className="flex gap-2 border-b border-white/10 pb-2">
            <button onClick={() => setImportMode('file')} className={clsx("px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors", importMode === 'file' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}>
              <FileText size={13} /> Local File
            </button>
            <button onClick={() => setImportMode('github')} className={clsx("px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors", importMode === 'github' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}>
              <Github size={13} /> GitHub URL
            </button>
          </div>

          {importMode === 'file' ? (
            <div className="p-6 border border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center text-center gap-2">
              <FileText size={24} className="text-gray-500" />
              <p className="text-gray-300 font-medium">Select .md, .rules, .json, or SKILL.md file</p>
              <button onClick={handlePickFile} disabled={isFetching} className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors flex items-center gap-1.5">
                {isFetching ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />} Browse Local File
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input type="text" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/owner/repo or raw file URL..." className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-gray-200 outline-none focus:border-primary" />
              <button onClick={handleFetchGithub} disabled={isFetching} className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors">
                {isFetching ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Fetch & Analyze with AI
              </button>
            </div>
          )}

          {importResult && (
            <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/30 space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1"><Sparkles size={11} /> AI Classification</span>
                <select value={importResult.detectedType} onChange={(e) => setImportResult({ ...importResult, detectedType: e.target.value as ImportCategory })} className="bg-white/10 border border-white/10 rounded px-2 py-0.5 text-[11px] text-gray-200">
                  {['rule', 'skill', 'workflow', 'plugin', 'subagent', 'memory'].map(t => <option key={t} value={t} className="bg-neutral-900">{t.toUpperCase()}</option>)}
                </select>
              </div>
              <input type="text" value={importResult.name} onChange={(e) => setImportResult({ ...importResult, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded p-1.5 text-xs text-gray-200 font-semibold" />
              <p className="text-[11px] text-gray-400 italic">{importResult.reasoning}</p>
            </div>
          )}
        </div>

        <div className="p-3.5 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <button onClick={() => setImportModalOpen(false)} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white">Cancel</button>
          {importResult && (
            <button onClick={handleCommitImport} className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg">
              <Check size={13} /> Install as {importResult.detectedType.toUpperCase()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
