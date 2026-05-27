import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIndicator } from './HomeIndicator';

type TabId = 'home' | 'search' | 'add' | 'me';

interface TabItem {
  id: TabId;
  label: string;
  path: string;
}

const TABS: TabItem[] = [
  { id: 'home',   label: "Lenta",       path: '/home' },
  { id: 'search', label: "Qidiruv",     path: '/search' },
  { id: 'add',    label: "Qo'shish",    path: '/friends/add' },
  { id: 'me',     label: "Men",         path: '/profile' },
];

interface TabBarProps {
  active?: TabId;
}

export function TabBar({ active: activeProp }: TabBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const resolveActive = (): TabId => {
    if (activeProp) return activeProp;
    if (location.pathname.startsWith('/home')) return 'home';
    if (location.pathname.startsWith('/search')) return 'search';
    if (location.pathname.startsWith('/friends')) return 'add';
    if (location.pathname.startsWith('/profile')) return 'me';
    return 'home';
  };

  const active = resolveActive();

  return (
    <div
      style={{
        flexShrink: 0,
        background: 'var(--bg)',
        borderTop: '1px solid var(--hairline)',
        paddingTop: 8,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '0 8px' }}>
        {TABS.map(tab => {
          const on = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '4px 0',
                color: on ? 'var(--text)' : 'var(--text-dim)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                transition: 'color 0.15s',
              }}
            >
              <TabIcon id={tab.id} active={on} />
              <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500, letterSpacing: 0.1 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
      <HomeIndicator />
    </div>
  );
}

function TabIcon({ id, active }: { id: TabId; active: boolean }) {
  const stroke = 'currentColor';
  const sw = active ? 2.2 : 1.8;

  if (id === 'home') {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 9l8-6 8 6v9a1 1 0 0 1-1 1h-4v-6h-6v6H4a1 1 0 0 1-1-1V9z"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
          fillOpacity={active ? 0.12 : 0}
        />
      </svg>
    );
  }
  if (id === 'search') {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="10" cy="10" r="6" stroke={stroke} strokeWidth={sw} />
        <path d="M15 15l4 4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 'add') {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke={stroke} strokeWidth={sw} />
        <path d="M11 7v8M7 11h8" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 'me') {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="3.5" stroke={stroke} strokeWidth={sw} />
        <path d="M4 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      </svg>
    );
  }
  return null;
}
