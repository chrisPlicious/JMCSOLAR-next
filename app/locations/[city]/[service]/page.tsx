import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronRight, CheckCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import PageHero from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import CtaBand from '@/components/ui/CtaBand';
import ProjectCard from '@/components/ui/ProjectCard';
import { LOCATIONS, getLocation, getProvinceSlug, provinceLabel } from '@/data/locations';
import { adminDb } from '@/lib/firebase/admin';
import { itemsNearCity } from '@/lib/data/nearestLocations';
import { isIndexableCityService } from '@/data/indexableCityServices';
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

  // The root layout template appends "| JMC Solar PH"; OG titles don't use the template.
  const title =
    loc.tier === 'province'
      ? `${svc.title} in ${provinceLabel(loc.name)}`
      : `${svc.title} in ${loc.name}, ${loc.province}`;
  const description =
    loc.tier === 'province'
      ? `JMC Solar PH provides ${svc.title.toLowerCase()} services across ${provinceLabel(loc.name)}. DOE-compliant. Free site assessment.`
      : `JMC Solar PH provides ${svc.title.toLowerCase()} in ${loc.name}, ${loc.province}. Licensed engineers, DOE-compliant systems. Get a free quote.`;

  return {
    title,
    description,
    // Prune: these auto-generated combos are thin near-duplicates. noindex,follow
    // (still crawl outbound links) unless allowlisted in data/indexableCityServices.ts.
    // Keep the SELF canonical — never pair noindex with a canonical to a different URL.
    robots: { index: isIndexableCityService(citySlug, serviceSlug), follow: true },
    alternates: { canonical: `/locations/${citySlug}/${serviceSlug}` },
    openGraph: { title: `${title} | JMC Solar PH`, description },
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

  const areaName = loc.tier === 'province' ? provinceLabel(loc.name) : loc.name;
  const locationLine =
    loc.tier === 'province' ? `${provinceLabel(loc.name)} · ${loc.region}` : `${loc.province} · ${loc.region}`;
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
    ...(loc.tier === 'municipality' && provinceSlug && loc.province
      ? [{ name: provinceLabel(loc.province), url: `/locations/${provinceSlug}` }]
      : []),
    { name: loc.name, url: `/locations/${citySlug}` },
    { name: `${svc.title} in ${loc.name}`, url: `/locations/${citySlug}/${serviceSlug}` },
  ]);

  // Alternate white / tint across whichever sections actually render.
  const bands = [
    'intro',
    detail && detail.benefits.length > 0 && 'benefits',
    mappedProjects.length > 0 && 'projects',
    loc.faqs.length > 0 && 'faq',
    'related',
  ].filter((b): b is string => Boolean(b));
  const tone = (band: string) => (bands.indexOf(band) % 2 === 0 ? 'white' : 'tint');

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Layout>
        <PageHero
          eyebrow={locationLine}
          title={`${svc.title} in ${areaName}`}
          lead={svc.description}
          actions={
            <Button href="/booking" size="lg">
              Get a quote
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          }
        />

        {/* City-specific intro (h2 differs from the h1 — it introduces the local team) */}
        <Section tone={tone('intro')}>
          <SectionHeader title={`JMC Solar PH in ${areaName}`} className="mb-6 sm:mb-6" />
          <p className="max-w-3xl text-lead text-fg-muted">{loc.intro}</p>
        </Section>

        {/* Benefits from service detail */}
        {detail && detail.benefits.length > 0 && (
          <Section tone={tone('benefits')}>
            <SectionHeader title={`Benefits of ${svc.title}`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {detail.benefits.map((b, i) => (
                <Card key={i} padding="md" className="flex items-start gap-4">
                  <CheckCircle size={20} className="mt-0.5 shrink-0 text-green-eco" aria-hidden />
                  <div>
                    <h3 className="text-title text-fg mb-1">{b.title}</h3>
                    <p className="text-sm text-fg-muted">{b.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* Projects */}
        {mappedProjects.length > 0 && (
          <Section tone={tone('projects')}>
            <SectionHeader title={isFallback ? `Solar Projects Near ${loc.name}` : `Our Work in ${loc.name}`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mappedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </Section>
        )}

        {/* FAQ */}
        {loc.faqs.length > 0 && (
          <Section tone={tone('faq')}>
            <SectionHeader title="Frequently Asked Questions" />
            <div className="max-w-3xl divide-y divide-slate-200 overflow-hidden rounded-card border border-line bg-white">
              {loc.faqs.map((faq, i) => (
                <details key={i} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-slate-50">
                    <span className="text-sm font-semibold text-fg sm:text-base">
                      {faq.q}
                    </span>
                    <ChevronRight
                      size={18}
                      className="shrink-0 text-fg-subtle transition-transform duration-200 group-open:rotate-90"
                      aria-hidden
                    />
                  </summary>
                  <div className="border-t border-slate-100 px-6 pt-4 pb-5 text-sm leading-relaxed text-fg-muted">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </Section>
        )}

        {/* Related nav */}
        <Section tone={tone('related')} spacing="compact">
          <nav aria-label="Related pages" className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <Link
              href={`/locations/${citySlug}`}
              className="inline-flex items-center gap-1.5 font-semibold text-solar-ink hover:underline"
            >
              <ArrowLeft className="size-4" aria-hidden />
              All services in {loc.name}
            </Link>
            <Link
              href={`/services/${serviceSlug}`}
              className="inline-flex items-center gap-1.5 font-semibold text-solar-ink hover:underline"
            >
              About {svc.title}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </nav>
        </Section>

        <CtaBand
          title={`Ready for ${svc.title} in ${areaName}?`}
          body="Get a free site assessment and custom quote from our licensed engineers."
        />
      </Layout>
    </>
  );
}
