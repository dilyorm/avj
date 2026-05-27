import { useNavigate, useLocation } from 'react-router-dom';
import { PulseRing } from '../ui/PulseRing';
import { Avatar } from '../ui/Avatar';
import { Album } from '../ui/Album';
import { Icon } from '../ui/Icon';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

type NavId = 'home' | 'search' | 'add' | 'me';

const NAV_ITEMS = [
  { id: 'home'   as NavId, label: 'Lenta',       path: '/home',        icon: 'home'   as const },
  { id: 'search' as NavId, label: 'Qidiruv',     path: '/search',      icon: 'search' as const },
  { id: 'add'    as NavId, label: "Do'st qo'sh", path: '/friends/add', icon: 'plus'   as const },
  { id: 'me'     as NavId, label: 'Profil',       path: '/profile',     icon: 'user'   as const },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const getActive = (): NavId => {
    if (location.pathname.startsWith('/home'))    return 'home';
    if (location.pathname.startsWith('/search'))  return 'search';
    if (location.pathname.startsWith('/friends')) return 'add';
    if (location.pathname.startsWith('/profile')) return 'me';
    return 'home';
  };

  const active = getActive();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '24px 16px',
        background: 'var(--bg)',
        borderRight: '1px solid var(--hairline)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, paddingLeft: 4 }}>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1, color: 'var(--text)', fontFamily: 'var(--font)' }}>
          avj<span style={{ color: 'var(--accent)' }}>.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>
          <PulseRing size={5} />
          live
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const on = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 12,
                background: on ? 'var(--surface)' : 'transparent',
                color: on ? 'var(--text)' : 'var(--text-muted)',
                border: on ? '1px solid var(--hairline)' : '1px solid transparent',
                cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14,
                fontWeight: on ? 600 : 500, letterSpacing: -0.1,
                transition: 'all 0.15s', textAlign: 'left', width: '100%',
              }}
              onMouseEnter={e => !on && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)')}
              onMouseLeave={e => !on && ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
            >
              <Icon name={item.icon} size={18} sw={on ? 2.2 : 1.8} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Current user's now-playing mini-player */}
      {user?.now && (
        <div
          style={{
            padding: '12px', borderRadius: 14, background: 'var(--surface)',
            border: '1px solid var(--hairline)', marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 8 }}>
            Hozir tinglamoqda
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Album name={user.now.album} artist={user.now.artist} size={40} radius={8} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.now.song}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.now.artist}</div>
            </div>
          </div>
        </div>
      )}

      {/* User row + theme toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4 }}>
        <Avatar name={user?.name ?? ''} size={36} live={!!user?.now} onClick={() => navigate('/profile')} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name?.split(' ')[0] ?? ''}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>@{user?.handle ?? ''}</div>
        </div>
        <button
          onClick={toggleTheme}
          style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)',
            border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
          }}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} sw={1.8} />
        </button>
      </div>
    </div>
  );
}
