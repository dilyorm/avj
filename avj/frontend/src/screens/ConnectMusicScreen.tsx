import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OnboardingShell } from '../components/layout/OnboardingShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';
import { ConnectRow } from '../components/ui/ConnectRow';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function YandexSheet({ onClose, onSave }: { onClose: () => void; onSave: (token: string) => Promise<void> }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onSave(token.trim());
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Token noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--bg)',
          borderRadius: '22px 22px 0 0',
          padding: '20px 20px 36px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--hairline)', margin: '0 auto' }} />
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.4 }}>Yandex Music token</div>

        {/* Step-by-step instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['1', 'music.yandex.ru saytini oching (kirgan bo\'ling)'],
            ['2', 'F12 → Network tab → sahifani yangilang'],
            ['3', 'Har qanday so\'rovni bosing → Headers'],
            ['4', 'Authorization: OAuth XXXXX — token qismini ko\'chiring'],
          ].map(([n, text]) => (
            <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: '#000',
                fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 1,
              }}>{n}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{text}</div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)', fontSize: 13, color: '#FF5252' }}>
            {error}
          </div>
        )}

        <div style={{ padding: '12px 16px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase' }}>
            OAuth TOKEN
          </div>
          <input
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="y0_AgAAAA... yoki boshqa format"
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-mono)', padding: 0,
            }}
          />
        </div>

        <Button variant="primary" size="lg" disabled={loading || !token.trim()} onClick={handleSave}>
          {loading ? 'Tekshirilmoqda...' : 'Ulash'}
        </Button>
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

  const handleYandexSave = async (token: string) => {
    await api.post('/connect/yandex', { token });
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
        <YandexSheet onClose={() => setShowYandexSheet(false)} onSave={handleYandexSave} />
      )}
    </OnboardingShell>
  );
}
