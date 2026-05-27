import { hashHue } from '../../data';
import type { CSSProperties } from 'react';

interface AlbumProps {
  name?: string;
  artist?: string;
  size?: number;
  radius?: number;
  showInitials?: boolean;
  style?: CSSProperties;
  className?: string;
}

export function Album({
  name = '',
  artist = '',
  size = 56,
  radius = 8,
  showInitials = false,
  style = {},
  className = '',
}: AlbumProps) {
  const hue  = hashHue(name + artist);
  const hue2 = (hue + 38) % 360;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(135deg, hsl(${hue} 38% 42%), hsl(${hue2} 46% 22%))`,
        position: 'relative',
        flexShrink: 0,
        overflow: 'hidden',
        boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 12px rgba(0,0,0,0.28)',
        ...style,
      }}
    >
      {/* Highlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius,
          background: `radial-gradient(120% 90% at 20% 10%, rgba(255,255,255,0.18), transparent 55%)`,
        }}
      />
      {showInitials && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            padding: size * 0.12,
            color: 'rgba(255,255,255,0.92)',
            fontFamily: 'var(--font-mono)',
            fontSize: size * 0.1,
            fontWeight: 500,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {name.slice(0, 18)}
        </div>
      )}
    </div>
  );
}
