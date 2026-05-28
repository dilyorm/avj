import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { Avatar } from '../components/ui/Avatar';
import { Icon } from '../components/ui/Icon';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import type { FriendData } from '../context/FeedContext';

type FS = 'none' | 'pending_sent' | 'pending_received' | 'friends';

function RequestButton({ status, onAction }: { status: FS; onAction: (a: 'add' | 'accept' | 'cancel') => void }) {
  const { t } = useLang();
  if (status === 'friends') {
    return (
      <span style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--hairline)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>
        {t.friendStatus}
      </span>
    );
  }
  if (status === 'pending_sent') {
    return (
      <button
        onClick={e => { e.stopPropagation(); onAction('cancel'); }}
        style={{ padding: '6px 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--hairline)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)' }}
      >
        {t.cancelRequest}
      </button>
    );
  }
  if (status === 'pending_received') {
    return (
      <button
        onClick={e => { e.stopPropagation(); onAction('accept'); }}
        style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--accent)', color: '#000', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}
      >
        {t.accept}
      </button>
    );
  }
  return (
    <button
      onClick={e => { e.stopPropagation(); onAction('add'); }}
      style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--accent)', color: '#000', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}
    >
      {t.addBtn}
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
      <Avatar name={user.name} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{user.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
          @{user.handle}
        </div>
      </div>
      <RequestButton status={status} onAction={handleAction} />
    </div>
  );
}

export function AddFriendsScreen() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<FriendData[]>([]);
  const [searchResults, setSearchResults] = useState<FriendData[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api.get<FriendData[]>('/suggestions')
      .then(setSuggestions)
      .catch(() => {})
      .finally(() => setLoadingSuggestions(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.get<FriendData[]>(`/search?q=${encodeURIComponent(query.trim())}`);
        setSearchResults(results);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const displayList = query.trim() ? searchResults : suggestions;

  return (
    <AppShell>
      <ScreenHeader title={t.addFriend} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Search bar */}
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
            <Icon name="search" size={18} stroke="var(--text-muted)" sw={1.8} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font)' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                <Icon name="close" size={16} stroke="var(--text-muted)" />
              </button>
            )}
          </div>
        </div>

        <SectionHeader title={query.trim() ? t.searchResults : t.suggestions} />

        <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          {(loadingSuggestions && !query) || searching ? (
            <div style={{ padding: '20px 20px' }}>
              {[0, 1, 3].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--surface-3)', animation: 'avj-fade-up 1s ease-in-out infinite alternate' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ width: '55%', height: 12, borderRadius: 6, background: 'var(--surface-3)' }} />
                    <div style={{ width: '35%', height: 10, borderRadius: 6, background: 'var(--surface-3)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : displayList.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                {query.trim() ? t.noResults : t.noSuggestions}
              </div>
              {query.trim() && (
                <div style={{ fontSize: 13, marginTop: 6 }}>{t.noResultsFor(query)}</div>
              )}
            </div>
          ) : (
            displayList.map(u => (
              <UserRow key={u.id} user={u} onNavigate={id => navigate(`/friend/${id}`)} />
            ))
          )}
          <div style={{ height: 16 }} />
        </div>
      </div>
    </AppShell>
  );
}
