import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import EditResultForm from '../_components/EditResultForm';
import type { BillResult } from '@/types';

export const dynamic = 'force-dynamic';

export default async function EditResultPage({ params }: { params: { id: string } }) {
  const doc = await adminDb.collection('results').doc(params.id).get();
  if (!doc.exists) notFound();

  const data = doc.data() as Omit<BillResult, 'id'>;
  const result: BillResult = { id: doc.id, ...data };

  return (
    <EditResultForm
      result={result}
      beforeImageUrl={getPublicUrl(data.before_image_path)}
      afterImageUrl={getPublicUrl(data.after_image_path)}
    />
  );
}
