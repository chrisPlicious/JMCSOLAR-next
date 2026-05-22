import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, CheckCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProjectCard from '@/components/ui/ProjectCard';
import { LOCATIONS, getLocation, getProvinceSlug } from '@/data/locations';
import { adminDb } from '@/lib/firebase/admin';
import { itemsNearCity } from '@/lib/data/nearestLocations';
import { SITE_URL } from '@/lib/seo/site';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';
import type { DbProject, DbService, DbServiceDetail } from '@/lib/firebase/types';
import type { Project } from '@/types';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const servicesSnap = await adminDb.collection('services').get();
    const serviceSlugs = servicesSnap.docs.map((d) => (d.data() as DbService).slug);
    return LOCATIONS.flatMap((loc) =>
      serviceSlugs.map((service) => ({ city: loc.slug, service }))
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}): Promise<Metadata> {
  const { city: citySlug, service: serviceSlug } = await params;
  const loc = getLocation(citySlug);
  if (!loc) return {};

  const snap = await adminDb.collection('services').where('slug', '==', serviceSlug).limit(1).get();
  if (snap.empty) return {};
  const svc = snap.docs[0].data() as DbService;

  const title =
    loc.tier === 'province'
      ? `${svc.title} in ${loc.name} Province | JMC Solar PH`
      : `${svc.title} in ${loc.name}, ${loc.province} | JMC Solar PH`;
  const description =
    loc.tier === 'province'
      ? `JMC Solar PH provides ${svc.title.toLowerCase()} services across ${loc.name} Province. DOE-compliant. Free site assessment.`
      : `JMC Solar PH provides ${svc.title.toLowerCase()} in ${loc.name}, ${loc.province}. Licensed engineers, DOE-compliant systems. Get a free quote.`;

  return {
    title,
    description,
    alternates: { canonical: `/locations/${citySlug}/${serviceSlug}` },
    openGraph: { title, description },
  };
}

