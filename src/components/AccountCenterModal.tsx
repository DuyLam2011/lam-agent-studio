import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { X, Github, Mail, Sparkles, Bot, Blocks, Check, LogOut } from 'lucide-react';
import clsx from 'clsx';

const AccountCenterModal = () => {
  const { isAccountModalOpen, setAccountModalOpen, githubToken, setGithubToken, githubUser, setGithubUser, addToast } = useAgentStore();
  const [isConnectingGithub, setIsConnectingGithub] = useState(false);

  useEffect(() => {
    if (githubToken && !githubUser) {
      fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.login) {
          setGithubUser({ login: data.login, avatar_url: data.avatar_url });
        }
      })
      .catch(console.error);
    }
  }, [githubToken, githubUser, setGithubUser]);

  if (!isAccountModalOpen) return null;

  const handleConnectGithub = async () => {
    setIsConnectingGithub(true);
    try {
      // @ts-ignore
      const res = await window.lamApi?.github?.login();
      if (res && res.success && res.token) {
        setGithubToken(res.token);
      } else {
        console.error("GitHub Login Failed:", res?.error);
        addToast(`GitHub Login Failed: ${res?.error}`, 'error');
      }
    } catch (e: any) {
      console.error("GitHub Login Exception:", e);
      addToast(`GitHub Login Exception: ${e.message}`, 'error');
    } finally {
      setIsConnectingGithub(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md">
      {/* Modal Container */}
      <div 
        className="w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <h2 className="text-sm font-bold text-gray-200 tracking-wide uppercase">Account Center</h2>
          <button 
            onClick={() => setAccountModalOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          
          {/* Active Integration: GitHub */}
          <div>
            <h3 className="text-[10px] uppercase font-bold text-gray-500 mb-3 tracking-wider">Connected Accounts</h3>
            <div className={clsx("flex flex-col bg-black/40 border rounded-xl overflow-hidden transition-colors group", githubToken ? "border-green-500/30" : "border-white/10 hover:border-white/20")}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center overflow-hidden transition-colors", githubToken ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white group-hover:bg-white/10")}>
                    {githubUser ? (
                      <img src={githubUser.avatar_url} alt={githubUser.login} className="w-full h-full object-cover" />
                    ) : (
                      <Github size={20} />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-200">{githubUser ? githubUser.login : 'GitHub'}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{githubToken ? 'Connected securely via OAuth' : 'Authenticate for Git & PRs'}</div>
                  </div>
                </div>
                {githubToken ? (
                  <button 
                    onClick={() => { setGithubToken(null); setGithubUser(null); }}
                    className="text-[10px] font-bold px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1"
                  >
                    <LogOut size={12} /> Disconnect
                  </button>
                ) : (
                  <button 
                    onClick={handleConnectGithub}
                    disabled={isConnectingGithub}
                    className={clsx("text-[10px] font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5", isConnectingGithub ? "bg-white/10 text-gray-400 cursor-wait" : "bg-primary/20 text-primary hover:bg-primary/30")}
                  >
                    {isConnectingGithub ? (
                      <>
                        <div className="w-2.5 h-2.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        Waiting for Browser...
                      </>
                    ) : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Integrations */}
          <div>
            <h3 className="text-[10px] uppercase font-bold text-gray-500 mb-3 tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-purple-400" /> Coming Soon
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Google */}
              <div className="flex flex-col gap-2 bg-black/20 border border-white/5 rounded-xl p-3 opacity-60 grayscale cursor-not-allowed">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-300">Google</span>
                </div>
                <div className="text-[9px] text-gray-500 leading-tight">Drive \u0026 Docs Sync</div>
              </div>

              {/* Cursor */}
              <div className="flex flex-col gap-2 bg-black/20 border border-white/5 rounded-xl p-3 opacity-60 grayscale cursor-not-allowed">
                <div className="flex items-center gap-2">
                  <Blocks size={14} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-300">Cursor</span>
                </div>
                <div className="text-[9px] text-gray-500 leading-tight">Sync IDE settings</div>
              </div>

              {/* Claude */}
              <div className="flex flex-col gap-2 bg-black/20 border border-white/5 rounded-xl p-3 opacity-60 grayscale cursor-not-allowed">
                <div className="flex items-center gap-2">
                  <Bot size={14} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-300">Claude</span>
                </div>
                <div className="text-[9px] text-gray-500 leading-tight">Anthropic API Key</div>
              </div>

              {/* ChatGPT */}
              <div className="flex flex-col gap-2 bg-black/20 border border-white/5 rounded-xl p-3 opacity-60 grayscale cursor-not-allowed">
                <div className="flex items-center gap-2">
                  <Bot size={14} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-300">ChatGPT</span>
                </div>
                <div className="text-[9px] text-gray-500 leading-tight">OpenAI API Key</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AccountCenterModal;
