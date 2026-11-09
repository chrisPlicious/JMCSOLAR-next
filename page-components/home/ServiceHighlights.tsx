import { Fragment, type ComponentType } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { ArrowRight, type LucideProps } from 'lucide-react';
import type { Service } from '@/data/services';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';

// The three services the homepage leads with, in order. Swap slugs here; the
// title, icon and link come from data/services.ts, the blurb is homepage-only
// (the full descriptions are too long for a column).
const HIGHLIGHTS: { slug: string; blurb: string }[] = [
  {
    slug: 'hybrid',
    blurb: 'Solar, battery and grid working together, so your lights stay on through a brownout.',
  },
  {
    slug: 'ongrid',
    blurb: 'The lowest-cost way to cut your bill. Extra solar goes back to the grid for credit.',
  },
  {
    slug: 'operation-maintenance',
    blurb: 'Cleaning, checks and monitoring that keep your system producing year after year.',
  },
];

function ServiceIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = Icons[name as keyof typeof Icons] as ComponentType<LucideProps> | undefined;
  return Icon ? <Icon {...props} /> : null;
}

/**
 * Homepage services band: three columns in one bordered strip, then
 * links to the rest. Server-rendered, so every service page keeps a crawlable
 * link from the homepage (the navbar's service links are client-only).
 */
export default function ServiceHighlights({ services }: { services: Service[] }) {
  const bySlug = new Map(services.map((s) => [s.slug, s]));
  const highlights = HIGHLIGHTS.flatMap(({ slug, blurb }) => {
    const service = bySlug.get(slug);
    return service ? [{ service, blurb }] : [];
  });
  const shown = new Set(highlights.map((h) => h.service.slug));
  const others = services.filter((s) => !shown.has(s.slug));

  return (
    <Section id="services" tone="tint" aria-labelledby="home-services-title">
      <SectionHeader
        id="home-services-title"
        title="Our services"
        lead="What most homes and businesses in Ormoc and Cebu ask us for."
      />

      <ul className="grid divide-y divide-navy-200 overflow-hidden rounded-card border border-navy-200 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {highlights.map(({ service, blurb }) => (
          <li key={service.slug}>
            <Link
              href={`/services/${service.slug}`}
              className="group flex h-full min-h-56 flex-col p-6 transition-colors duration-300 hover:bg-white sm:p-8 lg:min-h-80"
            >
              <ServiceIcon name={service.icon} className="size-6 text-solar-ink" aria-hidden />
              {/* Side by side, titles get two lines' room (one-liners sit at its foot)
                  so titles, blurbs and links line up across the three columns. */}
              <h3 className="mt-12 font-display text-2xl leading-tight font-bold text-fg lg:mt-16 lg:flex lg:min-h-[2lh] lg:items-end lg:text-3xl">
                {service.title}
              </h3>
              <p className="mt-3 text-fg-muted">{blurb}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-solar-ink">
                Learn more
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {others.length > 0 && (
          <p className="text-sm text-fg-muted">
            Also:{' '}
            {others.map((s, i) => (
              <Fragment key={s.slug}>
                {i > 0 && (i === others.length - 1 ? ' and ' : ', ')}
                <Link
                  href={`/services/${s.slug}`}
                  className="font-semibold text-fg underline-offset-4 hover:text-solar-ink hover:underline"
                >
                  {s.title}
                </Link>
              </Fragment>
            ))}
          </p>
        )}
        <Button href="/services" variant="secondary" className="self-start sm:self-auto">
          View all services <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </Section>
  );
}
