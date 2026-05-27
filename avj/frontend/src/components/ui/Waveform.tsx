interface WaveformProps {
  bars?: number;
  height?: number;
  color?: string;
  gap?: number;
  width?: number;
}

export function Waveform({
  bars = 4,
  height = 14,
  color = 'var(--accent)',
  gap = 2.5,
  width = 3,
}: WaveformProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap, height, flexShrink: 0 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          style={{
            display: 'block',
            width,
            height: '100%',
            background: color,
            borderRadius: 2,
            transformOrigin: 'center',
            animation: `avj-wave ${0.7 + (i % 3) * 0.18}s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
