import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api, ApiError } from '../services/api';
import { feedSocket } from '../services/ws';

export interface AuthUser {
  id: string;
  name: string;
  handle: string;
  email: string;
  city: string;
  visible: boolean;
  spotify: boolean;
  yandex: boolean;
  friend_count: number;
  track_count: number;
  now: { song: string; artist: string; album: string; platform: string } | null;
  last_played: { song: string; artist: string; album: string; platform: string } | null;
}

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  handle: string;
  email: string;
  password: string;
  city?: string;
}

const Ctx = createContext<AuthCtx>({
  user: null, token: null, loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('avj_token'));
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const me = await api.get<AuthUser>('/me');
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  // On mount / token change — load user
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    fetchUser().finally(() => setLoading(false));
  }, [token, fetchUser]);

  // Connect WebSocket when we have a token
  useEffect(() => {
    if (token) {
      feedSocket.connect(token);
    } else {
      feedSocket.disconnect();
    }
    return () => {};
  }, [token]);

  // Listen for forced logout events (401 from API)
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('avj:logout', handler);
    return () => window.removeEventListener('avj:logout', handler);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>('/auth/login', { email, password });
    localStorage.setItem('avj_token', res.access_token);
    setToken(res.access_token);
  };

  const register = async (data: RegisterData) => {
    const res = await api.post<{ access_token: string }>('/auth/register', data);
    localStorage.setItem('avj_token', res.access_token);
    setToken(res.access_token);
  };

  const logout = () => {
    localStorage.removeItem('avj_token');
    setToken(null);
    setUser(null);
    feedSocket.disconnect();
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <Ctx.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
