import React, { useState } from 'react';
import { Copy, Search, Terminal as TermIcon, Check } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface TerminalLogViewerProps {
  log: string;
}

export const TerminalLogViewer: React.FC<TerminalLogViewerProps> = ({ log }) => {
  const { addToast } = useAgentStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(log);
    setCopied(true);
    addToast('Copied terminal log to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = log.split('\n');
  const filteredLines = searchTerm.trim()
    ? lines.filter(line => line.toLowerCase().includes(searchTerm.toLowerCase()))
    : lines;

  return (
    <div className="flex flex-col h-full bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
      {/* Log Header Controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/5 gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <TermIcon size={13} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-white truncate">Captured Terminal Buffer</span>
          <span className="text-[10px] text-gray-500 font-mono">({lines.length} lines)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Search */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-2 py-0.5 text-xs">
            <Search size={11} className="text-gray-400 mr-1" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter log..."
              className="bg-transparent text-[11px] text-gray-200 placeholder-gray-500 focus:outline-none w-28"
            />
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[10px] transition-colors border border-white/5"
            title="Copy Terminal Log"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Log Content Scroll */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar font-mono text-[11px] leading-relaxed text-gray-300 select-text max-h-[380px]">
        {filteredLines.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs">No matching log lines found.</div>
        ) : (
          filteredLines.map((line, idx) => {
            const isError = /error|failed|exception|fatal/i.test(line);
            const isWarn = /warning|warn/i.test(line);
            return (
              <div
                key={idx}
                className={clsx(
                  "flex items-start gap-2 py-0.5 px-1 rounded hover:bg-white/5 transition-colors",
                  isError && "bg-rose-500/10 text-rose-300 font-medium",
                  isWarn && "bg-amber-500/10 text-amber-300"
                )}
              >
                <span className="text-[9px] text-gray-600 select-none w-6 text-right shrink-0">{idx + 1}</span>
                <span className="break-all whitespace-pre-wrap flex-1">{line || ' '}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
