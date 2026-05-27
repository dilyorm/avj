import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { ListeningCard } from '../components/ui/ListeningCard';
import { Avatar } from '../components/ui/Avatar';
import { Waveform } from '../components/ui/Waveform';
import { EmptyArt } from '../components/ui/EmptyArt';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { useFeed } from '../context/FeedContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { FriendData } from '../context/FeedContext';

function FilterStrip() {
  return (
    <div style={{ flexShrink: 0, padding: '0 16px 12px', display: 'flex', gap: 6, overflowX: 'auto' }} className="no-scrollbar">
      {['Hammasi', 'Hozir', "Do'stlar"].map((t, i) => (
        <span key={t} style={{
          padding: '7px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
          whiteSpace: 'nowrap', background: i === 0 ? 'var(--text)' : 'transparent',
          color: i === 0 ? 'var(--bg)' : 'var(--text-muted)',
          border: i === 0 ? 'none' : '1px solid var(--hairline)',
          cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font)',
        }}>{t}</span>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ margin: '0 16px', padding: 14, borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out infinite alternate' }} />
        <div style={{ width: 80, height: 12, borderRadius: 6, background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out 0.1s infinite alternate' }} />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 68, height: 68, borderRadius: 10, background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out 0.2s infinite alternate' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ width: '70%', height: 14, borderRadius: 6, background: 'var(--surface-3)' }} />
          <div style={{ width: '50%', height: 11, borderRadius: 6, background: 'var(--surface-3)' }} />
        </div>
      </div>
    </div>
  );
}

function FriendRequestRow({ req, onAccept, onReject }: {
  req: FriendData;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px' }}>
      <Avatar name={req.name} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{req.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>@{req.handle}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          disabled={loading}
          onClick={async () => { setLoading(true); try { await api.post(`/friends/${req.id}/accept`, {}); onAccept(); } catch { setLoading(false); } }}
          style={{ padding: '7px 12px', borderRadius: 10, background: 'var(--accent)', color: '#000', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}
        >
          Qabul
        </button>
        <button
          disabled={loading}
          onClick={async () => { setLoading(true); try { await api.post(`/friends/${req.id}/reject`, {}); onReject(); } catch { setLoading(false); } }}
          style={{ padding: '7px 12px', borderRadius: 10, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--hairline)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}
        >
          Rad
        </button>
      </div>
    </div>
  );
}

function OfflineFriendRow({ f, onClick }: { f: FriendData; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer' }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
    >
      <Avatar name={f.name} size={42} live={false} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{f.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>hozir tinglayotgani yo'q</div>
      </div>
      <Icon name="chev" size={16} stroke="var(--text-dim)" />
    </div>
  );
}

export function HomeCardsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends, loading, error, reload } = useFeed();
  const [requests, setRequests] = useState<FriendData[]>([]);

  useEffect(() => {
    api.get<FriendData[]>('/friend-requests').then(setRequests).catch(() => {});
  }, []);

  const handleAccept = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    reload(); // refresh friends list
  };
  const handleReject = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const live    = friends.filter(f => f.status === 'live');
  const recent  = friends.filter(f => f.status === 'past' && f.song);
  const offline = friends.filter(f => f.status === 'past' && !f.song);

  return (
    <AppShell>
      <ScreenHeader
        title="Lenta"
        right={<Avatar name={user?.name ?? ''} size={32} live={!!user?.now} onClick={() => navigate('/profile')} />}
      />
      <FilterStrip />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }} className="no-scrollbar">
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {error && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>{error}</div>
            <Button variant="secondary" size="sm" full={false} onClick={reload}>Qayta yuklash</Button>
          </div>
        )}

        {/* Friend requests */}
        {requests.length > 0 && (
          <>
            <SectionHeader
              title={`Do'stlik so'rovlari · ${requests.length}`}
              style={{ marginTop: 4 }}
            />
            {requests.map(req => (
              <FriendRequestRow
                key={req.id}
                req={req}
                onAccept={() => handleAccept(req.id)}
                onReject={() => handleReject(req.id)}
              />
            ))}
          </>
        )}

        {/* Empty state */}
        {!loading && !error && friends.length === 0 && requests.length === 0 && (
          <div style={{ flex: 1, padding: '48px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
            <EmptyArt glyph="globe" />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4 }}>Lenta hozircha bo'sh</div>
              <div style={{ marginTop: 6, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Do'st qo'sh — ular nima eshityotgani shu yerda ko'rinadi.
              </div>
            </div>
            <Button variant="primary" size="md" icon="plus" full={false} onClick={() => navigate('/friends/add')}>
              Do'st qo'shish
            </Button>
          </div>
        )}

        {/* Live */}
        {!loading && live.length > 0 && (
          <>
            <SectionHeader title={`Hozir tinglashmoqda · ${live.length}`} action={<Waveform bars={3} height={11} />} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] px-4 md:px-0">
              {live.map((f, i) => (
                <div key={f.id} style={{ animation: `avj-fade-up 0.4s ease-out ${i * 80}ms both` }}>
                  <ListeningCard
                    friend={f.name} song={f.song ?? ''} artist={f.artist ?? ''}
                    album={f.album ?? ''} platform={f.platform ?? 'spotify'}
                    status="live" noMargin
                    onClick={() => navigate(`/friend/${f.id}`)}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Recently listened */}
        {!loading && recent.length > 0 && (
          <>
            <SectionHeader title="Yaqinda tingladi" style={{ marginTop: 20 }} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] px-4 md:px-0">
              {recent.map((f, i) => (
                <div key={f.id} style={{ animation: `avj-fade-up 0.4s ease-out ${i * 60}ms both` }}>
                  <ListeningCard
                    friend={f.name} song={f.song ?? ''} artist={f.artist ?? ''}
                    album={f.album ?? ''} platform={f.platform ?? 'spotify'}
                    status="past" ago={f.ago} noMargin
                    onClick={() => navigate(`/friend/${f.id}`)}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Offline friends */}
        {!loading && offline.length > 0 && (
          <>
            <SectionHeader title="Do'stlar" style={{ marginTop: 20 }} />
            {offline.map(f => (
              <OfflineFriendRow key={f.id} f={f} onClick={() => navigate(`/friend/${f.id}`)} />
            ))}
          </>
        )}
      </div>
    </AppShell>
  );
}