export default async function CityServicePage({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}) {
  const { city: citySlug, service: serviceSlug } = await params;

  const loc = getLocation(citySlug);
  if (!loc) notFound();

  const serviceSnap = await adminDb
    .collection('services')
    .where('slug', '==', serviceSlug)
    .limit(1)
    .get();
  if (serviceSnap.empty) notFound();

  const svcDoc = serviceSnap.docs[0];
  const svc = svcDoc.data() as DbService;

  const detailSnap = await adminDb
    .collection('serviceDetails')
    .where('service_id', '==', svcDoc.id)
    .limit(1)
    .get();
  const detail = !detailSnap.empty ? (detailSnap.docs[0].data() as DbServiceDetail) : null;

  let projects: DbProject[] = [];
  let isFallback = false;

  if (loc.tier === 'municipality') {
    const snap = await adminDb
      .collection('projects')
      .where('city_slug', '==', citySlug)
      .limit(12)
      .get();
    projects = snap.docs
      .map((d) => d.data() as DbProject)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 4);

    if (projects.length === 0) {
      const allSnap = await adminDb.collection('projects').limit(200).get();
      projects = itemsNearCity(allSnap.docs.map((d) => d.data() as DbProject), loc).slice(0, 4);
      if (projects.length > 0) isFallback = true;
    }
  } else {
    const childSlugs = loc.childSlugs ?? [];
    if (childSlugs.length > 0) {
      const snap = await adminDb
        .collection('projects')
        .where('city_slug', 'in', childSlugs)
        .limit(12)
        .get();
      projects = snap.docs
        .map((d) => d.data() as DbProject)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 4);
    }
  }

  const mappedProjects: Project[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category as Project['category'],
    system_size: p.system_size,
    description: p.description,
    location: p.location,
    city_slug: p.city_slug,
    facebook_url: p.facebook_url,
    cover_image_path: p.cover_image_path,
    created_at: p.created_at,
    completed_at: null,
  }));

  const areaName = loc.tier === 'province' ? `${loc.name} Province` : loc.name;
  const locationLine =
    loc.tier === 'province' ? `${loc.name} Province · ${loc.region}` : `${loc.province} · ${loc.region}`;
  const provinceSlug = getProvinceSlug(loc.province);

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${svc.title} in ${areaName}`,
    description: svc.description,
    provider: { '@id': `${SITE_URL}/#business` },
    areaServed:
      loc.tier === 'province'
        ? { '@type': 'AdministrativeArea', name: loc.name }
        : {
            '@type': 'City',
            name: loc.name,
            containedInPlace: {
              '@type': 'AdministrativeArea',
              name: loc.province,
              containedInPlace: { '@type': 'Country', name: 'Philippines' },
            },
          },
    url: `${SITE_URL}/locations/${citySlug}/${serviceSlug}`,
  };

  const faqLd =
    loc.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: loc.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null;

  const breadcrumb = makeBreadcrumbLd([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: svc.title, url: `/services/${serviceSlug}` },
    { name: 'Locations', url: '/locations' },
    ...(loc.tier === 'municipality' && provinceSlug
      ? [{ name: `${loc.province} Province`, url: `/locations/${provinceSlug}` }]
      : []),
    { name: loc.name, url: `/locations/${citySlug}` },
    { name: `${svc.title} in ${loc.name}`, url: `/locations/${citySlug}/${serviceSlug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Layout>
        {/* Hero */}
        <section className="bg-navy-950 text-white pt-28 pb-16 sm:pt-32 sm:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-white/50 text-sm mb-8 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={13} />
              <Link href="/services" className="hover:text-white transition-colors">Services</Link>
              <ChevronRight size={13} />
              <Link href={`/services/${serviceSlug}`} className="hover:text-white transition-colors">
                {svc.title}
              </Link>
              <ChevronRight size={13} />
              <Link href="/locations" className="hover:text-white transition-colors">Locations</Link>
              {loc.tier === 'municipality' && provinceSlug && (
                <>
                  <ChevronRight size={13} />
                  <Link href={`/locations/${provinceSlug}`} className="hover:text-white transition-colors">
                    {loc.province}
                  </Link>
                </>
              )}
              <ChevronRight size={13} />
              <Link href={`/locations/${citySlug}`} className="hover:text-white transition-colors">
                {loc.name}
              </Link>
              <ChevronRight size={13} />
              <span className="text-white/80">{svc.title}</span>
            </nav>

            <p className="text-solar-400 text-sm font-semibold uppercase tracking-widest mb-3">
              {locationLine}
            </p>
            <h1
              className="font-black text-4xl sm:text-5xl lg:text-6xl mb-5 leading-tight"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {svc.title} in {areaName}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl leading-relaxed mb-8">
              {svc.description}
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Get a Free Quote
              <ChevronRight size={16} />
            </Link>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

          {/* City-specific intro */}
          <section>
            <h2
              className="font-black text-2xl sm:text-3xl text-navy-900 mb-4"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {svc.title} in {areaName}
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">{loc.intro}</p>
          </section>

          {/* Benefits from service detail */}
          {detail && detail.benefits.length > 0 && (
            <section>
              <h2
                className="font-black text-2xl sm:text-3xl text-navy-900 mb-8"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Benefits of {svc.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {detail.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200">
                    <CheckCircle size={20} className="text-solar-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-navy-900 mb-1">{b.title}</p>
                      <p className="text-slate-500 text-sm">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {mappedProjects.length > 0 && (
            <section>
              <h2
                className="font-black text-2xl sm:text-3xl text-navy-900 mb-8"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {isFallback ? `Solar Projects Near ${loc.name}` : `Our Work in ${loc.name}`}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mappedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          {loc.faqs.length > 0 && (
            <section>
              <h2
                className="font-black text-2xl sm:text-3xl text-navy-900 mb-8"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Frequently Asked Questions
              </h2>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
                {loc.faqs.map((faq, i) => (
                  <details key={i} className="group">
                    <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                      <span className="font-semibold text-navy-900 text-sm sm:text-base">
                        {faq.q}
                      </span>
                      <ChevronRight
                        size={18}
                        className="shrink-0 text-slate-400 group-open:rotate-90 transition-transform duration-200"
                      />
                    </summary>
                    <div className="px-6 pb-5 pt-4 text-slate-600 text-sm leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Related nav */}
          <div className="flex flex-wrap items-center gap-4 py-4 border-t border-slate-200 text-sm">
            <Link href={`/locations/${citySlug}`} className="text-slate-500 hover:text-solar-600 transition-colors">
              ← All services in {loc.name}
            </Link>
            <span className="text-slate-300">|</span>
            <Link href={`/services/${serviceSlug}`} className="text-slate-500 hover:text-solar-600 transition-colors">
              About {svc.title} →
            </Link>
          </div>

          {/* CTA */}
          <div className="bg-navy-950 rounded-3xl px-6 py-10 sm:px-10 sm:py-12 text-center">
            <h2
              className="text-white font-black text-2xl sm:text-3xl mb-3"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Ready for {svc.title} in {areaName}?
            </h2>
            <p className="text-white/60 text-lg mb-7 max-w-xl mx-auto">
              Get a free site assessment and custom quote from our licensed engineers.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold px-7 py-3.5 rounded-xl transition-colors duration-200"
            >
              Request a Free Quote
              <ChevronRight size={18} />
            </Link>
          </div>

        </div>
      </Layout>
    </>
  );
}
