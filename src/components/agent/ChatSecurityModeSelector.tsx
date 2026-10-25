import React, { useState, useRef, useEffect } from 'react';
import { Zap, Shield, Lock, ChevronDown, Check } from 'lucide-react';
import { useConversationStore, SecurityMode } from '../../store/useConversationStore';

const MODES: Array<{
  id: SecurityMode;
  label: string;
  icon: React.ReactNode;
  color: string;
  badgeClass: string;
  desc: string;
}> = [
  {
    id: 'turbo',
    label: 'Turbo',
    icon: <Zap size={12} className="text-amber-400" />,
    color: 'text-amber-400',
    badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    desc: 'Auto-executes file writes, edits & terminal commands without prompting.'
  },
  {
    id: 'guarded',
    label: 'Guarded',
    icon: <Shield size={12} className="text-emerald-400" />,
    color: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    desc: 'Safe file reads are automatic. Writes and commands produce diff review.'
  },
  {
    id: 'restricted',
    label: 'Restricted',
    icon: <Lock size={12} className="text-blue-400" />,
    color: 'text-blue-400',
    badgeClass: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    desc: 'Read-only mode. Blocks all file modifications and terminal commands.'
  }
];

export const ChatSecurityModeSelector: React.FC = () => {
  const { securityMode, setSecurityMode } = useConversationStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = MODES.find((m) => m.id === securityMode) || MODES[1];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-all ${current.badgeClass}`}
        title={`Security Mode: ${current.label} - ${current.desc}`}
      >
        {current.icon}
        <span>{current.label}</span>
        <ChevronDown size={11} className="opacity-60" />
      </button>

      {isOpen && (
        <div className="surface-panel absolute top-full right-0 mt-1 w-64 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[10px] font-semibold text-app-muted uppercase tracking-wider">
            Agent Autonomy & Security
          </div>
          {MODES.map((m) => {
            const isSelected = m.id === securityMode;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setSecurityMode(m.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start gap-2.5 ${
                  isSelected ? 'bg-primary/15' : 'hover:bg-white/10'
                }`}
              >
                <div className="mt-0.5 shrink-0">{m.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between font-medium">
                    <span className={m.color}>{m.label}</span>
                    {isSelected && <Check size={12} className="text-primary" />}
                  </div>
                  <div className="text-[11px] text-app-muted mt-0.5 leading-snug">{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
