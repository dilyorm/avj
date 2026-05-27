import { Avatar } from './Avatar';
import { Album } from './Album';
import { PlatformTag } from './PlatformTag';
import { LiveChip } from './LiveChip';
import { Waveform } from './Waveform';
import { Icon } from './Icon';
import type { Platform, ListeningStatus } from '../../data/types';

type Density = 'card' | 'list' | 'hero';

interface ListeningCardProps {
  friend: string;
  song: string;
  artist: string;
  album: string;
  platform?: Platform;
  ago?: string;
  status?: ListeningStatus;
  density?: Density;
  onClick?: () => void;
  noMargin?: boolean;
}

export function ListeningCard({
  friend,
  song,
  artist,
  album,
  platform = 'spotify',
  ago,
  status = 'live',
  density = 'card',
  onClick,
  noMargin = false,
}: ListeningCardProps) {

  if (density === 'list') {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => onClick && ((e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)')}
        onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
      >
        <div style={{ position: 'relative' }}>
          <Avatar name={friend} size={40} live={status === 'live'} />
        </div>
        <Album name={album} artist={artist} size={42} radius={6} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 2 }}>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{friend}</span>
            <span>·</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{ago}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</div>
        </div>
        {status === 'live'
          ? <Waveform bars={3} height={14} />
          : <Icon name="chev" size={16} stroke="var(--text-dim)" />}
      </div>
    );
  }

  if (density === 'hero') {
    return (
      <div
        onClick={onClick}
        style={{
          margin: '0 16px',
          padding: 18,
          borderRadius: 22,
          background: 'var(--surface)',
          border: '1px solid var(--hairline)',
          cursor: onClick ? 'pointer' : 'default',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Avatar name={friend} size={28} live={status === 'live'} />
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{friend}</div>
          {status === 'live'
            ? <LiveChip label="HOZIR" />
            : <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{ago}</span>}
        </div>
        <Album name={album} artist={artist} size={310} radius={14} style={{ width: '100%', height: 220 }} />
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist} · <span style={{ color: 'var(--text-dim)' }}>{album}</span></div>
          </div>
          <PlatformTag platform={platform} />
        </div>
      </div>
    );
  }

  // default — card
  return (
    <div
      onClick={onClick}
      style={{
        margin: noMargin ? 0 : '0 16px',
        padding: 14,
        borderRadius: 18,
        background: 'var(--surface)',
        border: '1px solid var(--hairline)',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Avatar name={friend} size={28} live={status === 'live'} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.2 }}>{friend}</div>
        </div>
        {status === 'live'
          ? <LiveChip label="HOZIR" />
          : <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{ago}</span>}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Album name={album} artist={artist} size={68} radius={10} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlatformTag platform={platform} size="xs" />
            {status === 'live' && <Waveform bars={4} height={11} />}
          </div>
        </div>
      </div>
    </div>
  );
}
