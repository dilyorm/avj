import type { Platform } from '../../data/types';

type TagSize = 'xs' | 'sm' | 'md';

interface PlatformTagProps {
  platform?: Platform;
  size?: TagSize;
}

const SIZES = {
  xs: { font: 10, pad: '2px 6px', dot: 5, gap: 4 },
  sm: { font: 11, pad: '3px 8px', dot: 6, gap: 5 },
  md: { font: 12, pad: '4px 10px', dot: 7, gap: 6 },
};

export function PlatformTag({ platform = 'spotify', size = 'sm' }: PlatformTagProps) {
  const isSpotify = platform === 'spotify';
  const label = isSpotify ? 'Spotify' : 'Yandex';
  const dotColor = isSpotify ? 'var(--platform-spotify)' : 'var(--platform-yandex)';
  const s = SIZES[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.pad,
        borderRadius: 999,
        background: 'transparent',
        border: '1px solid var(--hairline)',
        color: 'var(--text-muted)',
        fontSize: s.font,
        fontWeight: 500,
        letterSpacing: 0.2,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font)',
      }}
    >
      <span
        style={{
          width: s.dot,
          height: s.dot,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
