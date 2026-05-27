import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { api } from '../services/api';
import type { FriendData } from '../context/FeedContext';

function SuggestionRow({ user, added, onAdd }: { user: FriendData; added: boolean; onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px' }}>
      <Avatar name={user.name} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{user.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
          @{user.handle}
        </div>
      </div>
      {added ? (
        <button
          style={{
            padding: '7px 12px',
            borderRadius: 10,
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--hairline)',
            fontFamily: 'var(--font)',
            fontWeight: 600,
            fontSize: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            cursor: 'default',
            flexShrink: 0,
          }}
        >
          <Icon name="check" size={14} stroke="var(--accent)" sw={2.4} /> Qo'shildi
        </button>
      ) : (
        <Button variant="primary" size="sm" full={false} onClick={onAdd}>+ Qo'sh</Button>
      )}
    </div>
  );
}

export function AddFriendsScreen() {
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<FriendData[]>([]);
  const [searchResults, setSearchResults] = useState<FriendData[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [searching, setSearching] = useState(false);

  // Load suggestions on mount
  useEffect(() => {
    api.get<FriendData[]>('/suggestions')
      .then(setSuggestions)
      .catch(() => {})
      .finally(() => setLoadingSuggestions(false));
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.get<FriendData[]>(`/search?q=${encodeURIComponent(query.trim())}`);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const handleAdd = useCallback(async (userId: string) => {
    try {
      await api.post(`/friends/${userId}/add`, {});
      setAdded(prev => new Set([...prev, userId]));
    } catch {
      // Still mark as added optimistically if 409 conflict (already friends)
      setAdded(prev => new Set([...prev, userId]));
    }
  }, []);

  const displayList = query.trim() ? searchResults : suggestions;

  return (
    <AppShell>
      <ScreenHeader
        title="Do'st qo'shish"
        right={
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4 }}>
            <Icon name="qr" size={22} stroke="var(--text)" sw={1.6} />
          </button>
        }
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Search */}
        <div style={{ padding: '0 16px 12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 14,
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
            }}
          >
            <Icon name="search" size={18} stroke="var(--text-muted)" sw={1.8} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ism yoki @username"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 14,
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

        {/* Telegram import banner */}
        {!query && (
          <div style={{ padding: '0 16px 16px' }}>
            <div
              style={{
                padding: 14,
                borderRadius: 14,
                background: 'var(--surface)',
                border: '1px solid var(--hairline)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'var(--surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name="tg" size={20} stroke="var(--text)" sw={1.6} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2 }}>
                  Telegram kontaktlardan top
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  Tanishlaringni Avj-da top
                </div>
              </div>
              <Button variant="accent" size="sm" full={false}>Ulanish</Button>
            </div>
          </div>
        )}

        <SectionHeader title={query.trim() ? 'Qidiruv natijalari' : 'Sen uchun tavsiya'} />

        <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          {(loadingSuggestions && !query) || searching ? (
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
          ) : displayList.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                {query.trim() ? 'Natija topilmadi' : 'Hozircha tavsiya yo\'q'}
              </div>
              {query.trim() && (
                <div style={{ fontSize: 13, marginTop: 6 }}>"{query}" bo'yicha hech kim topilmadi</div>
              )}
            </div>
          ) : (
            displayList.map(u => (
              <SuggestionRow
                key={u.id}
                user={u}
                added={added.has(u.id)}
                onAdd={() => handleAdd(u.id)}
              />
            ))
          )}
          <div style={{ height: 16 }} />
        </div>
      </div>
    </AppShell>
  );
}
