import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import type { DbProduct } from '@/lib/firebase/types';
import EditProductForm from '../_components/EditProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snap = await adminDb.collection('products').doc(id).get();
  if (!snap.exists) notFound();
  const product = { id: snap.id, ...(snap.data() as Omit<DbProduct, 'id'>) };
  const imageUrl = getPublicUrl(product.image_path);
  return <EditProductForm product={product} imageUrl={imageUrl} />;
}
