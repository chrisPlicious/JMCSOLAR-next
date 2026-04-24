import type { Metadata } from 'next';
import ProductsPage from '@/page-components/products/ProductsIndex';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import type { Product } from '@/types';

export const metadata: Metadata = {
  title: 'Solar Products',
  description:
    'Browse premium solar panels, inverters, batteries, and charge controllers from top brands. Available through JMC Solar PH in the Philippines.',
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'Solar Products | JMC Solar PH',
    description:
      'Premium solar panels, inverters, batteries, and charge controllers from trusted brands.',
  },
};

export default async function Products() {
  const snap = await adminDb.collection('products').orderBy('created_at', 'desc').get();
  const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const products: Product[] = (data ?? []).map((p) => ({
    ...(p as Product),
    image_path: getPublicUrl((p as { image_path?: string | null }).image_path ?? null),
  }));

  return <ProductsPage products={products} />;
}
