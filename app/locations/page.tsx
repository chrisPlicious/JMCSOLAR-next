import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import PageHero from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cardVariants } from '@/components/ui/Card';
import CtaBand from '@/components/ui/CtaBand';
import { getMunicipalityLocations, getProvinceLocations, provinceLabel } from '@/data/locations';
import { SITE_URL } from '@/lib/seo/site';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';
import { pageMetadata } from '@/lib/seo/metadata';
import { BUSINESS_ID } from '@/lib/seo/organization';
import { SERVICE_AREA } from '@/lib/seo/business';

// Derived, not typed: adding a location in data/locations.ts updates every mention.
const CITY_COUNT = getMunicipalityLocations().length;

export const metadata: Metadata = pageMetadata({
  title: 'Solar Installation Locations',
  description: `JMC Solar PH serves ${CITY_COUNT} cities and municipalities across ${SERVICE_AREA}. Find professional solar installation services near you.`,
  path: '/locations',
});

export default function LocationsPage() {
  const municipalities = getMunicipalityLocations();
  const provinces = getProvinceLocations();

  const collectionPageLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Solar Installation Locations — JMC Solar PH',
    description: 'Cities and municipalities served by JMC Solar PH across Eastern and Central Visayas',
    url: `${SITE_URL}/locations`,
    provider: { '@id': BUSINESS_ID },
  };

  const breadcrumb = makeBreadcrumbLd([
    { name: 'Home', url: '/' },
    { name: 'Locations', url: '/locations' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Layout>
        <PageHero
          title="Solar Installation Areas"
          lead={
            <>
              JMC Solar PH installs solar energy systems across{' '}
              <span className="font-semibold text-fg">{CITY_COUNT} cities and municipalities</span> in{' '}
              {SERVICE_AREA}. Select your area below to learn more.
            </>
          }
        />

        {/* Province sections — alternate tones so each province reads as its own band */}
        {provinces.map((province, i) => {
          const children = municipalities.filter((m) => province.childSlugs?.includes(m.slug));
          return (
            <Section key={province.slug} tone={i % 2 === 0 ? 'white' : 'tint'}>
              <SectionHeader
                title={provinceLabel(province.name)}
                actions={
                  <Link
                    href={`/locations/${province.slug}`}
                    className="text-sm font-semibold text-solar-ink hover:underline"
                  >
                    View province overview →
                  </Link>
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {children.map((loc) => (
                  <Link
                    key={loc.slug}
                    href={`/locations/${loc.slug}`}
                    className={cardVariants({ variant: 'link-row' })}
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-control bg-solar-50 text-solar-700">
                      <MapPin size={15} aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-fg transition-colors group-hover:text-solar-ink">
                        {loc.name}
                      </p>
                      <p className="text-xs text-fg-subtle">{loc.region}</p>
                    </div>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-fg-subtle transition-colors group-hover:text-solar-ink"
                      aria-hidden
                    />
                  </Link>
                ))}
              </div>
            </Section>
          );
        })}

        <CtaBand
          title="Don't see your area?"
          body="We're expanding. Contact us and we'll let you know if we serve your municipality."
        />
      </Layout>
    </>
  );
}
