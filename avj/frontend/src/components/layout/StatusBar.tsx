interface StatusBarProps {
  time?: string;
}

export function StatusBar({ time = '21:04' }: StatusBarProps) {
  return (
    <div
      style={{
        height: 44,
        padding: '0 22px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'var(--text)',
        fontFamily: 'var(--font)',
        fontWeight: 600,
        fontSize: 14,
        letterSpacing: -0.1,
      }}
    >
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Signal bars */}
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <rect x="0" y="6" width="3" height="4" rx="0.6" fill="currentColor" />
          <rect x="4.5" y="4" width="3" height="6" rx="0.6" fill="currentColor" />
          <rect x="9" y="2" width="3" height="8" rx="0.6" fill="currentColor" />
          <rect x="13" y="0" width="3" height="10" rx="0.6" fill="currentColor" />
        </svg>
        {/* Wifi */}
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path d="M7 2c2 0 3.8.8 5 2l-1 1c-1-1-2.4-1.5-4-1.5S4 4 3 5L2 4c1.2-1.2 3-2 5-2zM7 5c1 0 2 .4 2.6 1l-1 1c-.4-.4-1-.6-1.6-.6s-1.2.2-1.6.6l-1-1C5 5.4 6 5 7 5z" fill="currentColor" />
          <circle cx="7" cy="8.6" r="1" fill="currentColor" />
        </svg>
        {/* Battery */}
        <div style={{ width: 24, height: 10, borderRadius: 3, border: '1px solid currentColor', position: 'relative', opacity: 0.5 }}>
          <div style={{ position: 'absolute', top: 1.5, left: 1.5, bottom: 1.5, width: 14, background: 'currentColor', borderRadius: 1.5 }} />
          <div style={{ position: 'absolute', right: -3, top: 3, width: 1.5, height: 4, background: 'currentColor', borderRadius: 1 }} />
        </div>
      </div>
    </div>
  );
}
