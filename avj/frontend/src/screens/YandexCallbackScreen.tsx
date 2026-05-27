import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function YandexCallbackScreen() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Yandex implicit flow: token arrives in URL fragment (not query string)
    const hash = window.location.hash.slice(1); // strip leading #
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');

    if (!token) {
      setStatus('error');
      setErrorMsg('Token topilmadi. Qayta urinib ko\'ring.');
      return;
    }

    api.post('/connect/yandex', { token })
      .then(() => navigate('/connect?yandex=connected', { replace: true }))
      .catch((e: unknown) => {
        setStatus('error');
        setErrorMsg(
          e instanceof Error
            ? e.message
            : 'Yandex Music token noto\'g\'ri. Qayta urinib ko\'ring.'
        );
      });
  }, []);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        flexDirection: 'column',
        gap: 16,
        padding: '0 24px',
        textAlign: 'center',
      }}
    >
      {status === 'processing' ? (
        <>
          <div style={{ fontSize: 32 }}>⏳</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Yandex Music ulanmoqda...</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Bir moment</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 32 }}>❌</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Ulanishda xatolik</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, lineHeight: 1.5 }}>{errorMsg}</div>
          <button
            onClick={() => navigate('/connect')}
            style={{
              marginTop: 8,
              padding: '10px 20px',
              borderRadius: 12,
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font)',
            }}
          >
            Orqaga
          </button>
        </>
      )}
    </div>
  );
}
