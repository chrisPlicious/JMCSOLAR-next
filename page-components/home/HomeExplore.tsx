import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import type { DbService } from '@/lib/firebase/types';
import { getProvinceLocations, getLocation, type ServiceLocation } from '@/data/locations';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';

// Server component: renders in-content links from the homepage (crawl depth 0) to
// services, service areas, and key pages — so link equity flows to the deep pages
// in the initial SSR HTML (the Navbar's service links are client-only).

const TOP_CITY_SLUGS = [
  'ormoc-city',
  'tacloban-city',
  'baybay-city',
  'maasin-city',
  'cebu-city',
  'mandaue-city',
];

const EXPLORE_LINKS = [
  { href: '/products', label: 'Solar Products' },
  { href: '/projects', label: 'Our Projects' },
  { href: '/results', label: 'Real Results' },
  { href: '/calculator', label: 'Savings Calculator' },
];

const columnTitle = 'mb-5 text-title text-fg';
const viewAllClass = 'mt-5 inline-flex items-center gap-1 text-sm font-semibold text-solar-ink hover:underline';

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowRight
          size={13}
          className="text-fg-subtle transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-solar-ink"
          aria-hidden
        />
        {label}
      </Link>
    </li>
  );
}

export default function HomeExplore({ services }: { services: DbService[] }) {
  const provinces = getProvinceLocations();
  const topCities = TOP_CITY_SLUGS
    .map((s) => getLocation(s))
    .filter((l): l is ServiceLocation => Boolean(l));

  return (
    <Section tone="white">
      <SectionHeader title="Everything Solar, In One Place" />

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
        {/* Services */}
        <div>
          <h3 className={columnTitle}>Our Solar Services</h3>
          <ul className="flex flex-col gap-3">
            {services.map((s) => (
              <LinkRow key={s.slug} href={`/services/${s.slug}`} label={s.title} />
            ))}
          </ul>
          <Link href="/services" className={viewAllClass}>
            View all services <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        {/* Service Areas */}
        <div>
          <h3 className={columnTitle}>Areas We Serve</h3>
          <ul className="flex flex-col gap-3">
            {provinces.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/locations/${p.slug}`}
                  className="group flex items-center gap-2 text-sm font-semibold text-fg transition-colors hover:text-solar-ink"
                >
                  <MapPin size={13} className="text-solar-ink" aria-hidden />
                  {p.name} Province
                </Link>
              </li>
            ))}
            {topCities.map((c) => (
              <LinkRow key={c.slug} href={`/locations/${c.slug}`} label={c.name} />
            ))}
          </ul>
          <Link href="/locations" className={viewAllClass}>
            View all locations <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        {/* Explore */}
        <div>
          <h3 className={columnTitle}>Explore JMC Solar</h3>
          <ul className="flex flex-col gap-3">
            {EXPLORE_LINKS.map((l) => (
              <LinkRow key={l.href} href={l.href} label={l.label} />
            ))}
          </ul>
          <Button href="/booking" className="mt-6">
            Book a free assessment <ArrowRight size={15} aria-hidden />
          </Button>
        </div>
      </div>
    </Section>
  );
}
