import { hashHue } from '../../data';
import type { CSSProperties } from 'react';

interface AvatarProps {
  name?: string;
  size?: number;
  live?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Avatar({ name = '', size = 40, live = false, style = {}, onClick }: AvatarProps) {
  const hue = hashHue(name);
  const initials = name
    .split(' ')
    .map(s => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div onClick={onClick} style={{ position: 'relative', width: size, height: size, flexShrink: 0, cursor: onClick ? 'pointer' : 'default', ...style }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `linear-gradient(140deg, hsl(${hue} 35% 45%), hsl(${(hue + 50) % 360} 40% 25%))`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 600,
          fontSize: size * 0.36,
          letterSpacing: 0.2,
          boxShadow: live ? `0 0 0 2px var(--bg), 0 0 0 3.5px var(--accent)` : 'none',
          fontFamily: 'var(--font)',
        }}
      >
        {initials}
      </div>
      {live && (
        <span
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: Math.max(size * 0.32, 10),
            height: Math.max(size * 0.32, 10),
            borderRadius: '50%',
            background: 'var(--accent)',
            border: '2px solid var(--bg)',
            animation: 'avj-pulse-dot 1.8s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}
