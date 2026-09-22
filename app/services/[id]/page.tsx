import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ServicePageLayout from '@/components/ui/ServicePageLayout';
import ServiceEmptyState from '@/components/ui/ServiceEmptyState';
import { getServiceBySlug, getServiceDetail } from '@/lib/data/getServices';
import { SITE_URL } from '@/lib/seo/site';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';
import { pageMetadata } from '@/lib/seo/metadata';
import { BUSINESS_ID } from '@/lib/seo/organization';
import { isServiceIndexable } from '@/lib/seo/service';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  const detail = await getServiceDetail(service.id);
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

  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const detail = await getServiceDetail(service.id);
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
        benefits={detail.benefits}
        useCases={detail.use_cases.map((u) => u.item)}
        specs={detail.specs}
        sources={detail.sources}
      />
    </>
  );
}
