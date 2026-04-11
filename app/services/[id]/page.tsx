import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import ServicePageLayout from '@/components/ui/ServicePageLayout';
import ServiceEmptyState from '@/components/ui/ServiceEmptyState';
import type { DbService, DbServiceDetail } from '@/lib/firebase/types';

export const revalidate = 60;

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

  return (
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
  );
}
