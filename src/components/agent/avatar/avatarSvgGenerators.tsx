import React from 'react';
import { AvatarStyle, AgentRoleType, AGENT_VISUAL_REGISTRY } from '../../../types/avatar';

interface SvgGeneratorProps {
  role: AgentRoleType;
  style: AvatarStyle;
  sizePx: number;
}

export const renderAvatarSvg = ({ role, style, sizePx }: SvgGeneratorProps): React.ReactElement => {
  const meta = AGENT_VISUAL_REGISTRY[role] || AGENT_VISUAL_REGISTRY['lead-architect'];
  const color = meta.themeColor;
  const isUser = role === 'user';

  switch (style) {
    case 'pixel':
      return (
        <svg width={sizePx} height={sizePx} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="16" height="16" rx="2" fill="#0d1117" />
          {/* Base Head */}
          <rect x="3" y="3" width="10" height="10" fill={color} fillOpacity="0.85" />
          <rect x="4" y="4" width="8" height="8" fill={color} />
          {/* Facial features */}
          {isUser ? (
            <>
              <rect x="5" y="6" width="2" height="2" fill="#ffffff" />
              <rect x="9" y="6" width="2" height="2" fill="#ffffff" />
              <rect x="6" y="10" width="4" height="1" fill="#ffffff" />
            </>
          ) : (
            <>
              {/* Robot Visor / Sensors */}
              <rect x="4" y="6" width="8" height="2" fill="#050505" />
              <rect x="5" y="6" width="2" height="2" fill="#22d3ee" />
              <rect x="9" y="6" width="2" height="2" fill="#22d3ee" />
              <rect x="7" y="1" width="2" height="2" fill={color} />
              <rect x="5" y="10" width="6" height="1" fill="#1e293b" />
            </>
          )}
          {/* Accent corners */}
          <rect x="2" y="2" width="1" height="1" fill="#ffffff" fillOpacity="0.4" />
        </svg>
      );

    case 'lowpoly':
      return (
        <svg width={sizePx} height={sizePx} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#090d16" />
          {/* Low-Poly Facets */}
          <polygon points="12,2 4,8 12,12" fill={color} fillOpacity="0.9" />
          <polygon points="12,2 20,8 12,12" fill={color} fillOpacity="0.7" />
          <polygon points="4,8 12,12 8,20" fill={color} fillOpacity="0.6" />
          <polygon points="20,8 12,12 16,20" fill={color} fillOpacity="0.45" />
          <polygon points="12,12 8,20 12,22" fill={color} fillOpacity="0.8" />
          <polygon points="12,12 16,20 12,22" fill={color} fillOpacity="0.65" />
          {/* Center Gem Eye */}
          <circle cx="12" cy="12" r="2" fill="#ffffff" fillOpacity="0.95" />
        </svg>
      );

    case 'cyberpunk':
      return (
        <svg width={sizePx} height={sizePx} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="5" fill="#0a0518" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
          {/* Neon Grid Lines */}
          <path d="M2 12H22M12 2V22" stroke={color} strokeWidth="0.5" strokeOpacity="0.25" />
          {/* Glowing Visor */}
          <rect x="4" y="9" width="16" height="5" rx="1.5" fill="#030014" stroke="#00f5ff" strokeWidth="1" />
          <rect x="6" y="10.5" width="12" height="2" rx="1" fill="#00f5ff" fillOpacity="0.9" />
          {/* Cyber Antennas */}
          <path d="M6 5L8 9M18 5L16 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="18" r="1.5" fill="#ff007f" />
        </svg>
      );

    case 'origami':
      return (
        <svg width={sizePx} height={sizePx} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#111827" />
          {/* Paper Fold Triangles */}
          <polygon points="12,3 3,12 12,14" fill={color} fillOpacity="0.9" />
          <polygon points="12,3 21,12 12,14" fill={color} fillOpacity="0.6" />
          <polygon points="3,12 12,21 12,14" fill={color} fillOpacity="0.4" />
          <polygon points="21,12 12,21 12,14" fill={color} fillOpacity="0.75" />
          <line x1="12" y1="3" x2="12" y2="21" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.4" />
        </svg>
      );

    case 'minimal':
    default:
      return (
        <svg width={sizePx} height={sizePx} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#18181b" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
          {isUser ? (
            <>
              <circle cx="12" cy="8" r="3.5" fill={color} />
              <path d="M5.5 19C5.5 15.5 8.5 13.5 12 13.5C15.5 13.5 18.5 15.5 18.5 19" stroke={color} strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <rect x="6" y="6" width="12" height="12" rx="3" stroke={color} strokeWidth="1.75" />
              <circle cx="9.5" cy="11" r="1.2" fill={color} />
              <circle cx="14.5" cy="11" r="1.2" fill={color} />
              <path d="M9 14.5H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
        </svg>
      );
  }
};
