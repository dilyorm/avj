import type { ReactNode, CSSProperties } from 'react';

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
  style?: CSSProperties;
}

export function SectionHeader({ title, action, style = {} }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        padding: '0 20px 8px',
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.2,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {title}
      </div>
      {action && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{action}</div>
      )}
    </div>
  );
}
