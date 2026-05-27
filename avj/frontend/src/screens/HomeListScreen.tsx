import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { ListeningCard } from '../components/ui/ListeningCard';
import { Avatar } from '../components/ui/Avatar';
import { Waveform } from '../components/ui/Waveform';
import { Button } from '../components/ui/Button';
import { useFeed } from '../context/FeedContext';
import { useAuth } from '../context/AuthContext';

const FILTER_ITEMS = ['Hammasi', 'Hozir', "Do'stlar", "O'zbek", 'РУС'];

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px' }}>
      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--surface-3)', flexShrink: 0, animation: 'avj-fade-up 1s ease-in-out infinite alternate' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ width: '60%', height: 12, borderRadius: 6, background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out 0.1s infinite alternate' }} />
        <div style={{ width: '40%', height: 10, borderRadius: 6, background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out 0.2s infinite alternate' }} />
      </div>
    </div>
  );
}

export function HomeListScreen() {
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

      <div
        style={{ flexShrink: 0, padding: '0 16px 12px', display: 'flex', gap: 6, overflowX: 'auto' }}
        className="no-scrollbar"
      >
        {FILTER_ITEMS.map((t, i) => (
          <span
            key={t}
            style={{
              padding: '7px 12px',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              background: i === 0 ? 'var(--text)' : 'transparent',
              color: i === 0 ? 'var(--bg)' : 'var(--text-muted)',
              border: i === 0 ? 'none' : '1px solid var(--hairline)',
              cursor: 'pointer',
              flexShrink: 0,
              fontFamily: 'var(--font)',
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
        {loading && (
          <div>
            {[0, 1, 2, 3].map(i => <SkeletonRow key={i} />)}
          </div>
        )}

        {error && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>{error}</div>
            <Button variant="secondary" size="sm" full={false} onClick={reload}>Qayta yuklash</Button>
          </div>
        )}

        {!loading && !error && (
          <>
            {live.length > 0 && (
              <>
                <SectionHeader title={`Hozir tinglashmoqda · ${live.length}`} action={<Waveform bars={3} height={11} />} />
                {live.map((f, i) => (
                  <div key={f.id} style={{ animation: `avj-fade-up 0.35s ease-out ${i * 60}ms both` }}>
                    <ListeningCard
                      friend={f.name}
                      song={f.song ?? ''}
                      artist={f.artist ?? ''}
                      album={f.album ?? ''}
                      platform={f.platform ?? 'spotify'}
                      status="live"
                      ago={f.ago}
                      density="list"
                      onClick={() => navigate(`/friend/${f.id}`)}
                    />
                  </div>
                ))}
              </>
            )}

            {live.length > 0 && past.length > 0 && (
              <>
                <div style={{ height: 8 }} />
                <div style={{ height: 1, background: 'var(--hairline)', margin: '0 16px 8px' }} />
              </>
            )}

            {past.length > 0 && (
              <>
                <SectionHeader title="Yaqinda" />
                {past.map((f, i) => (
                  <div key={f.id} style={{ animation: `avj-fade-up 0.35s ease-out ${(live.length + i) * 60}ms both` }}>
                    <ListeningCard
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
                  </div>
                ))}
              </>
            )}
          </>
        )}

        <div style={{ height: 16 }} />
      </div>
    </AppShell>
  );
}
