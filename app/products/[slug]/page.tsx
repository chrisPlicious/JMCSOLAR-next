import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';
import { productLd, isProductIndexable } from '@/lib/seo/product';
import ProductDetail from '@/page-components/products/ProductDetail';
import type { Product } from '@/types';

export const revalidate = 60;

async function getProductBySlug(slug: string): Promise<Product | null> {
  const snap = await adminDb.collection('products').where('slug', '==', slug).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Product;
}

export async function generateStaticParams() {
  try {
    const snap = await adminDb.collection('products').get();
    return snap.docs
      .map((d) => (d.data() as Product).slug)
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const description =
    product.description ??
    `${product.name}${product.specs ? ` — ${product.specs}` : ''} available through JMC Solar PH.`;
  const imageUrl = getPublicUrl(product.image_path);

  return {
    title: product.name,
    description,
    // Thin products stay out of the index until enriched (same anti-doorway gate as
    // the location pages) — they still render for users at /products/[slug].
    robots: { index: isProductIndexable(product), follow: true },
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: `${product.name} | JMC Solar PH`,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const imageUrl = getPublicUrl(product.image_path);

  // Related products: same category, exclude self, needs a slug for its link.
  let relatedProducts: { product: Product; imageUrl: string | null }[] = [];
  try {
    const snap = await adminDb
      .collection('products')
      .where('category', '==', product.category)
      .limit(8)
      .get();
    relatedProducts = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Product)
      .filter((p) => p.id !== product.id && Boolean(p.slug))
      .slice(0, 4)
      .map((p) => ({ product: p, imageUrl: getPublicUrl(p.image_path) }));
  } catch {
    relatedProducts = [];
  }

  const breadcrumb = makeBreadcrumbLd([
    { name: 'Home', url: '/' },
    { name: 'Solar Products', url: '/products' },
    { name: product.name, url: `/products/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd(product, imageUrl)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <ProductDetail product={product} imageUrl={imageUrl} relatedProducts={relatedProducts} />
    </>
  );
}
