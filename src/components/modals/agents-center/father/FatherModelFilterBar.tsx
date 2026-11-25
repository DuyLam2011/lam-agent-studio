import React from 'react';
import { CheckCircle2, CircleDashed, Search } from 'lucide-react';
import { ConnectedPackageInfo } from '../../../../services/subagents/subagentPackageResolver';
import clsx from 'clsx';

interface FatherModelFilterBarProps {
  packages: ConnectedPackageInfo[];
  filterPkg: string;
  setFilterPkg: (id: string) => void;
  search: string;
  setSearch: (v: string) => void;
  onConnectAccount: () => void;
}

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'connected', label: 'Connected' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'codex', label: 'Codex' },
  { id: 'antigravity', label: 'Antigravity' },
  { id: 'claudecode', label: 'Claude' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'ollama', label: 'Ollama' }
];

export const FatherModelFilterBar: React.FC<FatherModelFilterBarProps> = ({
  packages, filterPkg, setFilterPkg, search, setSearch, onConnectAccount
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-1.5 flex-wrap pb-2.5 border-b border-subtle">
      {packages.map((pkg) => (
        <button
          key={pkg.id}
          type="button"
          onClick={() => (pkg.connected ? setFilterPkg(pkg.id) : onConnectAccount())}
          className={clsx(
            'px-2 py-0.5 rounded-full border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer',
            pkg.connected ? 'bg-primary/10 text-app-text border-primary/30' : 'surface-input text-muted border-subtle opacity-75 hover:opacity-100'
          )}
          title={pkg.connected ? `Filter by ${pkg.name}` : `Click to connect ${pkg.name}`}
        >
          {pkg.connected ? <CheckCircle2 size={10} className="text-emerald-400" /> : <CircleDashed size={10} className="text-muted" />}
          <span>{pkg.name}</span>
        </button>
      ))}
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="relative flex-1">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chat AI or coding models (gpt-4o, claude, gemini, deepseek)..."
          className="w-full surface-input border border-subtle rounded-xl pl-8 pr-3 py-1.5 text-xs text-app-text placeholder:text-muted outline-none focus:border-primary"
        />
      </div>
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterPkg(tab.id)}
            className={clsx(
              'px-2 py-1 rounded-lg text-[10.5px] font-semibold border transition-colors shrink-0 cursor-pointer',
              filterPkg === tab.id ? 'bg-primary text-white border-primary' : 'surface-input border-subtle text-secondary hover:text-app-text'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);
