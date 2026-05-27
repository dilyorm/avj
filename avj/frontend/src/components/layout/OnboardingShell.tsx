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
      {/* Ambient glow — desktop only */}
      <div
        className="hidden md:block"
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(ellipse at 60% 30%, rgba(61,220,151,0.05) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/*
        Card:
        - Mobile: full viewport height, no rounding
        - Desktop (md+): auto height, max 480px wide, rounded card with shadow
        All responsive overrides in Tailwind classes — NOT in inline style,
        because inline styles always win over Tailwind and break responsive variants.
      */}
      <div
        className={[
          // base (mobile)
          'relative flex flex-col w-full overflow-hidden',
          'min-h-[100dvh]',
          // desktop override
          'md:min-h-0 md:max-w-[480px] md:rounded-[24px] md:shadow-xl',
          'md:my-10 md:border md:border-[var(--hairline)]',
        ].join(' ')}
        style={{ background: 'var(--bg)', zIndex: 1 }}
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
