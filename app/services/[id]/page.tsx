import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import ServicePageLayout from '@/components/ui/ServicePageLayout';
import ServiceEmptyState from '@/components/ui/ServiceEmptyState';
import type { DbService, DbServiceDetail } from '@/lib/firebase/types';
import { SITE_URL } from '@/lib/seo/site';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';
import { buildAreaServedArray } from '@/lib/seo/serviceArea';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: slug } = await params;
  const snap = await adminDb
    .collection('services')
    .where('slug', '==', slug)
    .limit(1)
    .get();
  if (snap.empty) return {};
  const service = snap.docs[0].data() as DbService;
  return {
    title: service.title,
    description: service.description,
    alternates: { canonical: `/services/${slug}` },
    openGraph: {
      title: `${service.title} | JMC Solar PH`,
      description: service.description,
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;

  const snap = await adminDb.collection('services').where('slug', '==', slug).limit(1).get();

  if (snap.empty) {
    notFound();
  }

  const serviceDoc = snap.docs[0];
  const service = { id: serviceDoc.id, ...serviceDoc.data() } as DbService;

  const detailQuery = await adminDb.collection('serviceDetails').where('service_id', '==', service.id).limit(1).get();
  const detail = !detailQuery.empty ? (detailQuery.docs[0].data() as DbServiceDetail) : null;

  if (!detail) {
    return <ServiceEmptyState service={service} />;
  }

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    provider: { '@id': `${SITE_URL}/#business` },
    areaServed: buildAreaServedArray(),
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
