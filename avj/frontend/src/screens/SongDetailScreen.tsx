import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { HomeIndicator } from '../components/layout/HomeIndicator';
import { Album } from '../components/ui/Album';
import { Avatar } from '../components/ui/Avatar';
import { LiveChip } from '../components/ui/LiveChip';
import { PlatformTag } from '../components/ui/PlatformTag';
import { Waveform } from '../components/ui/Waveform';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import type { FriendData } from '../context/FeedContext';

export function SongDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [friend, setFriend] = useState<FriendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get<FriendData>(`/friends/${id}`)
      .then(setFriend)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const progressPct = friend?.mins
    ? (() => {
        const [cur, tot] = friend.mins.split(' / ').map(t => {
          const [m, s] = t.split(':').map(Number);
          return m * 60 + s;
        });
        return tot > 0 ? Math.round((cur / tot) * 100) : 22;
      })()
    : 22;

  if (loading) {
    return (
      <AppShell showTabBar={false}>
        <ScreenHeader
          left={
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4 }}>
              <Icon name="back" size={22} stroke="var(--text)" />
            </button>
          }
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px 16px', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 280, height: 260, borderRadius: 20, background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out infinite alternate' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ width: '60%', height: 22, borderRadius: 6, background: 'var(--surface-3)' }} />
            <div style={{ width: '40%', height: 14, borderRadius: 6, background: 'var(--surface-3)' }} />
          </div>
        </div>
        <HomeIndicator />
      </AppShell>
    );
  }

  if (!friend || (!friend.song && !friend.recent?.length)) {
    return (
      <AppShell showTabBar={false}>
        <ScreenHeader
          left={
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4 }}>
              <Icon name="back" size={22} stroke="var(--text)" />
            </button>
          }
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Hozirda ma'lumot yo'q</div>
          <Button variant="secondary" size="sm" full={false} onClick={() => navigate(-1)}>Orqaga</Button>
        </div>
        <HomeIndicator />
      </AppShell>
    );
  }

  // Show current song or fallback to most recent
  const song   = friend.song   ?? friend.recent?.[0]?.song   ?? '';
  const artist = friend.artist ?? friend.recent?.[0]?.artist ?? '';
  const album  = friend.album  ?? friend.recent?.[0]?.album  ?? '';
  const platform = (friend.platform ?? friend.recent?.[0]?.platform ?? 'spotify') as 'spotify' | 'yandex';

  return (
    <AppShell showTabBar={false}>
      <ScreenHeader
        left={
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4 }}>
            <Icon name="back" size={22} stroke="var(--text)" />
          </button>
        }
        right={
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4 }}>
            <Icon name="share" size={20} stroke="var(--text)" />
          </button>
        }
      />

      <div
        style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '0 24px 16px' }}
        className="no-scrollbar"
      >
        {/* Big album art */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Album
            name={album}
            artist={artist}
            size={300}
            radius={20}
            style={{ width: '100%', maxWidth: 300, height: 280 }}
          />
        </div>

        {/* Title block */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {friend.status === 'live' && <LiveChip label="HOZIR" />}
            <PlatformTag platform={platform} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.1 }}>{song}</div>
          <div style={{ marginTop: 4, fontSize: 15, color: 'var(--text-muted)' }}>
            {artist}{' '}
            <span style={{ color: 'var(--text-dim)' }}>· {album}</span>
          </div>
        </div>

        {/* Progress bar (only if we have mins data) */}
        {friend.mins && (
          <div style={{ marginTop: 'auto' }}>
            <div
              style={{
                height: 3,
                borderRadius: 2,
                background: 'var(--surface-2)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${progressPct}%`,
                  background: 'var(--accent)',
                  borderRadius: 2,
                }}
              />
            </div>
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              <span>{friend.mins.split(' / ')[0]}</span>
              <span>{friend.mins.split(' / ')[1]}</span>
            </div>
          </div>
        )}

        {/* Listening now indicator */}
        {friend.status === 'live' && (
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 14,
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-dim)',
            }}
          >
            <Avatar name={friend.name} size={36} live />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{friend.name} hozir tinglamoqda</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>@{friend.handle}</div>
            </div>
            <Waveform bars={4} height={14} />
          </div>
        )}
      </div>
      <HomeIndicator />
    </AppShell>
  );
}
