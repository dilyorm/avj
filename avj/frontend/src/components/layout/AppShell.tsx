import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { StatusBar } from './StatusBar';

interface AppShellProps {
  children: ReactNode;
  showTabBar?: boolean;
}

export function AppShell({ children, showTabBar = true }: AppShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
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

      {/* Main */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
          maxWidth: 680,
        }}
      >
        {/* Mobile status bar */}
        <div className="md:hidden">
          <StatusBar />
        </div>

        {/* Screen content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>

        {/* Mobile tab bar */}
        {showTabBar && (
          <div className="md:hidden">
            <TabBar />
          </div>
        )}
      </main>

      {/* Desktop right gutter */}
      <div className="hidden lg:block" style={{ width: 280, flexShrink: 0 }} />
    </div>
  );
}
