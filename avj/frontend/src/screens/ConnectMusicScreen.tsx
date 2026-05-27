import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OnboardingShell } from '../components/layout/OnboardingShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';
import { ConnectRow } from '../components/ui/ConnectRow';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';


export function ConnectMusicScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();

  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [yandexLoading, setYandexLoading] = useState(false);

  const errorParam = searchParams.get('error');

  // After OAuth redirects — refresh user data
  useEffect(() => {
    const spotify = searchParams.get('spotify');
    const yandex = searchParams.get('yandex');
    if (spotify === 'connected' || yandex === 'connected') {
      refreshUser();
    }
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

  const handleYandexConnect = useCallback(async () => {
    setYandexLoading(true);
    try {
      const res = await api.get<{ url: string }>('/connect/yandex/auth');
      window.location.href = res.url;
    } catch {
      setYandexLoading(false);
    }
  }, []);

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
            {errorParam === 'spotify_denied' && 'Spotify ruxsati rad etildi. Qayta urinib ko\'ring.'}
            {errorParam === 'yandex_denied' && 'Yandex ruxsati rad etildi. Qayta urinib ko\'ring.'}
            {errorParam === 'yandex_invalid_token' && 'Yandex Music token noto\'g\'ri. Qayta urinib ko\'ring.'}
            {errorParam === 'yandex_no_token' && 'Yandex tokenni olishda xatolik. Qayta urinib ko\'ring.'}
            {!['spotify_denied','yandex_denied','yandex_invalid_token','yandex_no_token'].includes(errorParam) && 'Ulanishda xatolik. Qayta urinib ko\'ring.'}
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
            sub={yandexConnected ? 'Ulangan' : yandexLoading ? 'Yo\'naltirilmoqda...' : 'Plus obunasi tavsiya etiladi'}
            connected={yandexConnected}
            onConnect={handleYandexConnect}
          />
        </div>

        <div style={{ flex: 1 }} />

        {/* Privacy note */}
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <Icon name="settings" size={16} stroke="var(--text-muted)" sw={1.5} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Avj sening parolingni saqlamaydi. Faqat hozirgi tracking nomini o'qiymiz.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {anyConnected && (
            <Button variant="primary" size="lg" onClick={() => navigate('/home')}>
              Boshlash →
            </Button>
          )}
          <Button variant="ghost" size="md" onClick={() => navigate('/home')}>
            Hozircha o'tkazib yuborish
          </Button>
        </div>
      </div>

    </OnboardingShell>
  );
}
