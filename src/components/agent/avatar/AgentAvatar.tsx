import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  if (input.includes('backend')) return 'subagent-backend-reviewer';
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

  const avatarRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; isRightAligned: boolean } | null>(null);

  const handleMouseEnter = () => {
    if (!showTooltip || !avatarRef.current) return;
    const rect = avatarRef.current.getBoundingClientRect();
    const isRightEdge = rect.right > window.innerWidth - 220;
    const targetTop = Math.max(12, Math.min(window.innerHeight - 40, rect.top + rect.height / 2));
    const targetLeft = isRightEdge ? rect.left - 8 : rect.right + 8;
    setTooltipPos({ top: targetTop, left: targetLeft, isRightAligned: isRightEdge });
    setIsHovered(true);
  };

  const handleMouseLeave = () => setIsHovered(false);

  useEffect(() => {
    if (!isHovered) return;
    const onScrollOrResize = () => setIsHovered(false);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isHovered]);

  return (
    <div
      ref={avatarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        "relative shrink-0 flex items-center justify-center rounded-lg transition-transform duration-150 hover:scale-105 select-none cursor-pointer",
        sizeConfig.box,
        className
      )}
      style={{ boxShadow: `0 0 10px ${meta.glowColor}` }}
    >
      {/* Dynamic Procedural SVG Avatar */}
      <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center pointer-events-none">
        {renderAvatarSvg({ role: effectiveRole, style: effectiveStyle, sizePx: sizeConfig.px })}
      </div>

      {/* Online / Active Pulse Dot */}
      {showStatusDot && (
        <span
          className={clsx("absolute rounded-full border border-black/80 pointer-events-none", sizeConfig.dot)}
          style={{ backgroundColor: meta.themeColor }}
        >
          <span
            className="animate-ping absolute inset-0 rounded-full opacity-75"
            style={{ backgroundColor: meta.themeColor }}
          />
        </span>
      )}

      {/* Unclipped Portal Tooltip (Breaks out of all overflow:hidden ancestors) */}
      {showTooltip && isHovered && tooltipPos && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: tooltipPos.isRightAligned ? 'translate(-100%, -50%)' : 'translateY(-50%)',
            zIndex: 999999
          }}
          className="pointer-events-none whitespace-nowrap surface-dropdown px-2.5 py-1.5 rounded-lg text-[10.5px] shadow-2xl border border-border flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100 select-none"
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta.themeColor }} />
          <div className="flex flex-col">
            <span className="font-semibold text-app-text leading-tight">{meta.displayName}</span>
            <span className="text-[9px] text-app-muted leading-tight">{meta.description}</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-app-muted uppercase font-mono font-semibold ml-1">
            {meta.badgeLabel}
          </span>
        </div>,
        document.body
      )}
    </div>
  );
};