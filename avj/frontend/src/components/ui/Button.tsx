import type { CSSProperties, ReactNode, MouseEvent } from 'react';
import { Icon, type IconName } from './Icon';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'accent';
type BtnSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children?: ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: IconName;
  full?: boolean;
  style?: CSSProperties;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const SIZES = {
  sm: { pad: '8px 14px', font: 13, radius: 10, iconSize: 14 },
  md: { pad: '14px 18px', font: 15, radius: 14, iconSize: 16 },
  lg: { pad: '17px 20px', font: 16, radius: 16, iconSize: 18 },
};

const VARIANTS = {
  primary:   { bg: 'var(--text)',      color: 'var(--bg)',      border: 'none' },
  secondary: { bg: 'var(--surface-2)', color: 'var(--text)',    border: '1px solid var(--hairline)' },
  ghost:     { bg: 'transparent',      color: 'var(--text)',    border: '1px solid var(--hairline)' },
  accent:    { bg: 'var(--accent)',     color: '#001911',        border: 'none' },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  full = true,
  style = {},
  onClick,
  disabled = false,
  type = 'button',
}: ButtonProps) {
  const s = SIZES[size];
  const v = VARIANTS[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: full ? '100%' : 'auto',
        padding: s.pad,
        borderRadius: s.radius,
        background: v.bg,
        color: v.color,
        border: v.border,
        fontFamily: 'var(--font)',
        fontWeight: 600,
        fontSize: s.font,
        letterSpacing: -0.1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform 0.12s ease, opacity 0.12s ease',
        WebkitAppearance: 'none',
        outline: 'none',
        ...style,
      }}
      onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
      onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      {icon && <Icon name={icon} size={s.iconSize} sw={2} />}
      {children}
    </button>
  );
}
