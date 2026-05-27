import { PulseRing } from './PulseRing';

interface LiveChipProps {
  label?: string;
}

export function LiveChip({ label = 'HOZIR' }: LiveChipProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px 3px 7px',
        borderRadius: 999,
        background: 'var(--accent-soft)',
        color: 'var(--accent)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.8,
        lineHeight: 1,
        fontFamily: 'var(--font-mono)',
        whiteSpace: 'nowrap',
      }}
    >
      <PulseRing size={6} />
      {label}
    </span>
  );
}
