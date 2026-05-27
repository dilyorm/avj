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
      }}
    >
      {/* Desktop: ambient glow */}
      <div
        className="hidden md:block"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at 60% 30%, rgba(61,220,151,0.05) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Card — full screen on mobile, centered card on desktop */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="md:min-h-0 md:rounded-[24px] md:overflow-hidden md:shadow-xl md:my-10 md:border md:border-[var(--hairline)]"
      >
        {/* StatusBar and HomeIndicator only appear when installed as PWA */}
        <StatusBar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
        <HomeIndicator />
      </div>
    </div>
  );
}
