import React, { useState, useEffect, useCallback } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { GitCommit, Plus, Minus, RotateCcw, FileText, ChevronDown, ChevronRight, Check, FolderGit2, Box, FileType2, FileJson, FileCode2, FileCode, Image as ImageIcon, FileTerminal, Settings2, ArrowDown, ArrowUp, Download, RefreshCcw, GitBranch } from 'lucide-react';
import clsx from 'clsx';

interface GitStatus {
  path: string;
  index: string; // 'A' | 'M' | 'D' | '?' etc.
  working_dir: string; // 'M' | 'D' | '?' etc.
}

interface RepoStatus {
  workspaceId: string;
  workspaceName: string;
  repoPath: string;
  staged: GitStatus[];
  unstaged: GitStatus[];
  currentBranch: string;
  branches: string[];
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileType2 size={13} className="text-blue-400 shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileType2 size={13} className="text-yellow-400 shrink-0" />;
    case 'json':
      return <FileJson size={13} className="text-yellow-200 shrink-0" />;
    case 'css':
      return <FileCode2 size={13} className="text-blue-300 shrink-0" />;
    case 'html':
      return <FileCode size={13} className="text-orange-400 shrink-0" />;
    case 'md':
      return <FileText size={13} className="text-purple-400 shrink-0" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
    case 'webp':
      return <ImageIcon size={13} className="text-green-400 shrink-0" />;
    case 'sh':
    case 'bat':
    case 'cmd':
      return <FileTerminal size={13} className="text-green-300 shrink-0" />;
    default:
      return <FileCode size={13} className="text-gray-400 shrink-0" />;
  }
};

