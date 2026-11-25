import React from 'react';
import { Check, LucideIcon } from 'lucide-react';
import clsx from 'clsx';

export const SettingsPage: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-transparent">
    <div className={clsx('w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-5', className)}>
      {children}
    </div>
  </div>
);

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  divided?: boolean;
  bodyClassName?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title, description, icon: Icon, rightSlot, children, divided = false, bodyClassName
}) => (
  <section className="space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
      <div className="min-w-0">
        <h3 className="text-xs font-bold text-app-text uppercase tracking-wider flex items-center gap-1.5">
          {Icon && <Icon size={13} className="text-primary shrink-0" />}
          <span className="truncate">{title}</span>
        </h3>
        {description && <p className="text-[11px] text-muted mt-0.5">{description}</p>}
      </div>
      {rightSlot && <div className="flex items-center gap-2 shrink-0">{rightSlot}</div>}
    </div>
    <div className={clsx(
      'surface-card rounded-2xl border border-subtle overflow-hidden',
      divided ? 'divide-y divide-[var(--border-subtle)]' : 'p-3.5 sm:p-4',
      bodyClassName
    )}>
      {children}
    </div>
  </section>
);

interface SettingsRowProps {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
  alignTop?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({ title, description, badge, children, alignTop = false }) => (
  <div className={clsx('flex flex-col sm:flex-row justify-between gap-3 px-4 py-3.5', alignTop ? 'sm:items-start' : 'sm:items-center')}>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-app-text">{title}</span>
        {badge && <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">{badge}</span>}
      </div>
      {description && <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{description}</p>}
    </div>
    <div className="shrink-0 flex items-center gap-2">{children}</div>
  </div>
);

interface SettingsChoiceCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  badge?: string;
  meta?: React.ReactNode;
  disabled?: boolean;
}

export const SettingsChoiceCard: React.FC<SettingsChoiceCardProps> = ({
  selected, onClick, title, description, badge, meta, disabled = false
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      'p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 min-w-0',
      selected ? 'border-primary bg-primary/10 ring-1 ring-primary/25 shadow-sm' : 'surface-input border-subtle hover:border-primary/40 hover:bg-primary/5',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    <div className="flex items-start justify-between gap-2 w-full">
      <div className="min-w-0">
        <div className="text-xs font-bold text-app-text truncate">{title}</div>
        {badge && <div className="text-[10px] font-mono text-primary mt-0.5 truncate">{badge}</div>}
      </div>
      {selected && <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shrink-0"><Check size={10} strokeWidth={3} /></span>}
    </div>
    {description && <p className="text-[11px] text-muted leading-snug line-clamp-2">{description}</p>}
    {meta && <div className="pt-1.5 border-t border-subtle flex items-center justify-between gap-2 text-[10px] font-mono text-secondary w-full">{meta}</div>}
  </button>
);

export const SettingsToggle: React.FC<{ checked: boolean; onChange: (next: boolean) => void; label?: string }> = ({
  checked, onChange, label
}) => (
  <button
    type="button" role="switch" aria-checked={checked} aria-label={label}
    onClick={() => onChange(!checked)}
    className={clsx('w-10 h-5 rounded-full relative transition-colors duration-150 shrink-0 p-0.5 cursor-pointer border border-subtle', checked ? 'bg-primary' : 'surface-input')}
  >
    <span className={clsx('block w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-150', checked ? 'translate-x-5' : 'translate-x-0')} />
  </button>
);

export function SettingsSegmentedControl<T extends string>({
  options, value, onChange, size = 'sm'
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
  size?: 'xs' | 'sm';
}) {
  return (
    <div className="inline-flex flex-wrap rounded-xl surface-input p-1 border border-subtle gap-1">
      {options.map((opt) => (
        <button
          key={opt.id} type="button" onClick={() => onChange(opt.id)}
          className={clsx(
            'px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer',
            size === 'xs' ? 'text-[10px] font-mono uppercase' : 'text-[11px]',
            value === opt.id ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:text-app-text hover:bg-primary/10'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
