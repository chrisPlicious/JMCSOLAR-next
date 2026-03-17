'use client';

import { type ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-solar-500 hover:bg-solar-400 text-navy-900 font-bold shadow-md hover:shadow-glow-solar',
  secondary:
    'bg-navy-900 hover:bg-navy-800 text-white font-bold shadow-md hover:shadow-elevated',
  outline:
    'border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-semibold backdrop-blur-sm',
  ghost:
    'text-navy-700 hover:text-solar-500 font-medium',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-5 py-2 text-sm rounded-full',
  md: 'px-7 py-3 text-base rounded-full',
  lg: 'px-8 py-4 text-base rounded-full',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  href,
  className = '',
  type = 'button',
  disabled = false,
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer active:scale-[0.97]';
  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}