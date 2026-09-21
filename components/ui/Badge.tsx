import { type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Status and category chips. Tones carry meaning — don't pick one for looks.
 * neutral = default/inactive, solar = featured/attention, success = done/paid,
 * danger = failed/cancelled, info = in progress/informational,
 * dark / on-dark = chips placed on navy surfaces.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      tone: {
        neutral: 'border-slate-200 bg-slate-100 text-slate-700',
        solar: 'border-solar-200 bg-solar-100 text-solar-700',
        success: 'border-green-200 bg-green-eco-bg text-green-800',
        danger: 'border-red-200 bg-red-50 text-red-700',
        info: 'border-navy-100 bg-navy-50 text-navy-700',
        dark: 'border-transparent bg-navy-900 text-white',
        'on-dark': 'border-white/15 bg-white/10 text-white',
      },
      caps: {
        true: 'uppercase tracking-[0.08em]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

// Project/client categories → tone. Kept as data so WhoWeServeCard and
// ProjectCard can pass the category string straight through.
export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

const categoryTone: Record<string, BadgeTone> = {
  residential: 'info',
  commercial: 'neutral',
  industrial: 'solar',
  agricultural: 'success',
  // Legacy variant names.
  navy: 'dark',
  green: 'success',
  gray: 'neutral',
};

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  /** A category name ("residential", …) or legacy variant; mapped to a tone. */
  variant?: string;
  className?: string;
}

export function badgeToneFor(category: string) {
  return categoryTone[category.toLowerCase()] ?? 'neutral';
}

export default function Badge({ children, tone, variant, caps, className }: BadgeProps) {
  const resolved = tone ?? (variant ? categoryTone[variant.toLowerCase()] ?? (variant as BadgeTone) : undefined);
  return <span className={cn(badgeVariants({ tone: resolved, caps }), className)}>{children}</span>;
}

export { Badge, badgeVariants };
