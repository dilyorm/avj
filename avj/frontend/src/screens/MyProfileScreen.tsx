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

  const [visible, setVisible] = useState(user?.visible ?? true);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [showYandexModal, setShowYandexModal] = useState(false);
  const [history, setHistory] = useState<HistoryTrack[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { fetchHistory(); }, [user.spotify, user.yandex]);

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
        title="Men"
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4 }}>
              <Icon name="settings" size={22} stroke="var(--text)" sw={1.6} />
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
              <span><b style={{ color: 'var(--text)' }}>{user.friend_count}</b> do'st</span>
              <span style={{ color: 'var(--text-dim)' }}>·</span>
              <span><b style={{ color: 'var(--text)' }}>{user.track_count}</b> track</span>
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
                  <LiveChip label="SEN HOZIR" />
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
                    OXIRGI TINGLANGAN
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
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Hozir hech narsa tinglamayapsan</div>
            </div>
          </div>
        )}

        {/* Visibility toggle */}
        <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8, opacity: visibilityLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          <StatusPill label="Ko'rinaman" active={visible} onClick={() => handleVisibility(true)} />
          <StatusPill label="Yashirin" active={!visible} onClick={() => handleVisibility(false)} />
        </div>

        {/* Platforms */}
        <SectionHeader title="Ulangan hisoblar" />
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ConnectRow
            platform="spotify"
            name="Spotify"
            sub={user.spotify ? 'Ulangan' : 'Premium yoki Free'}
            connected={user.spotify}
            onConnect={handleSpotifyConnect}
            onDisconnect={user.spotify ? handleSpotifyDisconnect : undefined}
          />
          <ConnectRow
            platform="yandex"
            name="Yandex Music"
            sub={user.yandex ? 'Ulangan' : 'Token orqali ulanish'}
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
              Musiqa hisobingni ulab, do'stlaringga nima eshityotganingni ko'rsat.
            </div>
          </div>
        )}

        {/* Listening history */}
        {hasMusic && (
          <>
            <SectionHeader
              title="Oxirgi tinglangan"
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
                  Tarix topilmadi
                </div>
              )}
              {!historyLoading && history.map((t, i) => {
                const when = formatPlayedAt(t.played_at);
                return (
                  <div key={i} style={{ padding: '9px 0', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < history.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                    <Album name={t.album} artist={t.artist} size={40} radius={6} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.song}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.artist}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      {when && (
                        <span style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                          {when}
                        </span>
                      )}
                      <PlatformTag platform={t.platform} size="sm" />
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
        <Button variant="ghost" size="md" icon="share" onClick={handleShare}>Profilni ulashish</Button>
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
          Chiqish
        </Button>
      </div>

      {showYandexModal && (
        <YandexDeviceModal onClose={() => setShowYandexModal(false)} onConnected={handleYandexConnected} />
      )}
    </AppShell>
  );
}
