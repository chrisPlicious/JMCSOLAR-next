import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { LOCATIONS, getMunicipalityLocations, getProvinceLocations } from '@/data/locations';
import { SITE_URL } from '@/lib/seo/site';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';

export const metadata: Metadata = {
  title: 'Solar Installation Locations | JMC Solar PH',
  description:
    'JMC Solar PH serves 19 cities and municipalities across Leyte, Southern Leyte, and Cebu. Find professional solar installation services near you.',
  alternates: { canonical: '/locations' },
  openGraph: {
    title: 'Solar Installation Locations | JMC Solar PH',
    description:
      'Professional solar installation in Leyte, Southern Leyte, and Cebu. 19 cities and municipalities served.',
  },
};

export default function LocationsPage() {
  const municipalities = getMunicipalityLocations();
  const provinces = getProvinceLocations();

  const collectionPageLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Solar Installation Locations — JMC Solar PH',
    description: 'Cities and municipalities served by JMC Solar PH across Eastern and Central Visayas',
    url: `${SITE_URL}/locations`,
    provider: { '@id': `${SITE_URL}/#business` },
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
        {/* Hero */}
        <section className="bg-navy-950 text-white pt-28 pb-16 sm:pt-32 sm:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-white/50 text-sm mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={13} />
              <span className="text-white/80">Locations</span>
            </nav>
            <h1
              className="font-black text-4xl sm:text-5xl lg:text-6xl mb-5 leading-tight"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Areas We Serve
            </h1>
            <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
              JMC Solar PH installs solar energy systems across{' '}
              <span className="text-white font-semibold">19 cities and municipalities</span> in Leyte,
              Southern Leyte, and Cebu. Select your area below to learn more.
            </p>
          </div>
        </section>

        {/* Province sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
          {provinces.map((province) => {
            const children = municipalities.filter((m) => province.childSlugs?.includes(m.slug));
            return (
              <section key={province.slug}>
                <div className="flex flex-wrap items-baseline gap-4 mb-8">
                  <h2
                    className="font-black text-2xl sm:text-3xl text-navy-900"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {province.name} Province
                  </h2>
                  <Link
                    href={`/locations/${province.slug}`}
                    className="text-solar-600 text-sm font-semibold hover:underline"
                  >
                    View province overview →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {children.map((loc) => (
                    <Link
                      key={loc.slug}
                      href={`/locations/${loc.slug}`}
                      className="group flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-solar-400 hover:bg-solar-500/5 transition-all duration-200"
                    >
                      <div className="w-9 h-9 bg-solar-500/10 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin size={15} className="text-solar-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-navy-900 text-sm group-hover:text-solar-600 transition-colors truncate">
                          {loc.name}
                        </p>
                        <p className="text-slate-400 text-xs">{loc.region}</p>
                      </div>
                      <ChevronRight
                        size={14}
                        className="shrink-0 text-slate-300 group-hover:text-solar-500 transition-colors"
                      />
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Bottom CTA */}
          <div className="bg-navy-950 rounded-3xl px-6 py-10 sm:px-10 sm:py-12 text-center">
            <h2
              className="text-white font-black text-2xl sm:text-3xl mb-3"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Don&apos;t see your area?
            </h2>
            <p className="text-white/60 text-lg mb-7 max-w-xl mx-auto">
              We&apos;re expanding. Contact us and we&apos;ll let you know if we serve your municipality.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold px-7 py-3.5 rounded-xl transition-colors duration-200"
            >
              Contact JMC Solar PH
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </Layout>
    </>
  );
}
