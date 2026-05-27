import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { ListeningCard } from '../components/ui/ListeningCard';
import { Avatar } from '../components/ui/Avatar';
import { Waveform } from '../components/ui/Waveform';
import { EmptyArt } from '../components/ui/EmptyArt';
import { Button } from '../components/ui/Button';
import { useFeed } from '../context/FeedContext';
import { useAuth } from '../context/AuthContext';

const FILTER_ITEMS = ['Hammasi', 'Hozir', "Do'stlar", "O'zbek", 'РУС'];

function FilterStrip() {
  return (
    <div style={{ flexShrink: 0, padding: '0 16px 12px', display: 'flex', gap: 6, overflowX: 'auto' }} className="no-scrollbar">
      {FILTER_ITEMS.map((t, i) => (
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

export function HomeCardsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends, loading, error, reload } = useFeed();

  const live = friends.filter(f => f.status === 'live');
  const past = friends.filter(f => f.status === 'past');

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

        {!loading && !error && friends.length === 0 && (
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

        {!loading && past.length > 0 && (
          <>
            <SectionHeader title="Yaqinda" style={{ marginTop: 20 }} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] px-4 md:px-0">
              {past.map((f, i) => (
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
      </div>
    </AppShell>
  );
}
