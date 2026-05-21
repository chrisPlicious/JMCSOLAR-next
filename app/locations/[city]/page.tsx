import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, MapPin, CheckCircle } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProjectCard from '@/components/ui/ProjectCard';
import ReviewCard from '@/components/ui/ReviewCard';
import { LOCATIONS, getLocation, getMunicipalityLocations, getProvinceSlug } from '@/data/locations';
import { adminDb } from '@/lib/firebase/admin';
import { itemsNearCity } from '@/lib/data/nearestLocations';
import { SITE_URL } from '@/lib/seo/site';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';
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

  const title =
    loc.tier === 'province'
      ? `Solar Installation in ${loc.name} Province | JMC Solar PH`
      : `Solar Installation in ${loc.name}, ${loc.province} | JMC Solar PH`;
  const description =
    loc.tier === 'province'
      ? `JMC Solar PH installs residential, commercial, and industrial solar systems across ${loc.name} Province. Free site assessment. Call today.`
      : `JMC Solar PH installs solar panels in ${loc.name}, ${loc.province}. Residential, commercial & industrial systems. DOE-compliant. Free quote.`;

  return {
    title,
    description,
    alternates: { canonical: `/locations/${slug}` },
    openGraph: { title, description },
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
    cover_image_path: p.cover_image_path,
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

  const provinceSlug = getProvinceSlug(loc.province);

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name:
      loc.tier === 'province'
        ? `Solar Panel Installation in ${loc.name} Province`
        : `Solar Panel Installation in ${loc.name}`,
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
    url: `${SITE_URL}/locations/${slug}`,
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
    ...(loc.tier === 'municipality' && provinceSlug
      ? [{ name: `${loc.province} Province`, url: `/locations/${provinceSlug}` }]
      : []),
    { name: loc.name, url: `/locations/${slug}` },
  ];

  const breadcrumb = makeBreadcrumbLd(breadcrumbItems);

  const pageTitle =
    loc.tier === 'province'
      ? `Solar Installation in ${loc.name} Province`
      : `Solar Installation in ${loc.name}`;

  const pageSubtitle =
    loc.tier === 'province'
      ? `${loc.name} Province · ${loc.region}`
      : `${loc.province} · ${loc.region}`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Layout>
        {/* Hero */}
        <section className="bg-navy-950 text-white pt-28 pb-16 sm:pt-32 sm:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-white/50 text-sm mb-8 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
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
              <span className="text-white/80">{loc.name}</span>
            </nav>

            <p className="text-solar-400 text-sm font-semibold uppercase tracking-widest mb-3">
              {pageSubtitle}
            </p>
            <h1
              className="font-black text-4xl sm:text-5xl lg:text-6xl mb-5 leading-tight"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {pageTitle}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl leading-relaxed mb-8">
              {loc.intro}
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

          {/* Province: child city grid */}
          {loc.tier === 'province' && childLocations.length > 0 && (
            <section>
              <h2
                className="font-black text-2xl sm:text-3xl text-navy-900 mb-8"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Cities &amp; Municipalities in {loc.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {childLocations.map((child) => (
                  <Link
                    key={child.slug}
                    href={`/locations/${child.slug}`}
                    className="group flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-solar-400 hover:bg-solar-500/5 transition-all duration-200"
                  >
                    <div className="w-9 h-9 bg-solar-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin size={15} className="text-solar-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy-900 text-sm group-hover:text-solar-600 transition-colors truncate">
                        {child.name}
                      </p>
                      <p className="text-slate-400 text-xs">{child.region}</p>
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-slate-300 group-hover:text-solar-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Services grid */}
          <section>
            <h2
              className="font-black text-2xl sm:text-3xl text-navy-900 mb-2"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Our Services in {loc.name}
            </h2>
            <p className="text-slate-500 mb-8">
              Tap any service to learn more about solar solutions available in {loc.tier === 'province' ? `${loc.name} Province` : loc.name}.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => {
                const IC = Icons[svc.icon as keyof typeof Icons] as ComponentType<LucideProps> | undefined;
                return (
                <Link
                  key={svc.id}
                  href={`/locations/${slug}/${svc.slug}`}
                  className="group flex flex-col gap-3 p-5 rounded-2xl border border-slate-200 hover:border-solar-400 hover:bg-solar-500/5 transition-all duration-200"
                >
                  <span className="text-solar-500">
                    {IC ? <IC size={26} /> : <span className="text-2xl">☀</span>}
                  </span>
                  <div>
                    <p className="font-bold text-navy-900 group-hover:text-solar-600 transition-colors mb-1">
                      {svc.title}
                    </p>
                    <p className="text-slate-500 text-sm line-clamp-2">{svc.description}</p>
                  </div>
                  <span className="text-solar-600 text-xs font-semibold mt-auto">Learn more →</span>
                </Link>
                );
              })}
            </div>
          </section>

          {/* Projects */}
          {mappedProjects.length > 0 && (
            <section>
              <h2
                className="font-black text-2xl sm:text-3xl text-navy-900 mb-2"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {isFallback ? `Recent Work Near ${loc.name}` : `Completed Projects in ${loc.name}`}
              </h2>
              {isFallback && (
                <p className="text-slate-500 mb-8 text-sm">
                  No tagged projects yet for {loc.name} — showing nearby work within 80 km.
                </p>
              )}
              {!isFallback && <div className="mb-8" />}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mappedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          {mappedReviews.length > 0 && (
            <section>
              <h2
                className="font-black text-2xl sm:text-3xl text-navy-900 mb-8"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                What Our {loc.name} Customers Say
              </h2>
              <div className="bg-navy-950 rounded-3xl p-8 sm:p-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mappedReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Why JMC (municipality only) */}
          {loc.tier === 'municipality' && loc.whyJmc.length > 0 && (
            <section>
              <h2
                className="font-black text-2xl sm:text-3xl text-navy-900 mb-8"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Why Choose JMC Solar PH in {loc.name}?
              </h2>
              <ul className="space-y-4">
                {loc.whyJmc.map((reason, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-solar-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700">{reason}</span>
                  </li>
                ))}
              </ul>
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

          {/* CTA */}
          <div className="bg-navy-950 rounded-3xl px-6 py-10 sm:px-10 sm:py-12 text-center">
            <h2
              className="text-white font-black text-2xl sm:text-3xl mb-3"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Get a Free Solar Quote in {loc.name}
            </h2>
            <p className="text-white/60 text-lg mb-7 max-w-xl mx-auto">
              Our team will visit your site, assess your energy needs, and provide a no-obligation proposal.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold px-7 py-3.5 rounded-xl transition-colors duration-200"
            >
              Request a Free Site Assessment
              <ChevronRight size={18} />
            </Link>
          </div>

        </div>
      </Layout>
    </>
  );
}
