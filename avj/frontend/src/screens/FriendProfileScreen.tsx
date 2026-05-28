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
import { useLang } from '../context/LangContext';
import type { FriendData } from '../context/FeedContext';

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

function FriendActionButton({
  status,
  userId,
  onStatusChange,
}: {
  status: FriendshipStatus;
  userId: string;
  onStatusChange: (s: FriendshipStatus) => void;
}) {
  const [loading, setLoading] = useState(false);
  const { t } = useLang();

  const act = async (action: 'add' | 'accept' | 'reject' | 'remove') => {
    setLoading(true);
    try {
      if (action === 'add') {
        const r = await api.post<{ status: string }>(`/friends/${userId}/add`, {});
        onStatusChange(r.status as FriendshipStatus);
      } else if (action === 'accept') {
        await api.post(`/friends/${userId}/accept`, {});
        onStatusChange('friends');
      } else if (action === 'reject') {
        await api.post(`/friends/${userId}/reject`, {});
        onStatusChange('none');
      } else {
        await api.delete(`/friends/${userId}`);
        onStatusChange('none');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (status === 'friends') {
    return (
      <button
        onClick={() => act('remove')}
        disabled={loading}
        style={{ padding: '9px 18px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)' }}
      >
        {t.unfriend}
      </button>
    );
  }
  if (status === 'pending_sent') {
    return (
      <button
        onClick={() => act('reject')}
        disabled={loading}
        style={{ padding: '9px 18px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)' }}
      >
        {t.requestSent}
      </button>
    );
  }
  if (status === 'pending_received') {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => act('accept')}
          disabled={loading}
          style={{ padding: '9px 18px', borderRadius: 12, background: 'var(--accent)', color: '#000', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}
        >
          {t.acceptRequest}
        </button>
        <button
          onClick={() => act('reject')}
          disabled={loading}
          style={{ padding: '9px 18px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)' }}
        >
          {t.rejectRequest}
        </button>
      </div>
    );
  }
  // none
  return (
    <button
      onClick={() => act('add')}
      disabled={loading}
      style={{ padding: '9px 18px', borderRadius: 12, background: 'var(--accent)', color: '#000', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}
    >
      {t.sendRequest}
    </button>
  );
}

export function FriendProfileScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useLang();

  const [friend, setFriend] = useState<FriendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fsStatus, setFsStatus] = useState<FriendshipStatus>('none');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<FriendData>(`/friends/${id}`)
      .then(data => {
        setFriend(data);
        setFsStatus((data.friendship_status ?? 'none') as FriendshipStatus);
        setError(null);
      })
      .catch(e => setError(e instanceof Error ? e.message : t.loadFailed))
      .finally(() => setLoading(false));
  }, [id]);

  const backBtn = (
    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4 }}>
      <Icon name="back" size={22} stroke="var(--text)" />
    </button>
  );

  if (loading) {
    return (
      <AppShell showTabBar={false}>
        <ScreenHeader left={backBtn} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 24px' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out infinite alternate' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: '55%', height: 16, borderRadius: 6, background: 'var(--surface-3)' }} />
              <div style={{ width: '35%', height: 11, borderRadius: 6, background: 'var(--surface-3)' }} />
            </div>
          </div>
          <div style={{ height: 100, borderRadius: 18, background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out 0.3s infinite alternate' }} />
        </div>
        <HomeIndicator />
      </AppShell>
    );
  }

  if (error || !friend) {
    return (
      <AppShell showTabBar={false}>
        <ScreenHeader left={backBtn} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>{error ?? t.profileNotFound}</div>
          <Button variant="secondary" size="sm" full={false} onClick={() => navigate(-1)}>{t.back}</Button>
        </div>
        <HomeIndicator />
      </AppShell>
    );
  }

  // ── Private profile ──────────────────────────────────────────────────────────
  if (friend.is_private) {
    return (
      <AppShell showTabBar={false}>
        <ScreenHeader left={backBtn} />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', gap: 20 }} className="no-scrollbar">
          <Avatar name={friend.name} size={80} live={false} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{friend.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>@{friend.handle}</div>
          </div>

          {/* Lock icon + message */}
          <div
            style={{
              width: '100%',
              padding: '24px 20px',
              borderRadius: 18,
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              textAlign: 'center',
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>{t.privateAccount}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {fsStatus === 'pending_sent'
                ? t.privateRequestSent
                : fsStatus === 'pending_received'
                ? t.privateIncoming(friend.name)
                : t.privateDefault}
            </div>
          </div>

          {id && (
            <FriendActionButton
              status={fsStatus}
              userId={id}
              onStatusChange={(s) => {
                setFsStatus(s);
                if (s === 'friends') {
                  // Reload full profile
                  api.get<FriendData>(`/friends/${id}`).then(d => setFriend(d)).catch(() => {});
                }
              }}
            />
          )}
        </div>
        <HomeIndicator />
      </AppShell>
    );
  }

  // ── Full (friends) profile ───────────────────────────────────────────────────
  return (
    <AppShell showTabBar={false}>
      <ScreenHeader
        left={backBtn}
        right={
          id && (
            <FriendActionButton
              status={fsStatus}
              userId={id}
              onStatusChange={setFsStatus}
            />
          )
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
            <div style={{ padding: 14, borderRadius: 18, background: 'var(--accent-soft)', border: '1px solid var(--accent-dim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <LiveChip label={t.nowPlaying} />
                <div style={{ flex: 1 }} />
                <Waveform bars={4} height={14} />
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Album name={friend.album ?? ''} artist={friend.artist ?? ''} size={72} radius={10} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friend.song}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{friend.artist}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 18, borderRadius: 18, background: 'var(--surface)', border: '1px dashed var(--hairline)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="mute" size={22} stroke="var(--text-muted)" sw={1.6} />
              </div>
              <div>
                <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: -0.3 }}>{t.notListeningNow}</div>
                {friend.ago && (
                  <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {t.lastSeen} · <span style={{ fontFamily: 'var(--font-mono)' }}>{friend.ago}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Insights summary */}
        {friend.insights && (
          <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {friend.insights.recent_played && (
              <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>MOST RECENT</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{friend.insights.recent_played.song}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{friend.insights.recent_played.artist}</div>
              </div>
            )}
            {friend.insights.top_artists?.length > 0 && (
              <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>FAVORITE ARTISTS</div>
                {friend.insights.top_artists.slice(0, 3).map((a, i) => (
                  <div key={`${a.artist}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ fontSize: 13 }}>{a.artist}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{a.play_count}x</span>
                  </div>
                ))}
              </div>
            )}
            {friend.insights.activity && (
              <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>ACTIVITY</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Today {friend.insights.activity.plays_today} · 7d {friend.insights.activity.plays_last_7_days} · 30d {friend.insights.activity.plays_last_30_days}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent tracks */}
        {friend.recent && friend.recent.length > 0 && (
          <div style={{ flex: 1, marginTop: 18 }}>
            <SectionHeader title={t.recentTracks} />
            {friend.recent.map(r => (
              <div
                key={r.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px' }}
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
