export function HomeIndicator() {
  return (
    <div
      className="avj-pwa-only"
      style={{
        height: 28,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingBottom: 8,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 134,
          height: 5,
          borderRadius: 100,
          background: 'var(--text)',
          opacity: 0.6,
        }}
      />
    </div>
  );
}
