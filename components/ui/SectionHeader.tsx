import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Small caps label. Use at most one per page and only when it carries real
 * information (a category, a location, a count) — never as decoration.
 */
export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn('eyebrow', className)}>{children}</p>;
}

interface SectionHeaderProps {
  title: ReactNode;
  lead?: ReactNode;
  eyebrow?: ReactNode;
  /** Left by default. Centre only for short interstitials (partners, reviews). */
  align?: 'left' | 'center';
  /** Right-aligned slot on wide screens (e.g. a "View all" link). */
  actions?: ReactNode;
  as?: 'h2' | 'h3';
  id?: string;
  className?: string;
}

/** h2 + optional lead. Colours follow the surface (text-fg / text-fg-muted). */
export function SectionHeader({
  title,
  lead,
  eyebrow,
  align = 'left',
  actions,
  as: Heading = 'h2',
  id,
  className,
}: SectionHeaderProps) {
  const centered = align === 'center';
  const copy = (
    <div className={cn('max-w-3xl', centered && 'mx-auto text-center')}>
      {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
      <Heading id={id} className={cn('text-fg', Heading === 'h2' ? 'text-h2' : 'text-h3')}>
        {title}
      </Heading>
      {lead && <p className={cn('mt-4 text-lead text-fg-muted', centered && 'mx-auto max-w-2xl')}>{lead}</p>}
    </div>
  );

  if (!actions) return <div className={cn('mb-10 sm:mb-12', className)}>{copy}</div>;

  return (
    <div className={cn('mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between', className)}>
      {copy}
      <div className="shrink-0">{actions}</div>
    </div>
  );
}

export default SectionHeader;
