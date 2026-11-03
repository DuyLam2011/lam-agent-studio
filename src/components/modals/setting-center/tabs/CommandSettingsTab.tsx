import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { SupportedModelFamily } from '../../../../types/command-settings';
import { getModelCommandRule } from '../../../../services/command-settings/modelCommandRuleset';
import { getFolderCommandSetting, setWorkspaceCommandFolder } from '../../../../services/command-settings/commandFolderSettingsManager';
import { adviseCommand } from '../../../../services/command-settings/commandAdvisorService';
import { loadCommandExecutionPolicy, updateCommandExecutionPolicy } from '../../../../services/command-settings/commandSettingsService';
import { Terminal, FolderGit2, Sparkles, ShieldCheck, ShieldAlert, Check } from 'lucide-react';
import clsx from 'clsx';

export const CommandSettingsTab: React.FC = () => {
  const { systemContext, addToast } = useAgentStore();
  const activeWs = systemContext.workspaces.find(w => w.id === systemContext.activeWorkspaceId) || systemContext.workspaces[0];
  const activeRepo = activeWs?.folders?.[0] || systemContext.cwd || '.';

  const [policy, setPolicy] = useState(loadCommandExecutionPolicy());
  const [selectedFamily, setSelectedFamily] = useState<SupportedModelFamily>('claude');
  const [subfolder, setSubfolder] = useState('.');
  const [testIntent, setTestIntent] = useState('run test');

  useEffect(() => {
    const setting = getFolderCommandSetting(activeWs?.id || '', activeRepo);
    setSubfolder(setting.defaultSubfolder || '.');
  }, [activeWs, activeRepo]);

  const activeRule = getModelCommandRule(selectedFamily);
  const advisory = adviseCommand({ userIntent: testIntent, modelFamily: selectedFamily, activeWorkspaceId: activeWs?.id, activeRepoPath: activeRepo, requestedSubfolder: subfolder });

  const handleSaveSubfolder = () => {
    setWorkspaceCommandFolder(activeWs?.id || 'default', activeRepo, subfolder);
    addToast(`Đã lưu thư mục mặc định: "${subfolder}" cho repo`, 'success');
  };

  const handleToggleSafeguard = (val: boolean) => {
    const updated = updateCommandExecutionPolicy({ safeguardConfirmationRequired: val });
    setPolicy(updated);
    addToast(`Đã ${val ? 'kích hoạt' : 'tắt'} Safeguard Confirmation Gate`, 'info');
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4 text-xs select-none">
      <div className="surface-card p-3 rounded-xl border border-subtle flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-app-text flex items-center gap-1.5"><Terminal size={14} className="text-primary" /> Quy Tắc Command Theo Từng AI Model</h4>
          <p className="text-[10px] text-muted">Tùy biến cú pháp, non-interactive flags và giới hạn output phù hợp đặc tính model</p>
        </div>
        <div className="flex items-center gap-1">
          {(['claude', 'gemini', 'openai', 'local-ollama'] as SupportedModelFamily[]).map((fam) => (
            <button key={fam} onClick={() => setSelectedFamily(fam)} className={clsx("px-2.5 py-1 rounded-lg font-medium text-[11px] capitalize transition-all cursor-pointer", selectedFamily === fam ? "bg-primary text-white shadow-sm font-bold" : "surface-input border border-subtle text-muted hover:text-app-text")}>{fam.replace('local-', '')}</button>
          ))}
        </div>
      </div>

      <div className="surface-card p-3 rounded-xl border border-subtle space-y-2">
        <div className="flex items-center justify-between border-b border-subtle pb-1.5">
          <span className="font-bold text-app-text">{activeRule.label}</span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{activeRule.chainingStyle} • max {activeRule.maxOutputLines} lines</span>
        </div>
        <p className="text-[11px] text-secondary">{activeRule.description}</p>
        <div className="space-y-1 pt-1">
          {activeRule.guidelines.map((g, idx) => (
            <div key={idx} className="text-[10px] text-muted flex items-start gap-1.5"><Check size={11} className="text-emerald-400 mt-0.5 shrink-0" /><span>{g}</span></div>
          ))}
        </div>
      </div>

      <div className="surface-card p-3 rounded-xl border border-subtle space-y-2.5">
        <h4 className="font-semibold text-app-text flex items-center gap-1.5"><FolderGit2 size={14} className="text-primary" /> Cấu Hình Thư Mục Thực Thi Lệnh (Working Directory)</h4>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted shrink-0">Thư mục gốc repo:</span>
          <span className="font-mono text-[10px] text-app-text px-2 py-1 rounded-lg surface-input border border-subtle truncate flex-1">{activeRepo}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted shrink-0">Target subfolder:</span>
          <input value={subfolder} onChange={(e) => setSubfolder(e.target.value)} className="flex-1 surface-input border border-subtle rounded-lg px-2.5 py-1 text-xs text-app-text font-mono outline-none focus:border-primary" placeholder=". hoặc apps/web, services/api..." />
          <button onClick={handleSaveSubfolder} className="px-3 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium cursor-pointer">Lưu Folder</button>
        </div>
      </div>

      <div className="surface-card p-3 rounded-xl border border-subtle space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-app-text flex items-center gap-1.5"><Sparkles size={14} className="text-cyan-400" /> Command Advisory Playground</h4>
          <button onClick={() => handleToggleSafeguard(!policy.safeguardConfirmationRequired)} className="text-[10px] font-mono flex items-center gap-1 text-muted hover:text-app-text cursor-pointer">
            {policy.safeguardConfirmationRequired ? <ShieldCheck size={12} className="text-emerald-400" /> : <ShieldAlert size={12} className="text-rose-400" />}
            <span>Safeguard Gate: {policy.safeguardConfirmationRequired ? 'Bật' : 'Tắt'}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input value={testIntent} onChange={(e) => setTestIntent(e.target.value)} className="flex-1 surface-input border border-subtle rounded-lg px-2.5 py-1 text-xs text-app-text font-mono outline-none focus:border-cyan-500" placeholder="Nhập ý định lệnh (e.g. run test, build, install...)" />
        </div>
        <div className="p-2.5 rounded-lg bg-black/40 border border-subtle font-mono text-[11px] space-y-1">
          <div className="flex items-center justify-between"><span className="text-muted">Command đề xuất:</span><span className={clsx("px-1.5 py-0.2 rounded uppercase text-[9px] font-bold", advisory.riskTier === 'low' ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10")}>{advisory.riskTier} RISK</span></div>
          <div className="text-cyan-300 font-bold select-text">{advisory.recommendedCommand}</div>
          <div className="text-[10px] text-muted pt-1 border-t border-white/5 flex items-center justify-between"><span>Dir: {advisory.targetWorkingDir}</span><span>{advisory.modelSpecificNotes[0]}</span></div>
        </div>
      </div>
    </div>
  );
};
