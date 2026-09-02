
import { Minus, Square, X, UserCircle2 } from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';

const TitleBar = () => {
  const { setAccountModalOpen, isAccountModalOpen, githubUser } = useAgentStore();
  const handleMinimize = () => {
    // @ts-ignore
    window.lamApi?.minimizeWindow?.();
  };

  const handleMaximize = () => {
    // @ts-ignore
    window.lamApi?.maximizeWindow?.();
  };

  const handleClose = () => {
    // @ts-ignore
    window.lamApi?.closeWindow?.();
  };

  return (
    <div
      className="h-10 w-full flex items-center justify-between select-none bg-transparent m-0 p-0 rounded-none border-b border-white/5 shrink-0 [-webkit-app-region:drag]"
    >
      <div className="pl-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-primary/80 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
        <span className="text-xs font-semibold tracking-wider text-gray-300 uppercase">L.A.M Studio</span>
      </div>

      {/* Crucial fix: wrapper must have no-drag and z-index to intercept clicks */}
      <div
        style={{ WebkitAppRegion: 'no-drag', zIndex: 9999, position: 'relative' } as any}
        className="flex h-full m-0 p-0 items-center"
      >
        <button
          onClick={() => setAccountModalOpen(true)}
          className={`h-full px-4 transition-colors flex items-center justify-center rounded-none cursor-pointer border-r border-white/5 ${isAccountModalOpen ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          title="Account Center"
        >
          {githubUser ? (
            <img src={githubUser.avatar_url} alt={githubUser.login} className="w-4 h-4 rounded-full object-cover" />
          ) : (
            <UserCircle2 size={16} />
          )}
        </button>
        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center text-gray-400 hover:text-white rounded-none cursor-pointer"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center text-gray-400 hover:text-white rounded-none cursor-pointer"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="h-full px-4 hover:bg-red-500 transition-colors flex items-center justify-center text-gray-400 hover:text-white rounded-none cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
