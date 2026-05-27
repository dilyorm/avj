import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { HomeIndicator } from '../components/layout/HomeIndicator';
import { Avatar } from '../components/ui/Avatar';
import { Album } from '../components/ui/Album';
import { LiveChip } from '../components/ui/LiveChip';
import { PlatformTag } from '../components/ui/PlatformTag';
import { Waveform } from '../components/ui/Waveform';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import type { FriendData } from '../context/FeedContext';

export function FriendProfileScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [friend, setFriend] = useState<FriendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<FriendData>(`/friends/${id}`)
      .then(data => { setFriend(data); setError(null); })
      .catch(e => setError(e instanceof Error ? e.message : 'Yuklab bo\'lmadi'))
      .finally(() => setLoading(false));
  }, [id]);

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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 24px' }}>
          {/* Identity skeleton */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out infinite alternate' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: '55%', height: 16, borderRadius: 6, background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out 0.1s infinite alternate' }} />
              <div style={{ width: '35%', height: 11, borderRadius: 6, background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out 0.2s infinite alternate' }} />
            </div>
          </div>
          {/* Card skeleton */}
          <div style={{ height: 100, borderRadius: 18, background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out 0.3s infinite alternate' }} />
        </div>
        <HomeIndicator />
      </AppShell>
    );
  }

  if (error || !friend) {
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
          <div style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>{error ?? 'Profil topilmadi'}</div>
          <Button variant="secondary" size="sm" full={false} onClick={() => navigate(-1)}>Orqaga</Button>
        </div>
        <HomeIndicator />
      </AppShell>
    );
  }

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
            <Icon name="settings" size={20} stroke="var(--text)" sw={1.6} />
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="no-scrollbar">
        {/* Identity */}
        <div style={{ padding: '4px 24px 16px', display: 'flex', gap: 16, alignItems: 'center' }}>
          <Avatar name={friend.name} size={70} live={friend.status === 'live'} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{friend.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>@{friend.handle}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {friend.spotify && <PlatformTag platform="spotify" size="xs" />}
              {friend.yandex && <PlatformTag platform="yandex" size="xs" />}
            </div>
          </div>
        </div>

        {/* Now playing */}
        <div style={{ padding: '0 16px' }}>
          {friend.status === 'live' && friend.song ? (
            <div
              style={{
                padding: 14,
                borderRadius: 18,
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent-dim)',
                cursor: 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <LiveChip label="HOZIR TINGLAMOQDA" />
                <div style={{ flex: 1 }} />
                <Waveform bars={4} height={14} />
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Album name={friend.album ?? ''} artist={friend.artist ?? ''} size={72} radius={10} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friend.song}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friend.artist}</div>
                  {friend.mins && (
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {friend.mins} · {friend.platform === 'spotify' ? 'Spotify' : 'Yandex'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: 18,
                borderRadius: 18,
                background: 'var(--surface)',
                border: '1px dashed var(--hairline)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 12,
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="mute" size={22} stroke="var(--text-muted)" sw={1.6} />
              </div>
              <div>
                <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: -0.3 }}>Hozir hech narsa tinglamayapti</div>
                <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Oxirgi marta · <span style={{ fontFamily: 'var(--font-mono)' }}>{friend.ago}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent tracks */}
        {friend.recent && friend.recent.length > 0 && (
          <div style={{ flex: 1, marginTop: 18 }}>
            <SectionHeader title="Oxirgi tracklar" />
            {friend.recent.map(r => (
              <div
                key={r.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px', cursor: 'default' }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)')}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
              >
                <Album name={r.album} artist={r.artist} size={36} radius={6} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.song}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.artist}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {new Date(r.started_at).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <HomeIndicator />
    </AppShell>
  );
}
