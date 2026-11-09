import { type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Container } from './Section';

interface CtaAction {
  label: string;
  href: string;
}

interface CtaBandProps {
  title: ReactNode;
  body?: ReactNode;
  /** Defaults to the site-wide primary action. */
  primary?: CtaAction;
  /** Defaults to "Message us" → contact form; pass `null` to hide. */
  secondary?: CtaAction | null;
  /** Skip the outer section + container when already inside one. */
  bare?: boolean;
  className?: string;
}

export const PRIMARY_CTA: CtaAction = { label: 'Get a quote', href: '/booking' };
export const SECONDARY_CTA: CtaAction = { label: 'Message us', href: '/#contact' };

/** The one closing call to action: navy panel, module-grid texture, left-aligned copy. */
export default function CtaBand({
  title,
  body,
  primary = PRIMARY_CTA,
  secondary = SECONDARY_CTA,
  bare = false,
  className,
}: CtaBandProps) {
  const panel = (
    <div
      className={cn(
        'surface-dark texture-module overflow-hidden rounded-panel bg-navy-950 px-6 py-12 sm:px-12 sm:py-16',
        bare && className,
      )}
    >
      <div className="max-w-2xl">
        <h2 className="text-h2 text-fg">{title}</h2>
        {body && <p className="mt-4 text-lead text-fg-muted">{body}</p>}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Button href={primary.href} size="lg">
            {primary.label}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
          {secondary && (
            <Button href={secondary.href} variant="link" size="inline">
              {secondary.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (bare) return panel;

  return (
    <section className={cn('bg-white py-16 sm:py-20', className)}>
      <Container>{panel}</Container>
    </section>
  );
}
