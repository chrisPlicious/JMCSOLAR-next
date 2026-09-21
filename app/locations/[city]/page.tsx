import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronRight, MapPin, CheckCircle } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import PageHero from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { cardVariants } from '@/components/ui/Card';
import CtaBand from '@/components/ui/CtaBand';
import ProjectCard from '@/components/ui/ProjectCard';
import ReviewCard from '@/components/ui/ReviewCard';
import { LOCATIONS, getLocation, getMunicipalityLocations, getProvinceSlug, provinceLabel } from '@/data/locations';
import { adminDb } from '@/lib/firebase/admin';
import { itemsNearCity, nearestCities } from '@/lib/data/nearestLocations';
import { getPublicUrl } from '@/lib/firebase/storage';
import { SITE_URL } from '@/lib/seo/site';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';
import { cn } from '@/lib/utils';
import type { DbProject, DbReview, DbService } from '@/lib/firebase/types';
import type { Project, Review } from '@/types';

export const revalidate = 3600;

export function generateStaticParams() {
  return LOCATIONS.map((l) => ({ city: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const loc = getLocation(slug);
  if (!loc) return {};

  // The root layout template appends "| JMC Solar PH"; OG titles don't use the template.
  const title =
    loc.tier === 'province'
      ? `Solar Installation in ${provinceLabel(loc.name)}`
      : `Solar Installation in ${loc.name}, ${loc.province}`;
  const description =
    loc.tier === 'province'
      ? `JMC Solar PH installs residential, commercial, and industrial solar systems across ${provinceLabel(loc.name)}. Free site assessment. Call today.`
      : `JMC Solar PH installs solar panels in ${loc.name}, ${loc.province}. Residential, commercial & industrial systems. DOE-compliant. Free quote.`;

  return {
    title,
    description,
    alternates: { canonical: `/locations/${slug}` },
    openGraph: { title: `${title} | JMC Solar PH`, description },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const loc = getLocation(slug);
  if (!loc) notFound();

  let projects: DbProject[] = [];
  let isFallback = false;
  let reviews: DbReview[] = [];

  const servicesPromise = adminDb.collection('services').orderBy('display_order').get();

  if (loc.tier === 'municipality') {
    const [projectsSnap, reviewsSnap] = await Promise.all([
      adminDb.collection('projects').where('city_slug', '==', slug).limit(12).get(),
      adminDb.collection('reviews').where('city_slug', '==', slug).limit(20).get(),
    ]);

    projects = projectsSnap.docs
      .map((d) => d.data() as DbProject)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 6);

    if (projects.length === 0) {
      const allSnap = await adminDb.collection('projects').limit(200).get();
      projects = itemsNearCity(allSnap.docs.map((d) => d.data() as DbProject), loc).slice(0, 6);
      if (projects.length > 0) isFallback = true;
    }

    reviews = reviewsSnap.docs
      .map((d) => d.data() as DbReview)
      .filter((r) => r.status === 'approved')
      .slice(0, 6);
  } else {
    const childSlugs = loc.childSlugs ?? [];
    if (childSlugs.length > 0) {
      const [projectsSnap, reviewsSnap] = await Promise.all([
        adminDb.collection('projects').where('city_slug', 'in', childSlugs).limit(12).get(),
        adminDb.collection('reviews').where('city_slug', 'in', childSlugs).limit(20).get(),
      ]);
      projects = projectsSnap.docs
        .map((d) => d.data() as DbProject)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 6);
      reviews = reviewsSnap.docs
        .map((d) => d.data() as DbReview)
        .filter((r) => r.status === 'approved')
        .slice(0, 6);
    }
  }

  const servicesSnap = await servicesPromise;
  const services = servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as DbService);

  const mappedProjects: Project[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category as Project['category'],
    system_size: p.system_size,
    description: p.description,
    location: p.location,
    city_slug: p.city_slug,
    facebook_url: p.facebook_url,
    cover_image_path: getPublicUrl(p.cover_image_path),
    created_at: p.created_at,
    completed_at: null,
  }));

  const mappedReviews: Review[] = reviews.map((r) => ({
    id: r.id,
    name: r.reviewer_name,
    rating: r.rating,
    quote: r.quote,
    source: r.source as Review['source'],
  }));

  const childLocations =
    loc.tier === 'province'
      ? getMunicipalityLocations().filter((m) => loc.childSlugs?.includes(m.slug))
      : [];

  // Nearby-city cross-links (municipalities only) — unique per city + interlink the keepers.
  const nearbyCities = loc.tier === 'municipality' ? nearestCities(loc, 4) : [];

  const provinceSlug = getProvinceSlug(loc.province);

  // AggregateRating from the approved reviews actually rendered on this page.
  const ratedReviews = mappedReviews.filter((r) => typeof r.rating === 'number');
  const aggregateRating =
    ratedReviews.length > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: (
            ratedReviews.reduce((s, r) => s + r.rating, 0) / ratedReviews.length
          ).toFixed(1),
          reviewCount: ratedReviews.length,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name:
      loc.tier === 'province'
        ? `Solar Panel Installation in ${provinceLabel(loc.name)}`
        : `Solar Panel Installation in ${loc.name}`,
    provider: { '@id': `${SITE_URL}/#business` },
    areaServed:
      loc.tier === 'province'
        ? { '@type': 'AdministrativeArea', name: loc.name }
        : {
            '@type': 'City',
            name: loc.name,
            geo: { '@type': 'GeoCoordinates', latitude: loc.geo.lat, longitude: loc.geo.lng },
            containedInPlace: {
              '@type': 'AdministrativeArea',
              name: loc.province,
              containedInPlace: { '@type': 'Country', name: 'Philippines' },
            },
          },
    url: `${SITE_URL}/locations/${slug}`,
    ...(aggregateRating && { aggregateRating }),
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: loc.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Locations', url: '/locations' },
    ...(loc.tier === 'municipality' && provinceSlug && loc.province
      ? [{ name: provinceLabel(loc.province), url: `/locations/${provinceSlug}` }]
      : []),
    { name: loc.name, url: `/locations/${slug}` },
  ];

  const breadcrumb = makeBreadcrumbLd(breadcrumbItems);

  const areaName = loc.tier === 'province' ? provinceLabel(loc.name) : loc.name;
  const pageTitle = `Solar Installation in ${areaName}`;

  const pageSubtitle =
    loc.tier === 'province'
      ? `${provinceLabel(loc.name)} · ${loc.region}`
      : `${loc.province} · ${loc.region}`;

  // Alternate white / tint across whichever sections actually render (reviews are a dark band).
  const bands = [
    loc.tier === 'province' && childLocations.length > 0 && 'children',
    'services',
    loc.nearbyAreas && loc.nearbyAreas.length > 0 && 'areas',
    mappedProjects.length > 0 && 'projects',
    loc.tier === 'municipality' && loc.whyJmc.length > 0 && 'why',
    loc.faqs.length > 0 && 'faq',
    nearbyCities.length > 0 && 'nearby',
  ].filter((b): b is string => Boolean(b));
  const tone = (band: string) => (bands.indexOf(band) % 2 === 0 ? 'white' : 'tint');

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Layout>
        <PageHero
          eyebrow={pageSubtitle}
          title={pageTitle}
          lead={loc.intro}
          actions={
            <Button href="/booking" size="lg">
              Get a quote
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          }
        />

        {/* Province: child city grid */}
        {loc.tier === 'province' && childLocations.length > 0 && (
          <Section tone={tone('children')}>
            <SectionHeader title={`Cities & Municipalities in ${loc.name}`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {childLocations.map((child) => (
                <Link
                  key={child.slug}
                  href={`/locations/${child.slug}`}
                  className={cardVariants({ variant: 'link-row' })}
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-control bg-solar-50 text-solar-700">
                    <MapPin size={15} aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-fg transition-colors group-hover:text-solar-ink">
                      {child.name}
                    </p>
                    <p className="text-xs text-fg-subtle">{child.region}</p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-fg-subtle transition-colors group-hover:text-solar-ink" aria-hidden />
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Services grid */}
        <Section tone={tone('services')}>
          <SectionHeader
            title={`Our Services in ${loc.name}`}
            lead={`Tap any service to learn more about solar solutions available in ${areaName}.`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => {
              const IC = Icons[svc.icon as keyof typeof Icons] as ComponentType<LucideProps> | undefined;
              return (
              <Link
                key={svc.id}
                href={`/locations/${slug}/${svc.slug}`}
                className={cn(cardVariants({ variant: 'interactive', padding: 'md' }), 'group flex flex-col gap-4')}
              >
                <span className="grid size-11 place-items-center rounded-control bg-solar-50 text-solar-700">
                  {IC ? <IC size={22} aria-hidden /> : <span className="text-xl" aria-hidden>☀</span>}
                </span>
                <div>
                  <h3 className="text-title text-fg transition-colors group-hover:text-solar-ink mb-1">
                    {svc.title}
                  </h3>
                  <p className="text-sm text-fg-muted line-clamp-2">{svc.description}</p>
                </div>
                <span className="mt-auto text-sm font-semibold text-solar-ink">Learn more →</span>
              </Link>
              );
            })}
          </div>
        </Section>

        {/* Areas we serve (barangays / localities) */}
        {loc.nearbyAreas && loc.nearbyAreas.length > 0 && (
          <Section tone={tone('areas')}>
            <SectionHeader
              title={`Areas We Serve in ${loc.name}`}
              lead={`JMC Solar installs across ${loc.name} and its surrounding barangays and localities:`}
            />
            <div className="flex flex-wrap gap-2.5">
              {loc.nearbyAreas.map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm text-fg-muted"
                >
                  <MapPin size={13} className="text-solar-600" aria-hidden />
                  {area}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Projects */}
        {mappedProjects.length > 0 && (
          <Section tone={tone('projects')}>
            <SectionHeader
              title={isFallback ? `Recent Work Near ${loc.name}` : `Completed Projects in ${loc.name}`}
              lead={
                isFallback
                  ? `No tagged projects yet for ${loc.name} — showing nearby work within 80 km.`
                  : undefined
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mappedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </Section>
        )}

        {/* Reviews */}
        {mappedReviews.length > 0 && (
          <Section tone="dark">
            <SectionHeader title={`What Our ${loc.name} Customers Say`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mappedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </Section>
        )}

        {/* Why JMC (municipality only) */}
        {loc.tier === 'municipality' && loc.whyJmc.length > 0 && (
          <Section tone={tone('why')}>
            <SectionHeader title={`Why Choose JMC Solar PH in ${loc.name}?`} />
            <ul className="max-w-3xl space-y-4">
              {loc.whyJmc.map((reason, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle size={20} className="mt-0.5 shrink-0 text-green-eco" aria-hidden />
                  <span className="text-fg-muted">{reason}</span>
                </li>
              ))}
            </ul>
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

        {/* Nearby cities */}
        {nearbyCities.length > 0 && (
          <Section tone={tone('nearby')}>
            <SectionHeader title={`Solar Installation Near ${loc.name}`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {nearbyCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/locations/${city.slug}`}
                  className={cardVariants({ variant: 'link-row' })}
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-control bg-solar-50 text-solar-700">
                    <MapPin size={15} aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-fg transition-colors group-hover:text-solar-ink">
                      {city.name}
                    </p>
                    <p className="text-xs text-fg-subtle">{city.province ?? city.region}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}

        <CtaBand
          title={`Get a Free Solar Quote in ${loc.name}`}
          body="Our team will visit your site, assess your energy needs, and provide a no-obligation proposal."
        />
      </Layout>
    </>
  );
}
