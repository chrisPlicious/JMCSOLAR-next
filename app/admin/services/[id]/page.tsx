import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import ServiceForm from '../_components/ServiceForm';
import { updateService } from '../actions';
import type { DbService, DbServiceDetail } from '@/lib/firebase/types';

export const dynamic = 'force-dynamic';

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const serviceSnap = await adminDb.collection('services').doc(id).get();
  const service = serviceSnap.exists ? ({ id: serviceSnap.id, ...serviceSnap.data() } as DbService) : null;
  if (!service) notFound();

  const detailQuery = await adminDb.collection('serviceDetails').where('service_id', '==', service.id).limit(1).get();
  const detail = !detailQuery.empty ? (detailQuery.docs[0].data() as DbServiceDetail) : null;

  const bound = updateService.bind(null, id);
  return <ServiceForm action={bound} service={service} detail={detail} />;
}
