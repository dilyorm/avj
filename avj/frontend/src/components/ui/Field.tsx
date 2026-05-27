interface FieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  hint?: string;
  onChange?: (v: string) => void;
  type?: string;
}

export function Field({ label, value, placeholder, hint, onChange, type = 'text' }: FieldProps) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 14,
        background: 'var(--surface)',
        border: '1px solid var(--hairline)',
        transition: 'border-color 0.2s',
      }}
      onFocus={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-dim)')}
      onBlur={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--hairline)')}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          marginBottom: 4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      {onChange ? (
        <input
          type={type}
          value={value || ''}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 15.5,
            fontWeight: 600,
            color: value ? 'var(--text)' : 'var(--text-dim)',
            fontFamily: 'var(--font)',
            padding: 0,
          }}
        />
      ) : (
        <div style={{ fontSize: 15.5, fontWeight: 600, color: value ? 'var(--text)' : 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
          {value || placeholder}
          {value && (
            <span
              style={{
                display: 'inline-block',
                width: 1.5,
                height: 18,
                background: 'var(--accent)',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'avj-pulse-dot 1s ease-in-out infinite',
              }}
            />
          )}
        </div>
      )}
      {hint && (
        <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {hint}
        </div>
      )}
    </div>
  );
}
