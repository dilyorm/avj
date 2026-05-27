import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { Avatar } from '../components/ui/Avatar';
import { PlatformTag } from '../components/ui/PlatformTag';
import { Icon } from '../components/ui/Icon';
import { useFeed } from '../context/FeedContext';
import { api } from '../services/api';
import type { FriendData } from '../context/FeedContext';

type FS = 'none' | 'pending_sent' | 'pending_received' | 'friends';

function RequestButton({ status, onAction }: { status: FS; onAction: (a: 'add' | 'accept' | 'cancel') => void }) {
  if (status === 'friends') {
    return (
      <span style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--hairline)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font)', flexShrink: 0 }}>
        Do'st
      </span>
    );
  }
  if (status === 'pending_sent') {
    return (
      <button
        onClick={e => { e.stopPropagation(); onAction('cancel'); }}
        style={{ padding: '6px 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--hairline)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)', flexShrink: 0 }}
      >
        Bekor qilish
      </button>
    );
  }
  if (status === 'pending_received') {
    return (
      <button
        onClick={e => { e.stopPropagation(); onAction('accept'); }}
        style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--accent)', color: '#000', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', flexShrink: 0 }}
      >
        Qabul
      </button>
    );
  }
  return (
    <button
      onClick={e => { e.stopPropagation(); onAction('add'); }}
      style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--accent)', color: '#000', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', flexShrink: 0 }}
    >
      + Qo'sh
    </button>
  );
}

function UserRow({ user, onNavigate }: { user: FriendData; onNavigate: (id: string) => void }) {
  const [status, setStatus] = useState<FS>((user.friendship_status ?? 'none') as FS);

  const handleAction = useCallback(async (action: 'add' | 'accept' | 'cancel') => {
    try {
      if (action === 'add') {
        const r = await api.post<{ status: string }>(`/friends/${user.id}/add`, {});
        setStatus(r.status as FS);
      } else if (action === 'accept') {
        await api.post(`/friends/${user.id}/accept`, {});
        setStatus('friends');
      } else {
        await api.post(`/friends/${user.id}/reject`, {});
        setStatus('none');
      }
    } catch { /* ignore */ }
  }, [user.id]);

  return (
    <div
      onClick={() => onNavigate(user.id)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer' }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
    >
      <Avatar name={user.name} size={42} live={user.status === 'live'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{user.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user.song && status === 'friends' ? `${user.song} — ${user.artist}` : `@${user.handle}`}
        </div>
      </div>
      <RequestButton status={status} onAction={handleAction} />
    </div>
  );
}

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
            <Icon name="search" size={18} stroke="var(--text-muted)" sw={1.8} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Do'stlar, qo'shiqlar, artistlar..."
              autoFocus
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text)', fontFamily: 'var(--font)' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
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

          {/* Searching */}
          {query && searching && (
            <div style={{ padding: '20px 20px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out infinite alternate' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ width: '55%', height: 12, borderRadius: 6, background: 'var(--surface-3)' }} />
                    <div style={{ width: '35%', height: 10, borderRadius: 6, background: 'var(--surface-3)' }} />
                  </div>
                </div>
              ))}
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
              {results.map(u => (
                <UserRow key={u.id} user={u} onNavigate={id => navigate(`/friend/${id}`)} />
              ))}
            </>
          )}

          <div style={{ height: 16 }} />
        </div>
      </div>
    </AppShell>
  );
}
