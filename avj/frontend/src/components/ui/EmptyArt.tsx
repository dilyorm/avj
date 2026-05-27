import { Icon, type IconName } from './Icon';

interface EmptyArtProps {
  glyph?: IconName;
}

export function EmptyArt({ glyph = 'note' }: EmptyArtProps) {
  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: 60,
        background: 'var(--surface-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--hairline)',
        flexShrink: 0,
      }}
    >
      <Icon name={glyph} size={42} stroke="var(--text-muted)" sw={1.4} />
    </div>
  );
}
