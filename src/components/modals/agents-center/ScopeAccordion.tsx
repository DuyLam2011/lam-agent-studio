import React from 'react';
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface ScopeAccordionProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  badgeCount: number;
  badgeColor?: 'cyan' | 'purple' | 'amber' | 'emerald';
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  emptyMessage?: string;
}

export const ScopeAccordion: React.FC<ScopeAccordionProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  badgeCount,
  badgeColor = 'cyan',
  isOpen,
  onToggle,
  children,
  actions,
  emptyMessage = 'No items configured in this scope'
}) => {
  const badgeStyles = {
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  }[badgeColor];

  return (
    <div className="border border-white/10 rounded-2xl bg-black/25 overflow-hidden transition-all shadow-md">
      {/* Accordion Header */}
      <div
        onClick={onToggle}
        className="w-full px-4 py-3 bg-white/5 hover:bg-white/[0.08] flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="text-gray-400">
            {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </div>
          <Icon size={16} className={clsx(iconColor, "shrink-0")} />
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-xs font-bold text-gray-200 tracking-wide">{title}</span>
            {subtitle && (
              <span className="text-[10px] text-gray-500 truncate hidden sm:inline">{subtitle}</span>
            )}
          </div>
          <span className={clsx("text-[9px] px-2 py-0.5 rounded-full border font-mono font-medium", badgeStyles)}>
            {badgeCount}
          </span>
        </div>

        {actions && (
          <div onClick={(e) => e.stopPropagation()} className="shrink-0 flex items-center gap-1.5">
            {actions}
          </div>
        )}
      </div>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-3 border-t border-white/5 space-y-2.5 bg-black/10 animate-in fade-in duration-150">
          {badgeCount === 0 ? (
            <div className="p-4 text-center text-gray-500 text-[11px] italic border border-dashed border-white/5 rounded-xl">
              {emptyMessage}
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
};
