import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { Avatar } from '../components/ui/Avatar';
import { Album } from '../components/ui/Album';
import { PlatformTag } from '../components/ui/PlatformTag';
import { Icon } from '../components/ui/Icon';
import { useFeed } from '../context/FeedContext';
import { api } from '../services/api';
import type { FriendData } from '../context/FeedContext';

export function SearchScreen() {
  const navigate = useNavigate();
  const { friends } = useFeed();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendData[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.get<FriendData[]>(`/search?q=${encodeURIComponent(query.trim())}`);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <AppShell>
      <ScreenHeader title="Qidiruv" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Search bar */}
        <div style={{ padding: '0 16px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 16px',
              borderRadius: 16,
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
            }}
          >
            <Icon name="search" size={18} stroke="var(--text-muted)" sw={1.8} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Do'stlar, qo'shiqlar, artistlar..."
              autoFocus
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 15,
                color: 'var(--text)',
                fontFamily: 'var(--font)',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}
              >
                <Icon name="close" size={16} stroke="var(--text-muted)" />
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          {/* No query — show friends list */}
          {!query && friends.length > 0 && (
            <>
              <SectionHeader title="Do'stlar" />
              {friends.map(f => (
                <div
                  key={f.id}
                  onClick={() => navigate(`/friend/${f.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                >
                  <Avatar name={f.name} size={44} live={f.status === 'live'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>@{f.handle}</div>
                  </div>
                  {f.platform && <PlatformTag platform={f.platform} size="xs" />}
                </div>
              ))}
            </>
          )}

          {/* Searching spinner */}
          {query && searching && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ width: 24, height: 2, background: 'var(--accent)', borderRadius: 1, margin: '0 auto', animation: 'avj-fade-up 0.5s ease-out infinite alternate' }} />
            </div>
          )}

          {/* No results */}
          {query && !searching && results.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                <Icon name="search" size={48} stroke="var(--text-dim)" sw={1.2} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: -0.3 }}>
                Natija topilmadi
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 6 }}>
                "{query}" bo'yicha hech narsa yo'q
              </div>
            </div>
          )}

          {/* Results */}
          {query && !searching && results.length > 0 && (
            <>
              <SectionHeader title={`Natijalar · ${results.length}`} />
              {results.map(f => (
                <div
                  key={f.id}
                  onClick={() => navigate(`/friend/${f.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                >
                  <Avatar name={f.name} size={40} live={f.status === 'live'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.song ? `${f.song} — ${f.artist}` : `@${f.handle}`}
                    </div>
                  </div>
                  {f.album && f.song ? (
                    <Album name={f.album} artist={f.artist ?? ''} size={36} radius={6} />
                  ) : f.platform ? (
                    <PlatformTag platform={f.platform} size="xs" />
                  ) : null}
                </div>
              ))}
            </>
          )}

          <div style={{ height: 16 }} />
        </div>
      </div>
    </AppShell>
  );
}
