import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OnboardingShell } from '../components/layout/OnboardingShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';
import { ConnectRow } from '../components/ui/ConnectRow';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

type DeviceState =
  | { phase: 'init' }
  | { phase: 'loading' }
  | { phase: 'waiting'; userCode: string; verificationUrl: string; deviceCode: string; expiresAt: number }
  | { phase: 'connected' }
  | { phase: 'expired' }
  | { phase: 'error'; message: string };

function YandexSheet({ onClose, onConnected }: { onClose: () => void; onConnected: () => void }) {
  const [state, setState] = useState<DeviceState>({ phase: 'init' });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  useEffect(() => () => stopPoll(), []);

  const startDeviceAuth = async () => {
    setState({ phase: 'loading' });
    try {
      const data = await api.post<{
        user_code: string; verification_url: string;
        device_code: string; expires_in: number; interval: number;
      }>('/connect/yandex/device', {});

      const expiresAt = Date.now() + data.expires_in * 1000;
      setState({
        phase: 'waiting',
        userCode: data.user_code,
        verificationUrl: data.verification_url,
        deviceCode: data.device_code,
        expiresAt,
      });

      const intervalMs = Math.max((data.interval || 5) * 1000, 5000);
      pollRef.current = setInterval(async () => {
        if (Date.now() > expiresAt) {
          stopPoll();
          setState({ phase: 'expired' });
          return;
        }
        try {
          const res = await api.post<{ status: string; detail?: string }>(
            '/connect/yandex/device/poll',
            { device_code: data.device_code },
          );
          if (res.status === 'connected') {
            stopPoll();
            setState({ phase: 'connected' });
            setTimeout(() => { onConnected(); onClose(); }, 1200);
          } else if (res.status === 'expired') {
            stopPoll();
            setState({ phase: 'expired' });
          } else if (res.status === 'error') {
            stopPoll();
            setState({ phase: 'error', message: res.detail || 'Noma\'lum xatolik' });
          }
          // 'pending' → keep polling
        } catch { /* network hiccup, keep polling */ }
      }, intervalMs);

    } catch (e: unknown) {
      setState({ phase: 'error', message: e instanceof Error ? e.message : 'Xatolik yuz berdi' });
    }
  };

  const s = state;

  return (
    <div
      onClick={() => { stopPoll(); onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: 'var(--bg)', borderRadius: '22px 22px 0 0', padding: '20px 20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--hairline)', margin: '0 auto' }} />
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.4 }}>Yandex Music</div>

        {s.phase === 'init' && (
          <>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>
              Yandex saytida tez tasdiqlash orqali ulanasiz. Parol kerak emas.
            </div>
            <Button variant="primary" size="lg" onClick={startDeviceAuth}>Boshlash</Button>
          </>
        )}

        {s.phase === 'loading' && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Yuklanmoqda...
          </div>
        )}

        {s.phase === 'waiting' && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Quyidagi tugmani bosib Yandex saytida tasdiqlang:
            </div>

            {/* Big code display */}
            <div style={{ textAlign: 'center', padding: '18px 0 10px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 8 }}>
                Tasdiqlash kodi
              </div>
              <div style={{
                fontSize: 36, fontWeight: 800, letterSpacing: 6, fontFamily: 'var(--font-mono)',
                color: 'var(--text)', background: 'var(--surface)',
                border: '1px solid var(--hairline)', borderRadius: 14,
                padding: '14px 24px', display: 'inline-block',
              }}>
                {s.userCode}
              </div>
            </div>

            <a
              href={s.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Button variant="primary" size="lg">
                Yandex saytida tasdiqlash →
              </Button>
            </a>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'avj-pulse 1.4s ease-in-out infinite' }} />
              Tasdiqlanishini kutmoqda...
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
              Sahifani ochgandan so'ng kodni kiriting va "Ruxsat berish" tugmasini bosing
            </div>
          </>
        )}

        {s.phase === 'connected' && (
          <div style={{ padding: '20px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(61,220,151,0.15)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={22} stroke="var(--accent)" sw={2.5} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Ulandi!</div>
          </div>
        )}

        {s.phase === 'expired' && (
          <>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)', fontSize: 13, color: '#FF5252' }}>
              Kod muddati tugadi. Qayta urinib ko'ring.
            </div>
            <Button variant="primary" size="lg" onClick={startDeviceAuth}>Qayta urinish</Button>
          </>
        )}

        {s.phase === 'error' && (
          <>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)', fontSize: 13, color: '#FF5252' }}>
              {s.message}
            </div>
            <Button variant="primary" size="lg" onClick={startDeviceAuth}>Qayta urinish</Button>
          </>
        )}
      </div>
    </div>
  );
}

export function ConnectMusicScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();

  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [showYandexSheet, setShowYandexSheet] = useState(false);

  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (searchParams.get('spotify') === 'connected') refreshUser();
  }, []);

  const spotifyConnected = user?.spotify ?? false;
  const yandexConnected = user?.yandex ?? false;
  const anyConnected = spotifyConnected || yandexConnected;

  const handleSpotifyConnect = async () => {
    setSpotifyLoading(true);
    try {
      const res = await api.get<{ url: string }>('/connect/spotify/auth');
      window.location.href = res.url;
    } catch {
      setSpotifyLoading(false);
    }
  };

  const handleYandexConnected = async () => {
    await refreshUser();
  };

  return (
    <OnboardingShell>
      <ScreenHeader
        left={
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4 }}>
            <Icon name="back" size={22} stroke="var(--text)" />
          </button>
        }
        right={
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>3 / 3</div>
        }
      />

      <div style={{ flex: 1, padding: '4px 24px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.1 }}>
            Musiqa hisobingni ula
          </div>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.45, maxWidth: 320 }}>
            Sen tinglagan tracklar do'stlaring lentasida ko'rinadi. Istalgan paytda o'chirib qo'yishing mumkin.
          </div>
        </div>

        {errorParam && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)', fontSize: 13, color: '#FF5252' }}>
            {errorParam === 'spotify_denied' ? 'Spotify ruxsati rad etildi.' : 'Ulanishda xatolik. Qayta urinib ko\'ring.'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <ConnectRow
            platform="spotify"
            name="Spotify"
            sub={spotifyConnected ? 'Ulangan' : spotifyLoading ? 'Yo\'naltirilmoqda...' : 'Premium yoki Free — farqi yo\'q'}
            connected={spotifyConnected}
            onConnect={handleSpotifyConnect}
          />
          <ConnectRow
            platform="yandex"
            name="Yandex Music"
            sub={yandexConnected ? 'Ulangan' : 'Token orqali ulanish'}
            connected={yandexConnected}
            onConnect={() => setShowYandexSheet(true)}
          />
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: 14, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--hairline)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="settings" size={16} stroke="var(--text-muted)" sw={1.5} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Avj sening parolingni saqlamaydi. Faqat hozirgi track nomini o'qiymiz.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {anyConnected && (
            <Button variant="primary" size="lg" onClick={() => navigate('/home')}>Boshlash →</Button>
          )}
          <Button variant="ghost" size="md" onClick={() => navigate('/home')}>Hozircha o'tkazib yuborish</Button>
        </div>
      </div>

      {showYandexSheet && (
        <YandexSheet onClose={() => setShowYandexSheet(false)} onConnected={handleYandexConnected} />
      )}
    </OnboardingShell>
  );
}
