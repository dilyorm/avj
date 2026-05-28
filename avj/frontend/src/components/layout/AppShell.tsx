import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { StatusBar } from './StatusBar';
import { Album } from '../ui/Album';
import { PlatformTag } from '../ui/PlatformTag';
import { Waveform } from '../ui/Waveform';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

interface AppShellProps {
  children: ReactNode;
  showTabBar?: boolean;
}

function RightPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '28px 20px',
        gap: 16,
        borderLeft: '1px solid var(--hairline)',
        overflowY: 'auto',
      }}
      className="no-scrollbar"
    >
      {/* Header label */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
        {t.yourFeed}
      </div>

      {/* Now playing / last played card */}
      {(user?.now || user?.last_played) ? (() => {
        const track = user.now ?? user.last_played!;
        const isLive = !!user.now;
        return (
          <div
            style={{
              borderRadius: 18,
              background: 'var(--surface)',
              border: `1px solid ${isLive ? 'var(--accent-dim)' : 'var(--hairline)'}`,
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isLive ? <Waveform bars={3} height={10} /> : (
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{t.lastTrack}</span>
              )}
              <PlatformTag platform={track.platform as 'spotify' | 'yandex'} />
            </div>
            <Album name={track.album} artist={track.artist} size={220} radius={14} style={{ width: '100%', height: 200 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.2 }}>{track.song}</div>
              <div style={{ marginTop: 3, fontSize: 12, color: 'var(--text-muted)' }}>
                {track.artist}
                {track.album && <span style={{ color: 'var(--text-dim)' }}> · {track.album}</span>}
              </div>
            </div>
          </div>
        );
      })() : (
        <div
          style={{
            borderRadius: 18,
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 18V6l11-3v12"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="15" r="3"/>
            </svg>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{t.nothingNow}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {user?.spotify || user?.yandex ? t.openMusicApp : t.connectMusicAccount}
          </div>
          {!user?.spotify && !user?.yandex && (
            <button
              onClick={() => navigate('/connect')}
              style={{
                marginTop: 4, padding: '8px 16px', borderRadius: 10,
                background: 'var(--accent)', color: '#000', border: 'none',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
              }}
            >
              {t.connectBtn}
            </button>
          )}
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* App info */}
      <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
        {t.tagline}
      </div>
    </div>
  );
}

export function AppShell({ children, showTabBar = true }: AppShellProps) {
  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Left sidebar (md+) ─────────────────────────────── */}
      <aside
        className="hidden md:flex"
        style={{
          width: 220,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100dvh',
          overflowY: 'auto',
        }}
      >
        <Sidebar />
      </aside>

      {/* ── Main column ────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          overflow: 'hidden',
        }}
      >
        {/* Status bar — only shown when installed as PWA */}
        <StatusBar />

        {/* Content — centered with max-width on desktop */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            width: '100%',
            maxWidth: 800,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {children}
        </div>

        {/* Bottom tab bar — mobile only */}
        {showTabBar && (
          <div className="md:hidden" style={{ flexShrink: 0 }}>
            <TabBar />
          </div>
        )}
      </main>

      {/* ── Right panel (xl+) ──────────────────────────────── */}
      <aside
        className="hidden xl:flex"
        style={{
          width: 300,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100dvh',
        }}
      >
        <RightPanel />
      </aside>
    </div>
  );
}
