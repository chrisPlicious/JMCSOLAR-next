import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import { SITE_URL } from '@/lib/seo/site';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';
import { effectiveStock, hasVariants, priceFromCentavos } from '@/lib/shop/display';
import type { DbShopItem } from '@/lib/firebase/types';
import ProductDetail from '@/page-components/shop/ProductDetail';

export const dynamic = 'force-dynamic';

/** Fetch a single active-or-inactive shop item by its unique slug. */
async function getItemBySlug(slug: string): Promise<DbShopItem | null> {
  const snap = await adminDb.collection('shopItems').where('slug', '==', slug).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as DbShopItem;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItemBySlug(slug);
  if (!item || !item.active) {
    return { title: 'Item not found', robots: { index: false, follow: false } };
  }
  const title = item.meta_title || item.name;
  const description =
    item.meta_description || item.description || `Buy ${item.name} from JMC Solar PH.`;
  return {
    title,
    description,
    alternates: { canonical: `/shop/${item.slug}` },
    openGraph: {
      title: `${title} | JMC Solar PH`,
      description,
      type: 'website',
      images: item.image_path ? [getPublicUrl(item.image_path)!] : undefined,
    },
  };
}

/** schema.org Product JSON-LD (#6), variant-aware via AggregateOffer. */
function buildProductLd(item: DbShopItem, imageUrl: string | null) {
  const inStock = effectiveStock(item) > 0;
  const availability = inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const url = `${SITE_URL}/shop/${item.slug}`;

  const offers = hasVariants(item)
    ? {
        '@type': 'AggregateOffer',
        priceCurrency: 'PHP',
        lowPrice: (priceFromCentavos(item) / 100).toFixed(2),
        highPrice: (Math.max(...item.variants!.map((v) => v.price_centavos)) / 100).toFixed(2),
        offerCount: item.variants!.length,
        availability,
        url,
      }
    : {
        '@type': 'Offer',
        priceCurrency: 'PHP',
        price: (item.price / 100).toFixed(2),
        availability,
        url,
      };

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    description: item.description || undefined,
    sku: item.sku,
    category: item.category,
    image: imageUrl ? [imageUrl] : undefined,
    brand: { '@type': 'Brand', name: 'JMC Solar PH' },
    offers,
  };
}

export default async function ShopItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getItemBySlug(slug);
  if (!item || !item.active) notFound();

  const imageUrl = getPublicUrl(item.image_path);
  const productLd = buildProductLd(item, imageUrl);
  const breadcrumb = makeBreadcrumbLd([
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: item.name, url: `/shop/${item.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <ProductDetail item={item} imageUrl={imageUrl} />
    </>
  );
}