export const GitPanel: React.FC = () => {
  const { systemContext, setActiveFile, gitTarget, setGitTarget, openContextMenu, setCloneModalOpen, addToast } = useAgentStore();
  const [repos, setRepos] = useState<RepoStatus[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [commitFlags, setCommitFlags] = useState({
    amend: false,
    noVerify: false,
    signoff: false,
    allowEmpty: false
  });
  const [showCommitOptions, setShowCommitOptions] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showPullDropdown, setShowPullDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!systemContext.workspaces || systemContext.workspaces.length === 0) return;
    setIsLoading(true);
    
    const newRepos: RepoStatus[] = [];
    const newGitStatuses: Record<string, string> = {};

    for (const ws of systemContext.workspaces) {
      for (const folder of ws.folders) {
        try {
          // @ts-ignore
          const res = await window.lamApi?.git?.status(folder);
          if (res?.success) {
            const files: GitStatus[] = res.data.files;
            const staged = files.filter(f => f.index !== ' ' && f.index !== '?');
            const unstaged = files.filter(f => f.working_dir !== ' ' && f.index !== 'A');
            
            let currentBranch = '';
            let branches: string[] = [];
            try {
              // @ts-ignore
              const branchRes = await window.lamApi?.git?.branch(folder);
              if (branchRes?.success) {
                currentBranch = branchRes.data.current;
                branches = branchRes.data.all;
              }
            } catch(e){}

            // We always push if it's a valid git repo (success=true) so we can manage branches even if clean
            newRepos.push({ workspaceId: ws.id, workspaceName: ws.name, repoPath: folder, staged, unstaged, currentBranch, branches });

            files.forEach(f => {
              if (f.index === ' ' && f.working_dir === ' ') return;
              const isStaged = f.index !== ' ' && f.index !== '?';
              const statusStr = isStaged ? f.index : f.working_dir;
              const isAdded = statusStr === 'A' || statusStr === '?';
              const isModified = statusStr === 'M';
              const isDeleted = statusStr === 'D';
              
              let badgeStr = 'M';
              if (isAdded) badgeStr = isStaged ? 'A' : 'U';
              if (isModified) badgeStr = 'M';
              if (isDeleted) badgeStr = 'D';

              newGitStatuses[folder + '/' + f.path] = badgeStr;
            });
          }
        } catch (e) {
          console.error("Failed to fetch git status for", folder, e);
        }
      }
    }
    
    setRepos(newRepos);
    
    // Auto expand all by default initially
    setExpandedNodes(prev => {
      const next = { ...prev };
      newRepos.forEach(r => {
        if (next[r.workspaceId] === undefined) next[r.workspaceId] = true;
        if (next[r.repoPath] === undefined) next[r.repoPath] = true;
      });
      return next;
    });
    
    useAgentStore.getState().setGitStatuses(newGitStatuses);
    setIsLoading(false);
  }, [systemContext.workspaces]);

  useEffect(() => {
    fetchStatus();
    // Poll every 10 seconds just in case
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleStage = async (repoPath: string, filePath: string) => {
    // @ts-ignore
    await window.lamApi?.git?.add(repoPath, filePath);
    fetchStatus();
  };

  const handleUnstage = async (repoPath: string, filePath: string) => {
    // @ts-ignore
    await window.lamApi?.git?.unstage(repoPath, filePath);
    fetchStatus();
  };

  const handleDiscard = async (repoPath: string, filePath: string) => {
    // @ts-ignore
    await window.lamApi?.git?.discard(repoPath, filePath);
    fetchStatus();
  };

  const handlePush = async (repoPath: string) => {
    setIsPushing(true);
    try {
      // @ts-ignore
      const res = await window.lamApi?.git?.push(gitTarget);
      if (!res?.success) addToast("Push failed: " + res?.error, 'error');
      else {
        addToast("Push successful", 'success');
        fetchStatus();
      }
    } catch (e: any) {
      addToast("Push error: " + e.message, 'error');
    } finally {
      setIsPushing(false);
      fetchStatus();
    }
  };

  const handlePull = async (repoPath: string, branchName?: string) => {
    setIsPulling(true);
    try {
      // @ts-ignore
      const res = await window.lamApi?.git?.pull(repoPath, branchName);
      if (!res?.success) addToast("Pull failed: " + res?.error, 'error');
      else {
        addToast("Pull successful", 'success');
        fetchStatus();
      }
    } catch (e: any) {
      addToast("Pull error: " + e.message, 'error');
    } finally {
      setIsPulling(false);
      fetchStatus();
    }
  };

  const handleFetch = async (repoPath: string) => {
    setIsFetching(true);
    try {
      // @ts-ignore
      const res = await window.lamApi?.git?.fetch(repoPath);
      if (!res?.success) addToast("Fetch failed: " + res?.error, 'error');
      else {
        addToast("Fetch successful", 'success');
        fetchStatus();
      }
    } catch (e: any) {
      addToast("Fetch error: " + e.message, 'error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleCheckout = async (repoPath: string, branchName: string) => {
    try {
      // @ts-ignore
      const res = await window.lamApi?.git?.checkout(repoPath, branchName);
      if (!res?.success) addToast("Checkout failed: " + res?.error, 'error');
      else {
        addToast(`Switched to ${branchName}`, 'success');
        fetchStatus();
      }
    } catch (e: any) {
      addToast("Checkout error: " + e.message, 'error');
    }
  };



  const handleCommit = async () => {
    if (!commitMessage.trim() || !gitTarget) return;
    
    // Only commit the focused repository
    const focusedRepo = repos.find(r => r.repoPath === gitTarget);
    if (focusedRepo && (commitFlags.allowEmpty || focusedRepo.staged.length > 0)) {
      // @ts-ignore
      await window.lamApi?.git?.commit(focusedRepo.repoPath, commitMessage, commitFlags);
      setCommitMessage('');
      fetchStatus();
    }
  };

  const openDiff = async (repoPath: string, file: GitStatus) => {
    const fullPath = repoPath + '/' + file.path;
    const fileName = file.path.split('/').pop() || file.path;
    
    try {
      // @ts-ignore
      const currentRes = await window.lamApi?.fs?.readFile(fullPath);
      // @ts-ignore
      const originalRes = await window.lamApi?.git?.getFileContent(repoPath, file.path);
      
      setActiveFile({
        name: `DIFF: ${fileName}`,
        path: fullPath,
        isDirectory: false,
        content: currentRes?.success ? currentRes.data : '',
        originalContent: originalRes?.success ? originalRes.data : '',
        isDiff: true
      });
    } catch (e) {
      console.error("Failed to open diff", e);
    }
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const renderFile = (repoPath: string, file: GitStatus, isStaged: boolean) => {
    const statusStr = isStaged ? file.index : file.working_dir;
    const isAdded = statusStr === 'A' || statusStr === '?';
    const isModified = statusStr === 'M';
    const isDeleted = statusStr === 'D';

    let colorClass = 'text-gray-400';
    let badgeStr = 'M';
    
    if (isAdded) { colorClass = 'text-green-400'; badgeStr = isStaged ? 'A' : 'U'; }
    if (isModified) { colorClass = 'text-yellow-400'; badgeStr = 'M'; }
    if (isDeleted) { colorClass = 'text-red-400'; badgeStr = 'D'; }

    const fileName = file.path.split('/').pop() || file.path;

    return (
      <div 
        key={file.path} 
        className="group flex items-center justify-between px-2 py-1 text-xs hover:bg-white/10 rounded cursor-pointer transition-colors"
        onClick={() => openDiff(repoPath, file)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openContextMenu({
            x: e.clientX,
            y: e.clientY,
            type: 'git_file',
            path: repoPath + '/' + file.path,
            workspaceId: '',
            name: fileName
          });
        }}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {getFileIcon(fileName)}
          <span className={clsx("truncate", isDeleted && "line-through opacity-70", colorClass)}>{file.path}</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {isStaged ? (
            <button onClick={(e) => { e.stopPropagation(); handleUnstage(repoPath, file.path); }} className="hover:text-white text-gray-400 p-0.5" title="Unstage Changes">
              <Minus size={14} />
            </button>
          ) : (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleDiscard(repoPath, file.path); }} className="hover:text-white text-gray-400 p-0.5" title="Discard Changes">
                <RotateCcw size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleStage(repoPath, file.path); }} className="hover:text-white text-gray-400 p-0.5" title="Stage Changes">
                <Plus size={14} />
              </button>
            </>
          )}
          <span className={clsx("font-mono text-[9px] font-bold ml-1 w-3 text-center", colorClass)}>{badgeStr}</span>
        </div>
      </div>
    );
  };

  // Filter groupedRepos based on gitTarget
  const groupedRepos = repos.reduce((acc, repo) => {
    // If we have a target, check if this repo matches the target
    if (gitTarget) {
      // It matches if gitTarget is the workspace ID OR if gitTarget is the specific repo path
      if (repo.workspaceId !== gitTarget && repo.repoPath !== gitTarget) {
        return acc;
      }
    }

    if (!acc[repo.workspaceId]) {
      acc[repo.workspaceId] = { workspaceName: repo.workspaceName, repos: [] };
    }
    acc[repo.workspaceId].repos.push(repo);
    return acc;
  }, {} as Record<string, { workspaceName: string, repos: RepoStatus[] }>);

  const isSpecificRepoFocused = gitTarget && systemContext.workspaces.some(ws => ws.folders.includes(gitTarget));
  const canCommit = commitMessage.trim() && isSpecificRepoFocused && (commitFlags.allowEmpty || repos.some(r => r.repoPath === gitTarget && r.staged.length > 0));

  if (!systemContext.workspaces || systemContext.workspaces.length === 0) {
    return <div className="text-xs text-gray-500 text-center py-4">No workspaces available.</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden -mx-4 px-4">
      {/* Target scope filter */}
      <div className="mb-4 shrink-0">
        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1 px-1">Target Scope</div>
        <div className="flex items-center gap-2">
          <select 
            value={gitTarget || ""}
            onChange={(e) => setGitTarget(e.target.value === "" ? null : e.target.value)}
            className="bg-black/20 text-xs text-white px-2 py-1.5 rounded-lg border border-white/10 w-full outline-none focus:border-primary/50 transition-colors custom-scrollbar appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            <option value="" className="bg-neutral-900 text-gray-300">-- All Workspaces --</option>
            {systemContext.workspaces.map(ws => (
              <optgroup key={ws.id} label={`Workspace: ${ws.name}`} className="bg-neutral-900">
                <option value={ws.id} className="text-purple-400 font-bold">🎯 Entire Workspace: {ws.name}</option>
                {ws.folders.map(f => (
                  <option key={f} value={f} className="text-gray-300">└─ {f.split(/[/\\]/).pop()}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Git Remote Actions */}
      <div className="flex flex-col gap-2 mb-4 shrink-0">
        {isSpecificRepoFocused ? (() => {
          const activeRepo = repos.find(r => r.repoPath === gitTarget);
          if (!activeRepo) return null;
          
          return (
          <>
            <div className="flex items-center gap-2 relative">
              <div className="flex-1 relative">
                <button 
                  onClick={() => { setShowBranchDropdown(!showBranchDropdown); setShowPullDropdown(false); }}
                  className="flex w-full items-center justify-between border border-white/10 rounded-lg bg-black/20 hover:bg-white/10 transition-colors px-2 py-1.5 h-8 text-xs text-white"
                >
                  <div className="flex items-center gap-2 truncate">
                    <GitBranch size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{activeRepo.currentBranch || 'Select a branch'}</span>
                  </div>
                  <ChevronDown size={13} className="text-gray-500 shrink-0 ml-2" />
                </button>
                {showBranchDropdown && (
                  <>
                    <div className="fixed inset-0 z-[40]" onClick={() => setShowBranchDropdown(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-full bg-[#1e1e1e] border border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden z-[50] max-h-64 flex flex-col">
                      <div className="overflow-y-auto custom-scrollbar p-1">
                        {activeRepo.branches?.map(b => (
                          <button
                            key={b}
                            onClick={() => { handleCheckout(activeRepo.repoPath, b); setShowBranchDropdown(false); }}
                            className={clsx("w-full text-left px-3 py-2 text-xs rounded hover:bg-white/10 transition-colors", b === activeRepo.currentBranch ? "text-primary bg-primary/10" : "text-gray-300")}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button 
                onClick={() => handleFetch(gitTarget!)}
                disabled={isFetching}
                className={clsx("shrink-0 p-1.5 border rounded-lg text-gray-300 transition-colors h-8 w-8 flex items-center justify-center", isFetching ? "bg-white/10 border-transparent cursor-wait" : "bg-black/20 border-white/5 hover:bg-white/10 hover:text-white")}
                title="Fetch latest"
              >
                <RefreshCcw size={14} className={isFetching ? "animate-spin" : ""} />
              </button>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <button 
                  onClick={() => { setShowPullDropdown(!showPullDropdown); setShowBranchDropdown(false); }}
                  disabled={isPulling || isPushing}
                  className={clsx("w-full flex items-center justify-center gap-1.5 py-1.5 border rounded-lg text-[11px] font-bold transition-colors", isPulling ? "bg-white/10 text-gray-400 border-transparent" : "bg-black/20 hover:bg-white/10 border-white/5 text-gray-300")} 
                >
                  <ArrowDown size={14} className={isPulling ? "animate-bounce" : ""} /> {isPulling ? "Pulling..." : "Pull ▾"}
                </button>
                {showPullDropdown && (
                  <>
                    <div className="fixed inset-0 z-[40]" onClick={() => setShowPullDropdown(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-64 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden z-[50] flex flex-col">
                      <div className="overflow-y-auto custom-scrollbar p-1 max-h-64">
                        <button 
                          onClick={() => { handlePull(gitTarget!); setShowPullDropdown(false); }}
                          className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/10 rounded transition-colors text-white border-b border-white/10 mb-1"
                        >
                          Default Tracked Branch
                        </button>
                        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase text-gray-500">Remote Branches</div>
                        {activeRepo.branches?.filter(b => b.startsWith('remotes/origin/')).map(b => (
                          <button
                            key={b}
                            onClick={() => { handlePull(gitTarget!, b.replace('remotes/origin/', '')); setShowPullDropdown(false); }}
                            className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-white/10 transition-colors text-gray-300"
                          >
                            {b.replace('remotes/origin/', '')}
                          </button>
                        ))}
                        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase text-gray-500 border-t border-white/10 mt-1">Local Branches</div>
                        {activeRepo.branches?.filter(b => !b.startsWith('remotes/')).map(b => (
                          <button
                            key={b}
                            onClick={() => { handlePull(gitTarget!, b); setShowPullDropdown(false); }}
                            className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-white/10 transition-colors text-gray-300"
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <button 
                onClick={() => handlePush(gitTarget!)} 
                disabled={isPulling || isPushing}
                className={clsx("flex-1 flex items-center justify-center gap-1.5 py-1.5 border rounded-lg text-[11px] font-bold transition-colors", isPushing ? "bg-white/10 text-gray-400 border-transparent cursor-wait" : "bg-black/20 hover:bg-white/10 border-white/5 text-gray-300 hover:text-white")} 
                title="Push to remote"
              >
                <ArrowUp size={14} className={isPushing ? "animate-bounce" : ""} /> {isPushing ? "Pushing..." : "Push"}
              </button>
            </div>
          </>
          );
        })() : (
          <div className="flex flex-col gap-2 w-full">
            <button 
              onClick={() => setCloneModalOpen(true)} 
              className="w-full flex items-center justify-center gap-1.5 py-1.5 border rounded-lg text-xs transition-colors bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
            >
              <Download size={14} /> Clone Repository
            </button>
          </div>
        )}
      </div>

      {/* Commit Box */}
      <div className="relative z-10 mb-4 shrink-0 border border-white/10 bg-black/20 rounded-xl focus-within:border-primary/50 transition-colors shadow-lg">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Message (Enter to commit)"
          className="w-full bg-transparent text-xs text-white p-3 outline-none resize-none h-20 custom-scrollbar rounded-t-xl"
        />
        <div className="bg-black/40 p-2 flex justify-between items-center border-t border-white/5 relative rounded-b-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              <GitCommit size={12} /> Commit
            </span>
            <button 
              onClick={() => setShowCommitOptions(!showCommitOptions)}
              className={clsx("p-1 rounded transition-colors text-gray-400 hover:text-white", showCommitOptions ? "bg-white/10 text-white" : "hover:bg-white/10")}
              title="Commit Options"
            >
              <Settings2 size={12} />
            </button>
          </div>
          
          {showCommitOptions && (
            <div className="absolute top-full left-2 mt-2 w-48 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden z-[50] py-2">
              <div className="px-3 pb-2 mb-1 border-b border-white/10 text-[10px] font-bold uppercase text-gray-500">
                Commit Flags
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/10 transition-colors group">
                  <input type="checkbox" checked={commitFlags.amend} onChange={(e) => setCommitFlags(prev => ({...prev, amend: e.target.checked}))} className="w-3 h-3 appearance-none border border-white/20 rounded-sm bg-black/50 checked:bg-primary checked:border-primary cursor-pointer transition-colors relative after:content-[''] after:absolute after:hidden checked:after:block after:w-1 after:h-2 after:border-white after:border-r-[1.5px] after:border-b-[1.5px] after:rotate-45 after:left-[3px] after:top-[0.5px]" />
                  <span className="text-xs text-gray-300 group-hover:text-white">--amend</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/10 transition-colors group">
                  <input type="checkbox" checked={commitFlags.noVerify} onChange={(e) => setCommitFlags(prev => ({...prev, noVerify: e.target.checked}))} className="w-3 h-3 appearance-none border border-white/20 rounded-sm bg-black/50 checked:bg-primary checked:border-primary cursor-pointer transition-colors relative after:content-[''] after:absolute after:hidden checked:after:block after:w-1 after:h-2 after:border-white after:border-r-[1.5px] after:border-b-[1.5px] after:rotate-45 after:left-[3px] after:top-[0.5px]" />
                  <span className="text-xs text-gray-300 group-hover:text-white">--no-verify</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/10 transition-colors group">
                  <input type="checkbox" checked={commitFlags.signoff} onChange={(e) => setCommitFlags(prev => ({...prev, signoff: e.target.checked}))} className="w-3 h-3 appearance-none border border-white/20 rounded-sm bg-black/50 checked:bg-primary checked:border-primary cursor-pointer transition-colors relative after:content-[''] after:absolute after:hidden checked:after:block after:w-1 after:h-2 after:border-white after:border-r-[1.5px] after:border-b-[1.5px] after:rotate-45 after:left-[3px] after:top-[0.5px]" />
                  <span className="text-xs text-gray-300 group-hover:text-white">--signoff</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/10 transition-colors group">
                  <input type="checkbox" checked={commitFlags.allowEmpty} onChange={(e) => setCommitFlags(prev => ({...prev, allowEmpty: e.target.checked}))} className="w-3 h-3 appearance-none border border-white/20 rounded-sm bg-black/50 checked:bg-primary checked:border-primary cursor-pointer transition-colors relative after:content-[''] after:absolute after:hidden checked:after:block after:w-1 after:h-2 after:border-white after:border-r-[1.5px] after:border-b-[1.5px] after:rotate-45 after:left-[3px] after:top-[0.5px]" />
                  <span className="text-xs text-gray-300 group-hover:text-white">--allow-empty</span>
                </label>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleCommit}
            disabled={!canCommit}
            title={!isSpecificRepoFocused ? "Please focus a specific repository to commit" : ""}
            className="flex items-center gap-1 text-[11px] bg-primary/20 hover:bg-primary/30 text-primary font-bold px-3 py-1 rounded transition-colors disabled:opacity-50 disabled:hover:bg-primary/20"
          >
            <Check size={12} /> Commit
          </button>
        </div>
      </div>

      {/* Repositories Tree */}
      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
        {Object.keys(groupedRepos).length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-8">
            <Check size={24} className="mx-auto mb-2 opacity-50" />
            No changes found.
          </div>
        ) : (
          Object.entries(groupedRepos).map(([wsId, wsGroup]) => (
            <div key={wsId} className="mb-4">
              {/* Workspace Header */}
              <div 
                onClick={() => toggleExpand(wsId)}
                className="flex items-center gap-1.5 text-xs font-bold text-white hover:bg-white/10 px-1 py-1 rounded cursor-pointer group mb-1"
              >
                {expandedNodes[wsId] ? <ChevronDown size={14} className="shrink-0 text-gray-500 group-hover:text-white" /> : <ChevronRight size={14} className="shrink-0 text-gray-500 group-hover:text-white" />}
                <Box size={14} className="shrink-0 text-purple-400" />
                <span className="truncate">{wsGroup.workspaceName}</span>
              </div>

              {/* Repos under Workspace */}
              {expandedNodes[wsId] && wsGroup.repos.map(repo => (
                <div key={repo.repoPath} className="ml-3 mb-2 border-l border-white/5 pl-2">
                  <div 
                    onClick={() => toggleExpand(repo.repoPath)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        type: 'git_repo',
                        path: repo.repoPath,
                        workspaceId: wsId,
                        name: repo.repoPath.split(/[/\\]/).pop() || ''
                      });
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white px-1 py-1 rounded cursor-pointer group mb-1 hover:bg-white/10"
                  >
                    {expandedNodes[repo.repoPath] ? <ChevronDown size={14} className="shrink-0 text-gray-500 group-hover:text-white" /> : <ChevronRight size={14} className="shrink-0 text-gray-500 group-hover:text-white" />}
                    <FolderGit2 size={14} className="shrink-0 text-orange-400" />
                    <span className="truncate">{repo.repoPath.split(/[/\\]/).pop()}</span>
                    <span className="ml-auto text-[10px] bg-white/10 px-1.5 rounded-full">{repo.staged.length + repo.unstaged.length}</span>
                  </div>

                  {expandedNodes[repo.repoPath] && (
                    <div className="pl-4">
                      {repo.staged.length > 0 && (
                        <div className="mb-2">
                          <div className="text-[10px] font-bold uppercase text-gray-500 px-2 py-1 flex justify-between group">
                            <span>Staged Changes</span>
                          </div>
                          <div className="space-y-px">
                            {repo.staged.map(f => renderFile(repo.repoPath, f, true))}
                          </div>
                        </div>
                      )}

                      {repo.unstaged.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold uppercase text-gray-500 px-2 py-1 flex justify-between group">
                            <span>Changes</span>
                          </div>
                          <div className="space-y-px">
                            {repo.unstaged.map(f => renderFile(repo.repoPath, f, false))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
