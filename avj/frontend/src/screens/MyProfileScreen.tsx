import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { Avatar } from '../components/ui/Avatar';
import { Album } from '../components/ui/Album';
import { LiveChip } from '../components/ui/LiveChip';
import { PlatformTag } from '../components/ui/PlatformTag';
import { PulseRing } from '../components/ui/PulseRing';
import { Waveform } from '../components/ui/Waveform';
import { ConnectRow } from '../components/ui/ConnectRow';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { api } from '../services/api';

// Re-uses same device flow sheet — import-style inline component
function YandexDeviceModal({ onClose, onConnected }: { onClose: () => void; onConnected: () => void }) {
  type DS =
    | { phase: 'init' } | { phase: 'loading' }
    | { phase: 'waiting'; userCode: string; verificationUrl: string; deviceCode: string; expiresAt: number }
    | { phase: 'connected' } | { phase: 'expired' } | { phase: 'error'; message: string };

  const [state, setState] = useState<DS>({ phase: 'init' });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  useEffect(() => () => stopPoll(), []);

  const start = async () => {
    setState({ phase: 'loading' });
    try {
      const data = await api.post<{ user_code: string; verification_url: string; device_code: string; expires_in: number; interval: number }>('/connect/yandex/device', {});
      const expiresAt = Date.now() + data.expires_in * 1000;
      setState({ phase: 'waiting', userCode: data.user_code, verificationUrl: data.verification_url, deviceCode: data.device_code, expiresAt });
      const ms = Math.max((data.interval || 5) * 1000, 5000);
      pollRef.current = setInterval(async () => {
        if (Date.now() > expiresAt) { stopPoll(); setState({ phase: 'expired' }); return; }
        try {
          const r = await api.post<{ status: string; detail?: string }>('/connect/yandex/device/poll', { device_code: data.device_code });
          if (r.status === 'connected') { stopPoll(); setState({ phase: 'connected' }); setTimeout(() => { onConnected(); onClose(); }, 1200); }
          else if (r.status === 'expired') { stopPoll(); setState({ phase: 'expired' }); }
          else if (r.status === 'error') { stopPoll(); setState({ phase: 'error', message: r.detail || 'Xatolik' }); }
        } catch { /* keep polling */ }
      }, ms);
    } catch (e: unknown) { setState({ phase: 'error', message: e instanceof Error ? e.message : 'Xatolik' }); }
  };

  const s = state;
  return (
    <div onClick={() => { stopPoll(); onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: 'var(--bg)', borderRadius: '22px 22px 0 0', padding: '20px 20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--hairline)', margin: '0 auto' }} />
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.4 }}>Yandex Music</div>
        {s.phase === 'init' && (<><div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>Yandex saytida tez tasdiqlash orqali ulanasiz.</div><Button variant="primary" size="lg" onClick={start}>Boshlash</Button></>)}
        {s.phase === 'loading' && (<div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Yuklanmoqda...</div>)}
        {s.phase === 'waiting' && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>Quyidagi tugmani bosib Yandex saytida tasdiqlang:</div>
            <div style={{ textAlign: 'center', padding: '14px 0 6px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 8 }}>Tasdiqlash kodi</div>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 6, fontFamily: 'var(--font-mono)', color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 14, padding: '12px 20px', display: 'inline-block' }}>{s.userCode}</div>
            </div>
            <a href={s.verificationUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}><Button variant="primary" size="lg">Yandex saytida tasdiqlash →</Button></a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'avj-pulse 1.4s ease-in-out infinite' }} />
              Tasdiqlanishini kutmoqda...
            </div>
          </>
        )}
        {s.phase === 'connected' && (<div style={{ padding: '20px 0', textAlign: 'center', fontSize: 16, fontWeight: 700 }}>Ulandi!</div>)}
        {(s.phase === 'expired' || s.phase === 'error') && (<><div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)', fontSize: 13, color: '#FF5252' }}>{s.phase === 'expired' ? 'Kod muddati tugadi.' : s.message}</div><Button variant="primary" size="lg" onClick={start}>Qayta urinish</Button></>)}
      </div>
    </div>
  );
}

function StatusPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 12px',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        background: active ? 'var(--surface)' : 'transparent',
        border: '1px solid ' + (active ? 'var(--accent-dim)' : 'var(--hairline)'),
        color: active ? 'var(--text)' : 'var(--text-muted)',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: -0.1,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: 'var(--font)',
      }}
    >
      {active && <PulseRing size={6} />}
      {!active && <Icon name="mute" size={14} stroke="var(--text-muted)" sw={1.6} />}
      {label}
    </div>
  );
}


