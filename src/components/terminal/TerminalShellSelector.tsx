import React from 'react';
import { Terminal } from 'lucide-react';

interface TerminalShellSelectorProps {
  availableShells: { name: string; path: string }[];
  selectedShell: string;
  onSelectShell: (shellPath: string) => void;
}

export const TerminalShellSelector: React.FC<TerminalShellSelectorProps> = ({
  availableShells,
  selectedShell,
  onSelectShell
}) => {
  if (!availableShells || availableShells.length === 0) return null;

  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-md px-1.5 py-0.5 border border-white/5 text-[10px]">
      <Terminal size={10} className="text-gray-400" />
      <select
        value={selectedShell}
        onChange={(e) => onSelectShell(e.target.value)}
        className="bg-transparent text-gray-300 font-mono focus:outline-none cursor-pointer"
      >
        {availableShells.map((sh) => (
          <option key={sh.path} value={sh.path} className="bg-neutral-900 text-gray-200">
            {sh.name}
          </option>
        ))}
      </select>
    </div>
  );
};
