import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ServicePageLayout from '@/components/ui/ServicePageLayout';
import ServiceEmptyState from '@/components/ui/ServiceEmptyState';
import PowerFlowSimulatorLazy from '@/page-components/services/PowerFlowSimulatorLazy';
import { isSimulatorSystem } from '@/lib/power-flow/systems';
import { getServiceBySlug, getServiceDetail, getServices } from '@/data/services';
import { SITE_URL } from '@/lib/seo/site';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';
import { pageMetadata } from '@/lib/seo/metadata';
import { BUSINESS_ID } from '@/lib/seo/organization';
import { isServiceIndexable } from '@/lib/seo/service';

// Services are defined in code, so every route is known at build time.
export const dynamicParams = false;

export function generateStaticParams() {
  return getServices().map((s) => ({ id: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  const detail = getServiceDetail(slug);
  return pageMetadata({
    title: service.title,
    description: service.description,
    path: `/services/${slug}`,
    routeImage: true,
    // Same gate as the sitemap: empty or intro-only service pages stay noindex.
    index: isServiceIndexable(detail),
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;

  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const detail = getServiceDetail(slug);
  if (!detail) {
    return <ServiceEmptyState service={service} />;
  }

  // areaServed lives on the business node (root layout); provider points at it.
  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    provider: { '@id': BUSINESS_ID },
    url: `${SITE_URL}/services/${slug}`,
  };

  const breadcrumb = makeBreadcrumbLd([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: service.title, url: `/services/${slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <ServicePageLayout
        heroBgImage="/assets/bg-4.jpg"
        title={service.title}
        iconName={service.icon}
        serviceId={service.slug}
        tagline={detail.tagline}
        overview={detail.overview}
        whatIsIt={detail.what_is_it}
        howItWorks={detail.how_it_works}
        simulator={isSimulatorSystem(slug) ? <PowerFlowSimulatorLazy system={slug} /> : undefined}
        benefits={detail.benefits}
        useCases={detail.use_cases}
        specs={detail.specs}
        sources={detail.sources}
      />
    </>
  );
}
