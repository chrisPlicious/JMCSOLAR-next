import type { Metadata } from 'next';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';
import { toShopCardItem } from '@/lib/shop/display';
import type { DbShopItem } from '@/lib/firebase/types';
import ShopIndex from '@/page-components/shop/ShopIndex';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Buy solar lights, wires, and accessories online from JMC Solar PH. Guest checkout, nationwide delivery, and free store pickup in Ormoc City, Leyte.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'Shop Solar Lights & Accessories | JMC Solar PH',
    description:
      'Solar lights, PV wires, and accessories — buy online with guest checkout and nationwide delivery.',
  },
};

const SHOP_CATEGORIES = ['lights', 'wires', 'accessories'] as const;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = '', category = 'all' } = await searchParams;

  // Small catalog: fetch all active items and hand the full set to the client, which
  // filters by category + search live (no navigation). Add a Firestore query +
  // pagination once the catalog grows.
  const snap = await adminDb.collection('shopItems').orderBy('created_at', 'desc').get();
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DbShopItem[];
  const active = all.filter((i) => i.active);

  // Category counts (over all active items).
  const counts: Record<string, number> = { all: active.length };
  for (const cat of SHOP_CATEGORIES) {
    counts[cat] = active.filter((i) => i.category === cat).length;
  }

  const items = active.map((i) => toShopCardItem(i, getPublicUrl(i.image_path)));
  const validCategory = (SHOP_CATEGORIES as readonly string[]).includes(category) ? category : 'all';

  const breadcrumb = makeBreadcrumbLd([
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <ShopIndex items={items} initialQuery={q} initialCategory={validCategory} counts={counts} />
    </>
  );
}
