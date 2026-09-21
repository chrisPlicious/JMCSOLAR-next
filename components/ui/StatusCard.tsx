import { type ReactNode } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

const tones = {
  success: { icon: CheckCircle2, ring: 'bg-green-eco/15 text-green-eco' },
  pending: { icon: Clock, ring: 'bg-solar-500/15 text-solar-400' },
  error: { icon: XCircle, ring: 'bg-red-500/15 text-red-400' },
} as const;

interface StatusCardProps {
  tone: keyof typeof tones;
  title: ReactNode;
  /** One line under the title (e.g. a reference number). */
  subtitle?: ReactNode;
  children?: ReactNode;
  /** Buttons at the bottom of the card. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Result pages (booking/shop confirmation, stub checkout): a navy status
 * header over a white body. Render it inside the site Layout so visitors keep
 * the navigation.
 */
export default function StatusCard({ tone, title, subtitle, children, actions, className }: StatusCardProps) {
  const { icon: Icon, ring } = tones[tone];
  return (
    <div className={cn('mx-auto w-full max-w-xl overflow-hidden rounded-panel border border-line bg-white shadow-card', className)}>
      <div className="surface-dark bg-navy-950 px-6 py-10 text-center sm:px-10">
        <div className={cn('mx-auto mb-5 grid size-14 place-items-center rounded-full', ring)}>
          <Icon className="size-7" aria-hidden />
        </div>
        <h1 className="text-h2 text-fg">{title}</h1>
        {subtitle && <p className="mt-3 text-fg-muted">{subtitle}</p>}
      </div>
      {children && <div className="px-6 py-8 sm:px-10">{children}</div>}
      {actions && (
        <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-6 sm:flex-row sm:justify-end sm:px-10">
          {actions}
        </div>
      )}
    </div>
  );
}
