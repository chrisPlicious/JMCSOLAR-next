import { type ReactNode } from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import { Container } from './Section';
import { Eyebrow } from './SectionHeader';

interface PageHeroProps {
  title: ReactNode;
  lead?: ReactNode;
  /** Only when it carries information (a category, a location). */
  eyebrow?: ReactNode;
  /** Buttons under the lead. */
  actions?: ReactNode;
  /** Optional photo behind a navy scrim (service detail pages). */
  media?: { src: string; alt?: string };
  /** `compact` for transactional pages (cart, checkout, 404). */
  size?: 'default' | 'compact';
  /** Extra content under the lead (chips, meta). */
  children?: ReactNode;
  className?: string;
}

/**
 * The one interior page header: navy-950 band that clears the fixed navbar,
 * a single h1, a lead. (No visible breadcrumb trail by design — breadcrumb
 * JSON-LD for search engines lives in the pages.) Without a photo it carries the
 * module-grid texture — the system's only decorative element.
 */
export default function PageHero({
  title,
  lead,
  eyebrow,
  actions,
  media,
  size = 'default',
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        'surface-dark relative isolate overflow-hidden bg-navy-950',
        !media && 'texture-module',
        className,
      )}
    >
      {media && (
        <>
          <Image
            src={media.src}
            alt={media.alt ?? ''}
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
          {/* Scrim guarantees AA contrast for white copy over any photo. */}
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/55"
            aria-hidden
          />
        </>
      )}
      <Container
        className={cn(
          'relative',
          size === 'compact' ? 'pt-28 pb-10 sm:pt-32 sm:pb-12' : 'pt-28 pb-14 sm:pt-36 sm:pb-20',
        )}
      >
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h1 className="max-w-4xl text-h1 text-fg">{title}</h1>
        {lead && <p className="mt-5 max-w-2xl text-lead text-fg-muted">{lead}</p>}
        {children}
        {actions && <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>}
      </Container>
    </section>
  );
}
