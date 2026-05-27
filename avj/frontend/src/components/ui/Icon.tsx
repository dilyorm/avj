import type { CSSProperties } from 'react';

export type IconName =
  | 'back' | 'close' | 'share' | 'settings' | 'plus' | 'check'
  | 'search' | 'qr' | 'chev' | 'play' | 'spark' | 'note' | 'heart'
  | 'globe' | 'tg' | 'logout' | 'history' | 'sun' | 'moon' | 'mute'
  | 'home' | 'user' | 'music';

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: string;
  sw?: number;
  style?: CSSProperties;
  fill?: string;
}

export function Icon({ name, size = 18, stroke = 'currentColor', sw = 1.8, style = {}, fill = 'none' }: IconProps) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill, style };
  const s = { stroke, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'back':
      return <svg {...p}><path d="M15 5l-7 7 7 7" {...s} /></svg>;
    case 'close':
      return <svg {...p}><path d="M6 6l12 12M18 6L6 18" {...s} /></svg>;
    case 'share':
      return <svg {...p}><path d="M12 4v12m0-12l-4 4m4-4l4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" {...s} /></svg>;
    case 'settings':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth={sw} />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </svg>
      );
    case 'plus':
      return <svg {...p}><path d="M12 5v14M5 12h14" {...s} /></svg>;
    case 'check':
      return <svg {...p}><path d="M5 12l4 4 10-10" {...s} /></svg>;
    case 'search':
      return <svg {...p}><circle cx="11" cy="11" r="6.5" stroke={stroke} strokeWidth={sw} /><path d="M16 16l4 4" {...s} /></svg>;
    case 'qr':
      return (
        <svg {...p}>
          <rect x="4" y="4" width="6" height="6" stroke={stroke} strokeWidth={sw} rx="1" />
          <rect x="14" y="4" width="6" height="6" stroke={stroke} strokeWidth={sw} rx="1" />
          <rect x="4" y="14" width="6" height="6" stroke={stroke} strokeWidth={sw} rx="1" />
          <path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" fill={stroke} />
        </svg>
      );
    case 'chev':
      return <svg {...p}><path d="M9 6l6 6-6 6" {...s} /></svg>;
    case 'play':
      return <svg {...p}><path d="M7 5l12 7-12 7V5z" fill={stroke} /></svg>;
    case 'spark':
      return <svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" {...s} /></svg>;
    case 'note':
      return <svg {...p}><path d="M9 18V6l11-3v12" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" /><circle cx="6" cy="18" r="3" stroke={stroke} strokeWidth={sw} /><circle cx="17" cy="15" r="3" stroke={stroke} strokeWidth={sw} /></svg>;
    case 'heart':
      return <svg {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" {...s} /></svg>;
    case 'globe':
      return <svg {...p}><circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth={sw} /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke={stroke} strokeWidth={sw} /></svg>;
    case 'tg':
      return <svg {...p}><path d="M20 5L3 12l6 2 2 6 3-3 5 4 1-16z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" /></svg>;
    case 'logout':
      return <svg {...p}><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 17l-5-5 5-5M5 12h12" {...s} /></svg>;
    case 'history':
      return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" {...s} /><path d="M12 8v4l3 2" {...s} /></svg>;
    case 'sun':
      return <svg {...p}><circle cx="12" cy="12" r="4" stroke={stroke} strokeWidth={sw} /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" {...s} /></svg>;
    case 'moon':
      return <svg {...p}><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" /></svg>;
    case 'mute':
      return <svg {...p}><path d="M11 5L6 9H3v6h3l5 4V5z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" /><path d="M16 9l5 5M21 9l-5 5" {...s} /></svg>;
    case 'home':
      return <svg {...p}><path d="M3 9l9-6 9 6v9a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1V9z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" fill={fill} /></svg>;
    case 'user':
      return <svg {...p}><circle cx="12" cy="8" r="3.5" stroke={stroke} strokeWidth={sw} /><path d="M4 19c1.5-3.5 4-5 8-5s6.5 1.5 8 5" {...s} /></svg>;
    case 'music':
      return <svg {...p}><path d="M9 18V6l11-3v12" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" /><circle cx="6" cy="18" r="3" stroke={stroke} strokeWidth={sw} /><circle cx="17" cy="15" r="3" stroke={stroke} strokeWidth={sw} /></svg>;
    default:
      return null;
  }
}
