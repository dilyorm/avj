import type { ReactNode } from 'react';
import { StatusBar } from './StatusBar';
import { HomeIndicator } from './HomeIndicator';

interface OnboardingShellProps {
  children: ReactNode;
}

export function OnboardingShell({ children }: OnboardingShellProps) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '0',
      }}
    >
      {/* Desktop: ambient background */}
      <div
        className="hidden md:block"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at 60% 30%, rgba(61,220,151,0.04) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 390,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="md:min-h-0 md:rounded-[40px] md:overflow-hidden md:shadow-2xl md:my-8"
      >
        <StatusBar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
        <HomeIndicator />
      </div>
    </div>
  );
}
