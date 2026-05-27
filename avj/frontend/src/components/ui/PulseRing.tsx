interface PulseRingProps {
  size?: number;
  color?: string;
}

export function PulseRing({ size = 8, color = 'var(--accent)' }: PulseRingProps) {
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: color,
          opacity: 0.6,
          animation: 'avj-pulse-ring 1.8s ease-out infinite',
        }}
      />
      <span
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: color,
          animation: 'avj-pulse-dot 1.8s ease-in-out infinite',
        }}
      />
    </span>
  );
}
