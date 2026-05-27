import { Icon } from './Icon';
import { Button } from './Button';
import type { Platform } from '../../data/types';

interface ConnectRowProps {
  platform: Platform;
  name: string;
  sub: string;
  connected?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function ConnectRow({ platform, name, sub, connected = false, onConnect, onDisconnect }: ConnectRowProps) {
  const dot = platform === 'spotify' ? 'var(--platform-spotify)' : 'var(--platform-yandex)';

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 16,
        background: 'var(--surface)',
        border: connected ? '1px solid var(--accent-dim)' : '1px solid var(--hairline)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        transition: 'border-color 0.2s',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <span style={{ width: 14, height: 14, borderRadius: '50%', background: dot }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
      </div>
      {connected ? (
        onDisconnect ? (
          <Button variant="ghost" size="sm" full={false} onClick={onDisconnect} style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Uzish
          </Button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            <Icon name="check" size={16} sw={2.4} stroke="var(--accent)" />
            Ulangan
          </div>
        )
      ) : (
        <Button variant="secondary" size="sm" full={false} onClick={onConnect}>Ulash</Button>
      )}
    </div>
  );
}
