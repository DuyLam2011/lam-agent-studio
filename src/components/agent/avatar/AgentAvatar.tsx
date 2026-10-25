import React from 'react';
import clsx from 'clsx';
import { AvatarStyle, AgentRoleType, AGENT_VISUAL_REGISTRY } from '../../../types/avatar';
import { useAgentStore } from '../../../store/useAgentStore';
import { renderAvatarSvg } from './avatarSvgGenerators';

export interface AgentAvatarProps {
  role?: AgentRoleType | string;
  style?: AvatarStyle;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatusDot?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: { px: 16, box: 'w-4 h-4', dot: 'w-1.5 h-1.5 -bottom-0.5 -right-0.5' },
  sm: { px: 20, box: 'w-5 h-5', dot: 'w-2 h-2 -bottom-0.5 -right-0.5' },
  md: { px: 26, box: 'w-6.5 h-6.5', dot: 'w-2 h-2 -bottom-0.5 -right-0.5' },
  lg: { px: 34, box: 'w-8.5 h-8.5', dot: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5' },
  xl: { px: 48, box: 'w-12 h-12', dot: 'w-3 h-3 -bottom-0.5 -right-0.5' },
};

const resolveRole = (input?: string): AgentRoleType => {
  if (!input) return 'lead-architect';
  if (input === 'user') return 'user';
  if (input.includes('qa') || input.includes('review')) return 'subagent-qa-reviewer';
  if (input.includes('log') || input.includes('terminal') || input.includes('diag')) return 'subagent-log-analyzer';
  if (input.includes('ui') || input.includes('dom') || input.includes('inspector')) return 'subagent-ui-inspector';
  if (input.includes('mcp')) return 'subagent-mcp-bridge';
  if (input.includes('sec') || input.includes('harness')) return 'subagent-security-harness';
  return 'lead-architect';
};

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  role = 'lead-architect',
  style,
  size = 'md',
  showStatusDot = false,
  showTooltip = false,
  className
}) => {
  const globalAvatarStyle = useAgentStore(s => s.avatarStyle) || 'pixel';
  const effectiveStyle = style || globalAvatarStyle;
  const effectiveRole = resolveRole(role);
  const meta = AGENT_VISUAL_REGISTRY[effectiveRole] || AGENT_VISUAL_REGISTRY['lead-architect'];
  const sizeConfig = SIZE_MAP[size];

  return (
    <div
      className={clsx(
        "relative shrink-0 flex items-center justify-center rounded-lg transition-transform duration-150 hover:scale-105 group select-none",
        sizeConfig.box,
        className
      )}
      style={{
        boxShadow: `0 0 10px ${meta.glowColor}`
      }}
      title={showTooltip ? `${meta.displayName} (${meta.badgeLabel}) - ${effectiveStyle.toUpperCase()} style` : undefined}
    >
      {/* Dynamic Procedural SVG Avatar */}
      <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center">
        {renderAvatarSvg({ role: effectiveRole, style: effectiveStyle, sizePx: sizeConfig.px })}
      </div>

      {/* Online / Active Pulse Dot */}
      {showStatusDot && (
        <span
          className={clsx(
            "absolute rounded-full border border-black/80",
            sizeConfig.dot
          )}
          style={{ backgroundColor: meta.themeColor }}
        >
          <span
            className="animate-ping absolute inset-0 rounded-full opacity-75"
            style={{ backgroundColor: meta.themeColor }}
          />
        </span>
      )}

      {/* Tooltip Overlay */}
      {showTooltip && (
        <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap surface-panel px-2 py-1 rounded-md text-[10px] shadow-xl border border-border flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: meta.themeColor }}
          />
          <span className="font-semibold text-app-text">{meta.displayName}</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-app-muted uppercase font-mono">
            {meta.badgeLabel}
          </span>
        </div>
      )}
    </div>
  );
};
