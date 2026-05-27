/**
 * Real-time feed state.
 * - Initial load from GET /api/friends
 * - Live updates via WebSocket friend_update events
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api } from '../services/api';
import { feedSocket } from '../services/ws';
import { useAuth } from './AuthContext';

export interface FriendData {
  id: string;
  name: string;
  handle: string;
  platform: 'spotify' | 'yandex' | null;
  status: 'live' | 'past';
  ago: string;
  mins: string | null;
  song: string | null;
  artist: string | null;
  album: string | null;
  spotify: boolean;
  yandex: boolean;
  recent: Array<{
    id: string;
    song: string;
    artist: string;
    album: string;
    platform: string;
    started_at: string;
  }>;
}

interface FeedCtx {
  friends: FriendData[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const Ctx = createContext<FeedCtx>({ friends: [], loading: true, error: null, reload: () => {} });

export function FeedProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const data = await api.get<FriendData[]>('/friends');
      setFriends(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    if (token) {
      setLoading(true);
      load();
    } else {
      setFriends([]);
      setLoading(false);
    }
  }, [token, load]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    const unsub = feedSocket.onMessage((msg) => {
      if (msg.type === 'snapshot') {
        setFriends((msg.friends as FriendData[]) ?? []);
        setLoading(false);
      } else if (msg.type === 'friend_update') {
        const updated = msg.friend as FriendData;
        setFriends(prev => {
          const exists = prev.some(f => f.id === updated.id);
          if (exists) {
            return prev.map(f => f.id === updated.id ? updated : f);
          }
          return [updated, ...prev];
        });
      }
    });
    return unsub;
  }, []);

  return (
    <Ctx.Provider value={{ friends, loading, error, reload: load }}>
      {children}
    </Ctx.Provider>
  );
}

export const useFeed = () => useContext(Ctx);
