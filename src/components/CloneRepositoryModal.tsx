import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { X, Search, Github, Download, Lock, Globe } from 'lucide-react';
import clsx from 'clsx';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  description: string | null;
  updated_at: string;
}

const CloneRepositoryModal = () => {
  const { isCloneModalOpen, setCloneModalOpen, githubToken, systemContext, addFolderToWorkspace, addToast } = useAgentStore();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [cloningRepo, setCloningRepo] = useState<string | null>(null);
  const [targetWorkspaceId, setTargetWorkspaceId] = useState<string | null>(null);
  
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isCloneModalOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 200); // match animation duration
      return () => clearTimeout(timer);
    }
  }, [isCloneModalOpen, shouldRender]);

  useEffect(() => {
    if (isCloneModalOpen && systemContext.workspaces.length > 0 && !targetWorkspaceId) {
      setTargetWorkspaceId(systemContext.workspaces[0].id);
    }
  }, [isCloneModalOpen, systemContext.workspaces]);

  useEffect(() => {
    if (isCloneModalOpen && githubToken) {
      setIsLoading(true);
      fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRepos(data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
    }
  }, [isCloneModalOpen, githubToken]);

  if (!shouldRender) return null;

  const filteredRepos = repos.filter(repo => 
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClone = async (url: string) => {
    if (!url) return;
    setCloningRepo(url);
    
    try {
      // @ts-ignore
      const dirRes = await window.lamApi?.workspaceAPI?.pickDirectory();
      if (dirRes?.canceled || !dirRes?.folderPath) {
        setCloningRepo(null);
        return;
      }
      
      let localPath = dirRes.folderPath;
      
      const repoName = url.split('/').pop()?.replace('.git', '') || 'cloned-repo';
      localPath = `${localPath}/${repoName}`;
      
      // @ts-ignore
      const res = await window.lamApi?.git?.clone(url, localPath);
      if (!res?.success) {
        addToast("Clone failed: " + res?.error, 'error');
      } else {
        if (targetWorkspaceId) {
          addFolderToWorkspace(targetWorkspaceId, localPath);
          addToast(`Clone successful! The repository has been added to your workspace.`, 'success');
        } else {
          addToast("Clone successful! Add the folder to a workspace to view it.", 'success');
        }
        setCloneModalOpen(false);
      }
    } catch (e: any) {
      addToast("Clone error: " + e.message, 'error');
    } finally {
      setCloningRepo(null);
    }
  };

  return (
    <div className={clsx(
      "fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md",
      isClosing ? "animate-fade-out" : "animate-fade-in"
    )}>
      {/* Modal Container */}
      <div 
        className={clsx(
          "w-full max-w-lg bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh]",
          isClosing ? "animate-zoom-out" : "animate-zoom-in"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <Github size={16} className="text-gray-300" />
            <h2 className="text-sm font-bold text-gray-200 tracking-wide uppercase">Clone Repository</h2>
          </div>
          <button 
            onClick={() => setCloneModalOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          
          {/* Custom URL Input */}
          <div className="p-4 border-b border-white/5 bg-black/20 shrink-0 flex gap-2">
            <input 
              type="text" 
              placeholder="Paste custom GitHub URL (e.g. https://github.com/...)"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 bg-black/40 text-xs text-white px-3 py-2 rounded-lg outline-none border border-white/5 focus:border-primary/50 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && customUrl && handleClone(customUrl)}
            />
            <button 
              onClick={() => handleClone(customUrl)}
              disabled={!customUrl || cloningRepo !== null}
              className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-lg text-xs transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
            >
              {cloningRepo === customUrl ? (
                <><div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> Cloning...</>
              ) : (
                <><Download size={14} /> Clone</>
              )}
            </button>
          </div>
          
          <div className="px-4 py-2 bg-black/40 border-b border-white/5 shrink-0 flex items-center justify-between text-[11px] text-gray-400">
            <span>Target Workspace for Cloned Repo:</span>
            <select 
              value={targetWorkspaceId || ''} 
              onChange={(e) => setTargetWorkspaceId(e.target.value || null)}
              className="bg-black/60 border border-white/10 rounded px-2 py-1 outline-none text-white focus:border-primary/50 transition-colors"
            >
              <option value="">None (Don't add to workspace)</option>
              {systemContext.workspaces.map(ws => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>

          {/* Repo List */}
          {githubToken ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 shrink-0 relative">
                <Search size={14} className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search your repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 text-xs text-white pl-9 pr-3 py-2 rounded-lg outline-none border border-white/5 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32 text-gray-500 text-xs flex-col gap-2">
                    <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading repositories...
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500 text-xs">
                    No repositories found.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {filteredRepos.map(repo => (
                      <button
                        key={repo.id}
                        onClick={() => handleClone(repo.clone_url)}
                        disabled={cloningRepo !== null}
                        className={clsx(
                          "group flex items-center justify-between p-3 rounded-xl border border-transparent transition-colors text-left",
                          cloningRepo === repo.clone_url 
                            ? "bg-primary/10 border-primary/20" 
                            : "hover:bg-white/5 hover:border-white/5"
                        )}
                      >
                        <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-200 truncate">{repo.full_name}</span>
                            {repo.private ? (
                              <Lock size={10} className="text-gray-500 shrink-0" title="Private" />
                            ) : (
                              <Globe size={10} className="text-gray-500 shrink-0" title="Public" />
                            )}
                          </div>
                          {repo.description && (
                            <span className="text-[10px] text-gray-500 truncate">{repo.description}</span>
                          )}
                        </div>
                        <div className="shrink-0">
                          {cloningRepo === repo.clone_url ? (
                            <div className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-[10px] font-bold flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              Cloning
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                              <Download size={14} />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <Github size={32} className="mb-3 opacity-50" />
              <p className="text-xs mb-4 max-w-xs">Connect your GitHub account in the Account Center to browse and easily clone all your repositories.</p>
              <button 
                onClick={() => { setCloneModalOpen(false); /* The user can manually click Account Center */ }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition-colors"
              >
                Close & Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CloneRepositoryModal;
