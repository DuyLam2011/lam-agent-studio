import React, { useState } from 'react';
import { FilePlus, Settings2, Terminal, Code2, Database } from 'lucide-react';
import clsx from 'clsx';

const AgentConfigPanel: React.FC<{ width: number }> = ({ width }) => {
  const [terminalAccess, setTerminalAccess] = useState(true);
  const [fileMutation, setFileMutation] = useState(false);

  return (
    <aside style={{ width }} className="flex flex-col z-10 my-4 mr-4 ml-1 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden shrink-0">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xs uppercase text-gray-500 font-semibold flex items-center gap-2">
          <Settings2 size={14} /> Agent Configuration
        </h2>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

        {/* Context Dropzone */}
        <div>
          <h3 className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider mb-2">Context Payload</h3>
          <div className="border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-black/20 group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
              <FilePlus size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Drag & drop files here</p>
            <p className="text-[10px] text-gray-500 mt-1">or click to browse</p>
          </div>
        </div>

        {/* Rules Manager */}
        <div>
          <h3 className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider mb-2">Active Rules</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-3 bg-black/20 p-2.5 rounded-lg border border-white/5">
              <FilePlus size={14} className="text-purple-400 shrink-0" />
              <div className="flex-1 truncate">
                <p className="text-xs font-medium text-gray-300 truncate">GEMINI.md</p>
                <p className="text-[10px] text-gray-500 truncate">System specifications</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0"></div>
            </li>
          </ul>
        </div>

        {/* Agent Skills */}
        <div>
          <h3 className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider mb-2">Agent Skills</h3>
          <div className="space-y-2">

            <div className="flex items-center justify-between bg-black/20 p-2.5 rounded-lg border border-white/5">
              <div className="flex items-center gap-3">
                <Terminal size={14} className="text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-300">Terminal Access</p>
                  <p className="text-[9px] text-gray-500">Allow execution of shell commands</p>
                </div>
              </div>
              <button
                onClick={() => setTerminalAccess(!terminalAccess)}
                className={clsx("w-8 h-4 rounded-full relative transition-colors duration-200 shrink-0", terminalAccess ? "bg-primary" : "bg-white/10")}
              >
                <div className={clsx("w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all duration-200", terminalAccess ? "left-4.5" : "left-0.5")} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-black/20 p-2.5 rounded-lg border border-white/5">
              <div className="flex items-center gap-3">
                <Code2 size={14} className="text-red-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-300">File Mutation</p>
                  <p className="text-[9px] text-gray-500">Allow direct code editing</p>
                </div>
              </div>
              <button
                onClick={() => setFileMutation(!fileMutation)}
                className={clsx("w-8 h-4 rounded-full relative transition-colors duration-200 shrink-0", fileMutation ? "bg-red-500" : "bg-white/10")}
              >
                <div className={clsx("w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all duration-200", fileMutation ? "left-4.5" : "left-0.5")} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-black/20 p-2.5 rounded-lg border border-white/5 opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <Database size={14} className="text-green-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-300">Database Read</p>
                  <p className="text-[9px] text-gray-500">Requires Postgres plugin</p>
                </div>
              </div>
              <button disabled className="w-8 h-4 rounded-full bg-white/5 relative shrink-0">
                <div className="w-3 h-3 rounded-full bg-gray-600 absolute top-0.5 left-0.5" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </aside>
  );
};

export default AgentConfigPanel;
