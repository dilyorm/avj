import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { ListeningCard } from '../components/ui/ListeningCard';
import { Avatar } from '../components/ui/Avatar';
import { Album } from '../components/ui/Album';
import { Button } from '../components/ui/Button';
import { EmptyArt } from '../components/ui/EmptyArt';
import { useFeed } from '../context/FeedContext';
import { useAuth } from '../context/AuthContext';
import type { FriendData } from '../context/FeedContext';

function MiniCard({ friend, onClick }: { friend: FriendData; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: '0 0 150px',
        padding: 12,
        borderRadius: 14,
        background: 'var(--surface)',
        border: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={friend.name} size={22} live={friend.status === 'live'} />
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            flex: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {friend.name}
        </div>
      </div>
      <Album name={friend.album ?? ''} artist={friend.artist ?? ''} size={126} radius={8} style={{ width: '100%', height: 110 }} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {friend.song}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {friend.artist}
        </div>
      </div>
    </div>
  );
}

export function HomeStackScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends, loading, error, reload } = useFeed();

  const live = friends.filter(f => f.status === 'live');
  const past = friends.filter(f => f.status === 'past');
  const hero = live[0];

  return (
    <AppShell>
      <ScreenHeader
        title="Lenta"
        right={<Avatar name={user?.name ?? ''} size={32} live={!!user?.now} onClick={() => navigate('/profile')} />}
      />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }} className="no-scrollbar">
        {loading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 32, height: 2, background: 'var(--accent)', borderRadius: 1, animation: 'avj-fade-up 0.5s ease-out infinite alternate' }} />
          </div>
        )}

        {error && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>{error}</div>
            <Button variant="secondary" size="sm" full={false} onClick={reload}>Qayta yuklash</Button>
          </div>
        )}

        {!loading && !error && !hero && (
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

        {!loading && hero && (
          <>
            <ListeningCard
              friend={hero.name}
              song={hero.song ?? ''}
              artist={hero.artist ?? ''}
              album={hero.album ?? ''}
              platform={hero.platform ?? 'spotify'}
              status="live"
              density="hero"
              onClick={() => navigate(`/friend/${hero.id}`)}
            />

            {live.length > 1 && (
              <>
                <SectionHeader title={`Boshqa ${live.length - 1} do'st hozir tinglamoqda`} style={{ marginTop: 4 }} />
                <div
                  style={{ display: 'flex', gap: 10, padding: '0 16px', overflowX: 'auto' }}
                  className="no-scrollbar"
                >
                  {live.slice(1).map(f => (
                    <MiniCard key={f.id} friend={f} onClick={() => navigate(`/friend/${f.id}`)} />
                  ))}
                </div>
              </>
            )}

            {past.length > 0 && (
              <>
                <SectionHeader title="Yaqinda" style={{ marginTop: 8 }} />
                {past.slice(0, 3).map(f => (
                  <ListeningCard
                    key={f.id}
                    friend={f.name}
                    song={f.song ?? ''}
                    artist={f.artist ?? ''}
                    album={f.album ?? ''}
                    platform={f.platform ?? 'spotify'}
                    status="past"
                    ago={f.ago}
                    density="list"
                    onClick={() => navigate(`/friend/${f.id}`)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
