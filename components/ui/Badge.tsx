import { type ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'solar' | 'navy' | 'green' | 'gray' | 'residential' | 'commercial' | 'industrial' | 'agricultural';
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  solar:        'bg-solar-500/10 text-solar-700 border border-solar-500/20',
  navy:         'bg-navy-800 text-white',
  green:        'bg-green-eco/10 text-green-700 border border-green-eco/20',
  gray:         'bg-slate-100 text-slate-600',
  residential:  'bg-blue-50 text-blue-700 border border-blue-200',
  commercial:   'bg-purple-50 text-purple-700 border border-purple-200',
  industrial:   'bg-orange-50 text-orange-700 border border-orange-200',
  agricultural: 'bg-green-50 text-green-700 border border-green-200',
};

const categoryMap: Record<string, NonNullable<BadgeProps['variant']>> = {
  residential:  'residential',
  commercial:   'commercial',
  industrial:   'industrial',
  agricultural: 'agricultural',
};

export default function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  const resolvedVariant = categoryMap[variant] ?? variant;
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-md font-semibold uppercase tracking-wide ${variantClasses[resolvedVariant]} ${className}`}
    >
      {children}
    </span>
  );
}
