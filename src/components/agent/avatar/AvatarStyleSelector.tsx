import React from 'react';
import clsx from 'clsx';
import { AvatarStyle } from '../../../types/avatar';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentAvatar } from './AgentAvatar';
import { Check } from 'lucide-react';

interface StyleOption {
  id: AvatarStyle;
  label: string;
  tagline: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  { id: 'pixel', label: 'Pixel Art', tagline: '8-bit Retro Cyber' },
  { id: 'lowpoly', label: 'Low-Poly', tagline: '3D Faceted Triangles' },
  { id: 'cyberpunk', label: 'Cyberpunk', tagline: 'Neon Visor & Grid' },
  { id: 'minimal', label: 'Minimalism', tagline: 'Swiss Bauhaus Vector' },
  { id: 'origami', label: 'Origami', tagline: 'Folded Geometric Craft' },
];

export const AvatarStyleSelector: React.FC = () => {
  const { avatarStyle, setAvatarStyle, addToast } = useAgentStore();

  const handleSelect = (style: AvatarStyle) => {
    setAvatarStyle(style);
    addToast(`Agent avatar style updated: ${style.toUpperCase()}`, 'success');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-app-text uppercase tracking-wider">
          Agent Avatar Style
        </label>
        <span className="text-[10px] text-app-muted font-mono">
          Live Rendered SVG
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {STYLE_OPTIONS.map((opt) => {
          const isSelected = avatarStyle === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={clsx(
                "p-2.5 rounded-xl border text-left transition-all duration-150 flex items-center justify-between group",
                isSelected
                  ? "bg-primary/15 border-primary shadow-lg shadow-primary/10"
                  : "surface-card border-border hover:border-primary/40 hover:bg-white/[0.03]"
              )}
            >
              {/* Preview Avatars */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center -space-x-1.5 shrink-0">
                  <AgentAvatar role="lead-architect" style={opt.id} size="sm" />
                  <AgentAvatar role="subagent-qa-reviewer" style={opt.id} size="sm" />
                  <AgentAvatar role="subagent-log-analyzer" style={opt.id} size="sm" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-app-text truncate">{opt.label}</span>
                  </div>
                  <span className="text-[10px] text-app-muted truncate block">{opt.tagline}</span>
                </div>
              </div>

              {/* Selected Checkmark */}
              <div
                className={clsx(
                  "w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-colors",
                  isSelected
                    ? "bg-primary border-primary text-white"
                    : "border-border text-transparent group-hover:border-primary/40"
                )}
              >
                <Check size={10} strokeWidth={3} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
