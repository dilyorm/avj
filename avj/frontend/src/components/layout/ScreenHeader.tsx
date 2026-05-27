import type { ReactNode, CSSProperties } from 'react';

interface ScreenHeaderProps {
  left?: ReactNode;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  style?: CSSProperties;
}

export function ScreenHeader({ left, title, subtitle, right, style = {} }: ScreenHeaderProps) {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: '6px 16px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        ...style,
      }}
    >
      {left}
      <div style={{ flex: 1, minWidth: 0 }}>
        {subtitle && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {subtitle}
          </div>
        )}
        {title && (
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6 }}>{title}</div>
        )}
      </div>
      {right}
    </div>
  );
}
