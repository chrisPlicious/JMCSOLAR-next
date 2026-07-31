import { SITE_URL } from '@/lib/seo/site';
import type { Product } from '@/types';

/**
 * Product JSON-LD. Deliberately emits NO `offers` — these products are inquiry-only
 * (no public price). A partial Offer without price/availability triggers Rich Results
 * errors, and fabricating a price is dishonest. Google will warn "missing offers" —
 * that is expected and acceptable; the entity markup still aids AI/search understanding.
 * Add an `offers` block ONLY when real price + availability exist.
 *
 * `imageUrl` must be an absolute URL (resolve product.image_path via getPublicUrl first).
 */
export function productLd(product: Product, imageUrl: string | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: `${SITE_URL}/products/${product.slug}`,
    ...(imageUrl && { image: imageUrl }),
    ...(product.description && { description: product.description }),
    ...(product.brand && { brand: { '@type': 'Brand', name: product.brand } }),
    category: product.category,
  };
}

/**
 * Content-completeness gate for indexation. Only substantial products get a
 * detail page indexed + a sitemap entry — this is the anti-thin-doorway discipline
 * (the same lesson as the location pages). Thin products still render for users
 * (via /products) but their detail page is noindex and stays out of the sitemap.
 */
export function isProductIndexable(product: Product): boolean {
  return Boolean(
    product.slug &&
      product.image_path &&
      product.description &&
      product.description.trim().length >= 120 &&
      product.specs
  );
}
