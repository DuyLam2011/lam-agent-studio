import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { Github, LogOut } from 'lucide-react';
import clsx from 'clsx';

export const GitHubAccountCard: React.FC = () => {
  const { githubToken, setGithubToken, githubUser, setGithubUser, addToast } = useAgentStore();
  const [isConnecting, setIsConnecting] = useState(false);

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

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // @ts-ignore
      const res = await window.lamApi?.github?.login?.();
      if (res && res.success && res.token) {
        setGithubToken(res.token);
      } else {
        addToast(`GitHub Login Failed: ${res?.error || 'Unknown error'}`, 'error');
      }
    } catch (e: any) {
      addToast(`GitHub Login Exception: ${e.message}`, 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className={clsx("flex flex-col bg-black/40 border rounded-xl overflow-hidden transition-colors group", githubToken ? "border-green-500/30" : "border-white/10 hover:border-white/20")}>
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3">
          <div className={clsx("w-9 h-9 rounded-full flex items-center justify-center overflow-hidden transition-colors shrink-0", githubToken ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white group-hover:bg-white/10")}>
            {githubUser ? (
              <img src={githubUser.avatar_url} alt={githubUser.login} className="w-full h-full object-cover" />
            ) : (
              <Github size={18} />
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
            <LogOut size={11} /> Disconnect
          </button>
        ) : (
          <button 
            onClick={handleConnect}
            disabled={isConnecting}
            className={clsx("text-[10px] font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5", isConnecting ? "bg-white/10 text-gray-400 cursor-wait" : "bg-primary/20 text-primary hover:bg-primary/30")}
          >
            {isConnecting ? (
              <>
                <div className="w-2.5 h-2.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Waiting...
              </>
            ) : 'Connect'}
          </button>
        )}
      </div>
    </div>
  );
};
