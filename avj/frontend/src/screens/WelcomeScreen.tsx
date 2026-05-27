import { useNavigate } from 'react-router-dom';
import { OnboardingShell } from '../components/layout/OnboardingShell';
import { Button } from '../components/ui/Button';
import { PulseRing } from '../components/ui/PulseRing';
import { Waveform } from '../components/ui/Waveform';
import { Album } from '../components/ui/Album';
import { useTheme } from '../context/ThemeContext';

export function WelcomeScreen() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <OnboardingShell>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px 28px' }}>
        {/* Brand row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            <PulseRing size={6} />
            AVJ · 0.1
          </div>
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
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Hero */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>
          <div>
            <div
              style={{
                fontSize: 'clamp(72px, 22vw, 96px)',
                fontWeight: 800,
                letterSpacing: -4.5,
                lineHeight: 0.9,
                color: 'var(--text)',
                fontFamily: 'var(--font)',
              }}
            >
              avj<span style={{ color: 'var(--accent)' }}>.</span>
            </div>
            <div
              style={{
                marginTop: 18,
                fontSize: 'clamp(18px, 5.5vw, 22px)',
                fontWeight: 500,
                letterSpacing: -0.5,
                lineHeight: 1.25,
                color: 'var(--text)',
                maxWidth: 280,
              }}
            >
              Do'stlaring nima eshityotganini ko'r —{' '}
              <span style={{ color: 'var(--text-muted)' }}>real vaqtda.</span>
            </div>
          </div>

          {/* Decorative now-playing card */}
          <div
            style={{
              padding: '14px',
              borderRadius: 16,
              border: '1px solid var(--hairline)',
              background: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              opacity: 0.92,
              animation: 'avj-fade-up 0.6s ease-out 0.3s both',
            }}
          >
            <Album name="Sevaman" artist="Og'abek" size={44} radius={8} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Aziza tinglamoqda
                </span>
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  letterSpacing: -0.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Sevaman — Og'abek
              </div>
            </div>
            <Waveform bars={4} height={14} />
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'avj-fade-up 0.6s ease-out 0.5s both' }}>
          <Button variant="primary" size="lg" onClick={() => navigate('/setup')}>
            Boshlash
          </Button>
          <Button variant="ghost" size="md" onClick={() => navigate('/login')}>
            Hisobim bor — kirish
          </Button>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 14,
              marginTop: 8,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>O'ZB</span>
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span>РУС</span>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
