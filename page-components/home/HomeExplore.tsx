import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import type { DbService } from '@/lib/firebase/types';
import { getProvinceLocations, getLocation, type ServiceLocation } from '@/data/locations';

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

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-2 text-slate-600 hover:text-solar-600 transition-colors text-sm"
      >
        <ArrowRight size={13} className="text-solar-500/50 group-hover:translate-x-0.5 transition-transform" />
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
    <section className="bg-white py-20 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-solar-600 font-semibold text-sm uppercase tracking-widest mb-3 block">
            Explore
          </span>
          <h2
            className="text-navy-900 font-black text-3xl sm:text-4xl leading-tight"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Everything <span className="text-solar-500">Solar</span>, In One Place
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
          {/* Services */}
          <div>
            <h3 className="text-navy-900 font-bold mb-5 text-sm uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Our Solar Services
            </h3>
            <ul className="flex flex-col gap-3">
              {services.map((s) => (
                <LinkRow key={s.slug} href={`/services/${s.slug}`} label={s.title} />
              ))}
            </ul>
            <Link
              href="/services"
              className="inline-flex items-center gap-1 text-solar-600 hover:text-solar-500 text-sm font-semibold mt-5 transition-colors"
            >
              View all services <ArrowRight size={14} />
            </Link>
          </div>

          {/* Service Areas */}
          <div>
            <h3 className="text-navy-900 font-bold mb-5 text-sm uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Areas We Serve
            </h3>
            <ul className="flex flex-col gap-3">
              {provinces.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/locations/${p.slug}`}
                    className="group flex items-center gap-2 text-navy-800 hover:text-solar-600 transition-colors text-sm font-semibold"
                  >
                    <MapPin size={13} className="text-solar-500/60" />
                    {p.name} Province
                  </Link>
                </li>
              ))}
              {topCities.map((c) => (
                <LinkRow key={c.slug} href={`/locations/${c.slug}`} label={c.name} />
              ))}
            </ul>
            <Link
              href="/locations"
              className="inline-flex items-center gap-1 text-solar-600 hover:text-solar-500 text-sm font-semibold mt-5 transition-colors"
            >
              View all locations <ArrowRight size={14} />
            </Link>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-navy-900 font-bold mb-5 text-sm uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Explore JMC Solar
            </h3>
            <ul className="flex flex-col gap-3">
              {EXPLORE_LINKS.map((l) => (
                <LinkRow key={l.href} href={l.href} label={l.label} />
              ))}
            </ul>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold px-5 py-2.5 rounded-xl text-sm mt-6 transition-colors"
            >
              Book a Free Assessment <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