interface HistoryTrack {
  song: string;
  artist: string;
  album: string;
  platform: 'spotify' | 'yandex';
  played_at?: string;
}

interface ProfileInsights {
  has_data: boolean;
  has_fallback: boolean;
  fallback_note?: string | null;
  recent_played: {
    song: string;
    artist: string;
    album: string;
    platform?: 'spotify' | 'yandex';
    last_listened_at?: string;
  } | null;
  top_songs: Array<{ song: string; artist: string; album: string; play_count: number; platform?: 'spotify' | 'yandex' }>;
  top_artists: Array<{ artist: string; play_count: number }>;
  activity: {
    plays_today: number;
    plays_last_7_days: number;
    plays_last_30_days: number;
    plays_by_day: Array<{ date: string; plays: number }>;
  };
}

function formatPlayedAt(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    // Non-ISO label from yandex (e.g. "today", "yesterday"). Return as-is, capped.
    return iso.length > 14 ? iso.slice(0, 14) : iso;
  }
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'hozir';
  if (diffMin < 60) return `${diffMin}d oldin`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}s oldin`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}k oldin`;
  return d.toLocaleDateString('uz', { day: '2-digit', month: 'short' });
}

export function MyProfileScreen() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const { lang, setLang, t } = useLang();

  const [visible, setVisible] = useState(user?.visible ?? true);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [showYandexModal, setShowYandexModal] = useState(false);
  const [history, setHistory] = useState<HistoryTrack[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [insights, setInsights] = useState<ProfileInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [visMusic, setVisMusic] = useState({
    show_top_songs: user?.profile_visibility?.show_top_songs ?? true,
    show_top_artists: user?.profile_visibility?.show_top_artists ?? true,
    show_recent_played: user?.profile_visibility?.show_recent_played ?? true,
    show_activity: user?.profile_visibility?.show_activity ?? true,
  });

  if (!user) return null;

  const hasMusic = user.spotify || user.yandex;

  const fetchHistory = async () => {
    if (!hasMusic) return;
    setHistoryLoading(true);
    try {
      const res = await api.get<{ tracks: HistoryTrack[] }>('/me/history?limit=20');
      setHistory(res.tracks);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchInsights = async () => {
    if (!hasMusic) return;
    setInsightsLoading(true);
    try {
      const res = await api.get<ProfileInsights>('/me/insights?window=30d');
      setInsights(res);
    } catch {
      setInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    fetchHistory();
    fetchInsights();
    setVisMusic({
      show_top_songs: user.profile_visibility?.show_top_songs ?? true,
      show_top_artists: user.profile_visibility?.show_top_artists ?? true,
      show_recent_played: user.profile_visibility?.show_recent_played ?? true,
      show_activity: user.profile_visibility?.show_activity ?? true,
    });
  }, [
    user?.spotify,
    user?.yandex,
    user?.profile_visibility?.show_top_songs,
    user?.profile_visibility?.show_top_artists,
    user?.profile_visibility?.show_recent_played,
    user?.profile_visibility?.show_activity,
  ]);

  const handleVisibility = async (val: boolean) => {
    setVisible(val);
    setVisibilityLoading(true);
    try {
      await api.patch('/me', { visible: val });
      await refreshUser();
    } catch {
      setVisible(!val); // revert on error
    } finally {
      setVisibilityLoading(false);
    }
  };

  const handleSectionVisibility = async (
    key: 'show_top_songs' | 'show_top_artists' | 'show_recent_played' | 'show_activity',
    value: boolean,
  ) => {
    const prev = { ...visMusic };
    setVisMusic((s) => ({ ...s, [key]: value }));
    try {
      await api.patch('/me', { [key]: value });
      await refreshUser();
    } catch {
      setVisMusic(prev);
    }
  };

  const handleSpotifyConnect = async () => {
    try {
      const res = await api.get<{ url: string }>('/connect/spotify/auth');
      window.location.href = res.url;
    } catch {
      // ignore
    }
  };

  const handleSpotifyDisconnect = async () => {
    try {
      await api.delete('/connect/spotify');
      await refreshUser();
    } catch {
      // ignore
    }
  };

  const handleYandexConnected = async () => {
    await refreshUser();
  };

  const [shareToast, setShareToast] = useState('');

  const handleShare = async () => {
    const url = `${window.location.origin}/friend/${user.id}`;
    const text = `avj. — ${user.name} (@${user.handle}) ning musiqa lentasini ko'ring`;
    if (navigator.share) {
      try { await navigator.share({ title: 'avj.', text, url }); return; } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareToast('Havola nusxalandi!');
    } catch {
      setShareToast(url);
    }
    setTimeout(() => setShareToast(''), 2500);
  };

  const handleYandexDisconnect = async () => {
    try {
      await api.delete('/connect/yandex');
      await refreshUser();
    } catch {
      // ignore
    }
  };

  return (
    <AppShell>
      <ScreenHeader
        title={t.profile}
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'uz' ? 'ru' : 'uz')}
              style={{
                height: 32, padding: '0 10px', borderRadius: 8,
                background: 'var(--surface-2)',
                border: '1px solid var(--hairline)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-muted)',
                fontSize: 11, fontWeight: 700, letterSpacing: 0.5, fontFamily: 'var(--font-mono)',
              }}
            >
              {lang === 'uz' ? 'RU' : 'UZ'}
            </button>
            <button
              onClick={toggleTheme}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--surface-2)',
                border: '1px solid var(--hairline)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-muted)',
              }}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} sw={1.8} />
            </button>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="no-scrollbar">
        {/* Identity */}
        <div style={{ padding: '4px 24px 18px', display: 'flex', gap: 16, alignItems: 'center' }}>
          <Avatar name={user.name} size={72} live={!!user.now} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: -0.5 }}>{user.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>@{user.handle}</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              <span><b style={{ color: 'var(--text)' }}>{user.friend_count}</b> {t.friendCount}</span>
              <span style={{ color: 'var(--text-dim)' }}>·</span>
              <span><b style={{ color: 'var(--text)' }}>{user.track_count}</b> {t.trackCount}</span>
            </div>
          </div>
        </div>

        {/* Current listening */}
        {user.now ? (
          <div style={{ padding: '0 16px 14px' }}>
            <div
              style={{
                padding: 14,
                borderRadius: 16,
                background: 'var(--surface)',
                border: '1px solid var(--hairline)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Album name={user.now.album} artist={user.now.artist} size={56} radius={8} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <LiveChip label={t.youNow} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.now.song}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.now.artist}
                </div>
              </div>
              <Waveform bars={3} height={14} />
            </div>
          </div>
        ) : history.length > 0 && !historyLoading ? (
          <div style={{ padding: '0 16px 14px' }}>
            <div
              style={{
                padding: 14,
                borderRadius: 16,
                background: 'var(--surface)',
                border: '1px solid var(--hairline)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                opacity: 0.8,
              }}
            >
              <Album name={history[0].album} artist={history[0].artist} size={56} radius={8} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                    {t.lastPlayed}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {history[0].song}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {history[0].artist}
                </div>
              </div>
              <Icon name="history" size={18} stroke="var(--text-muted)" sw={1.6} />
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 16px 14px' }}>
            <div style={{ padding: 14, borderRadius: 16, background: 'var(--surface)', border: '1px dashed var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="mute" size={22} stroke="var(--text-muted)" sw={1.6} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.notListeningYou}</div>
            </div>
          </div>
        )}

        {/* Visibility toggle */}
        <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8, opacity: visibilityLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          <StatusPill label={t.visible} active={visible} onClick={() => handleVisibility(true)} />
          <StatusPill label={t.hidden} active={!visible} onClick={() => handleVisibility(false)} />
        </div>

        {/* Platforms */}
        <SectionHeader title={t.connectedAccounts} />
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ConnectRow
            platform="spotify"
            name="Spotify"
            sub={user.spotify ? t.connected : t.spotifySub}
            connected={user.spotify}
            onConnect={handleSpotifyConnect}
            onDisconnect={user.spotify ? handleSpotifyDisconnect : undefined}
          />
          <ConnectRow
            platform="yandex"
            name="Yandex Music"
            sub={user.yandex ? t.connected : t.yandexSub}
            connected={user.yandex}
            onConnect={() => setShowYandexModal(true)}
            onDisconnect={user.yandex ? handleYandexDisconnect : undefined}
          />
        </div>

        {/* Platform tags */}
        {(user.spotify || user.yandex) && (
          <div style={{ padding: '12px 16px 0', display: 'flex', gap: 6 }}>
            {user.spotify && <PlatformTag platform="spotify" size="sm" />}
            {user.yandex && <PlatformTag platform="yandex" size="sm" />}
          </div>
        )}

        {/* No music connected warning */}
        {!user.spotify && !user.yandex && (
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {t.noMusicWarning}
            </div>
          </div>
        )}

        {/* Public section visibility controls */}
        <SectionHeader title="Public music sections" />
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
          {[
            { key: 'show_recent_played', label: 'Recent played' },
            { key: 'show_top_songs', label: 'Top songs' },
            { key: 'show_top_artists', label: 'Favorite artists' },
            { key: 'show_activity', label: 'Activity' },
          ].map(({ key, label }) => {
            const k = key as 'show_top_songs' | 'show_top_artists' | 'show_recent_played' | 'show_activity';
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                <button
                  onClick={() => handleSectionVisibility(k, !visMusic[k])}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: '1px solid var(--hairline)',
                    background: visMusic[k] ? 'var(--accent)' : 'var(--surface-2)',
                    color: visMusic[k] ? '#000' : 'var(--text-muted)',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {visMusic[k] ? 'ON' : 'OFF'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        {hasMusic && (
          <>
            <SectionHeader title="Music insights (30d)" action={<button onClick={fetchInsights} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><Icon name="refresh" size={14} sw={1.8} /></button>} />
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insightsLoading && (
                <div style={{ padding: 14, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)', color: 'var(--text-muted)', fontSize: 13 }}>Loading insights...</div>
              )}
              {!insightsLoading && insights && insights.has_fallback && insights.fallback_note && (
                <div style={{ padding: 10, borderRadius: 10, background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.35)', fontSize: 12, color: 'var(--text-muted)' }}>
                  {insights.fallback_note}
                </div>
              )}
              {!insightsLoading && insights && visMusic.show_recent_played && insights.recent_played && (
                <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>MOST RECENT</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{insights.recent_played.song}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{insights.recent_played.artist}</div>
                  {insights.recent_played.last_listened_at && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>Last listened: {formatPlayedAt(insights.recent_played.last_listened_at)}</div>}
                </div>
              )}
              {!insightsLoading && insights && visMusic.show_top_songs && (
                <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>TOP SONGS</div>
                  {insights.top_songs.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not enough listening history.</div>
                  ) : (
                    insights.top_songs.slice(0, 5).map((s, i) => (
                      <div key={`${s.song}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.song}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.artist}</div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{s.play_count}x</div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {!insightsLoading && insights && visMusic.show_top_artists && (
                <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>FAVORITE ARTISTS</div>
                  {insights.top_artists.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not enough listening history.</div>
                  ) : (
                    insights.top_artists.slice(0, 5).map((a, i) => (
                      <div key={`${a.artist}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0' }}>
                        <div style={{ fontSize: 13 }}>{a.artist}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{a.play_count}x</div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {!insightsLoading && insights && visMusic.show_activity && (
                <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>ACTIVITY</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Today: <b style={{ color: 'var(--text)' }}>{insights.activity.plays_today}</b></span>
                    <span>7d: <b style={{ color: 'var(--text)' }}>{insights.activity.plays_last_7_days}</b></span>
                    <span>30d: <b style={{ color: 'var(--text)' }}>{insights.activity.plays_last_30_days}</b></span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Listening history */}
        {hasMusic && (
          <>
            <SectionHeader
              title={t.historyTitle}
              action={
                <button
                  onClick={fetchHistory}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                >
                  <Icon name="refresh" size={14} sw={1.8} />
                </button>
              }
            />
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {historyLoading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface-2)', flexShrink: 0, animation: 'avj-pulse 1.4s ease-in-out infinite' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ height: 12, width: '60%', borderRadius: 4, background: 'var(--surface-2)', animation: 'avj-pulse 1.4s ease-in-out infinite' }} />
                      <div style={{ height: 10, width: '40%', borderRadius: 4, background: 'var(--surface-2)', animation: 'avj-pulse 1.4s ease-in-out infinite' }} />
                    </div>
                  </div>
                ))
              )}
              {!historyLoading && history.length === 0 && (
                <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  {t.historyEmpty}
                </div>
              )}
              {!historyLoading && history.map((track, i) => {
                const when = formatPlayedAt(track.played_at);
                return (
                  <div key={i} style={{ padding: '9px 0', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < history.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                    <Album name={track.album} artist={track.artist} size={40} radius={6} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {track.song}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {track.artist}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      {when && (
                        <span style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                          {when}
                        </span>
                      )}
                      <PlatformTag platform={track.platform} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div style={{ height: 16 }} />
      </div>

      {/* Pinned footer actions */}
      <div style={{ flexShrink: 0, padding: '10px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--hairline)', background: 'var(--bg)' }}>
        <Button variant="ghost" size="md" icon="share" onClick={handleShare}>{t.shareProfile}</Button>
        {shareToast && (
          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--hairline)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
            {shareToast}
          </div>
        )}
        <Button
          variant="ghost"
          size="md"
          icon="logout"
          style={{ color: 'var(--text-muted)' }}
          onClick={logout}
        >
          {t.logout}
        </Button>
      </div>

      {showYandexModal && (
        <YandexDeviceModal onClose={() => setShowYandexModal(false)} onConnected={handleYandexConnected} />
      )}
    </AppShell>
  );
}
