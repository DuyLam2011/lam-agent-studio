import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, PanelBottom, Columns3, Code2, ChevronDown, Check } from 'lucide-react';
import { useAgentStore, LayoutPreset } from '../../store/useAgentStore';
import clsx from 'clsx';

export const LayoutPresetMenu: React.FC = () => {
  const { layoutPreset, setLayoutPreset, terminalDockPosition, setTerminalDockPosition } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const presets: Array<{ id: LayoutPreset; label: string; desc: string; icon: React.ReactNode }> = [
    {
      id: 'vscode-dock',
      label: 'VS Code Standard',
      desc: 'Explorer + Editor + Bottom Terminal',
      icon: <PanelBottom size={13} className="text-primary" />
    },
    {
      id: 'columns-3',
      label: '3 Columns Layout',
      desc: 'Explorer + Editor + AI Studio side-by-side',
      icon: <Columns3 size={13} className="text-emerald-400" />
    },
    {
      id: 'focus-code',
      label: 'Focus Code',
      desc: 'Maximized Editor + Bottom Terminal',
      icon: <Code2 size={13} className="text-amber-400" />
    }
  ];

  return (
    <div ref={menuRef} className="relative select-none" style={{ WebkitAppRegion: 'no-drag' } as any}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors border border-white/5",
          isOpen ? "bg-white/10 text-white" : "bg-white/5 text-gray-300 hover:text-white hover:bg-white/10"
        )}
        title="Choose Workspace Layout Preset (VS Code style)"
      >
        <LayoutGrid size={12} className="text-primary" />
        <span className="hidden sm:inline">Layout</span>
        <ChevronDown size={10} className={clsx("transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-neutral-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-1.5 z-50 flex flex-col gap-1">
          <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Layout Presets
          </div>

          {presets.map((preset) => {
            const isSelected = layoutPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setLayoutPreset(preset.id);
                  setIsOpen(false);
                }}
                className={clsx(
                  "flex items-start gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all",
                  isSelected ? "bg-primary/20 text-white border border-primary/30" : "hover:bg-white/5 text-gray-300 hover:text-white"
                )}
              >
                <div className="mt-0.5 shrink-0">{preset.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{preset.label}</span>
                    {isSelected && <Check size={12} className="text-primary" />}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">{preset.desc}</div>
                </div>
              </button>
            );
          })}

          <div className="my-1 border-t border-white/5" />

          {/* Terminal Position Switcher */}
          <div className="px-2 py-1 flex items-center justify-between text-[11px] text-gray-300">
            <span>Terminal Dock:</span>
            <div className="flex items-center bg-white/5 p-0.5 rounded-md border border-white/5 text-[10px]">
              <button
                onClick={() => setTerminalDockPosition('bottom')}
                className={clsx(
                  "px-2 py-0.5 rounded font-medium transition-all",
                  terminalDockPosition === 'bottom' ? "bg-primary text-white font-bold" : "text-gray-400 hover:text-white"
                )}
              >
                Bottom
              </button>
              <button
                onClick={() => setTerminalDockPosition('column')}
                className={clsx(
                  "px-2 py-0.5 rounded font-medium transition-all",
                  terminalDockPosition === 'column' ? "bg-primary text-white font-bold" : "text-gray-400 hover:text-white"
                )}
              >
                Column
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
