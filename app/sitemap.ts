import type { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase/admin';
import { SITE_URL } from '@/lib/seo/site';
import { LOCATIONS } from '@/data/locations';
import { isIndexableCityService } from '@/data/indexableCityServices';
import { isProductIndexable } from '@/lib/seo/product';
import { isServiceIndexable } from '@/lib/seo/service';
import { getServices, getServiceDetail } from '@/data/services';
import type { Product } from '@/types';

// Google ignores <changefreq> and <priority>, and only trusts <lastmod> when it
// is accurate — so entries carry a lastModified ONLY when it comes from a real
// document timestamp. Pages built from static code/data omit it rather than
// claiming "modified now" on every crawl.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    '',
    '/services',
    '/products',
    '/projects',
    '/calculator',
    '/locations',
    '/results',
  ].map((path) => ({ url: `${SITE_URL}${path}` }));

  // Service detail pages — same gate as the page's robots (isServiceIndexable).
  const services = getServices();
  const serviceSlugs = services.map((s) => s.slug);
  const servicePages: MetadataRoute.Sitemap = services.flatMap((s) => {
    if (!isServiceIndexable(getServiceDetail(s.slug))) return [];
    const t = Date.parse(s.updated_at);
    return [
      {
        url: `${SITE_URL}/services/${s.slug}`,
        ...(Number.isFinite(t) && { lastModified: new Date(t) }),
      },
    ];
  });

  // Location landing pages — one per city/province slug.
  const locationPages: MetadataRoute.Sitemap = LOCATIONS.map((loc) => ({
    url: `${SITE_URL}/locations/${loc.slug}`,
  }));

  // City × service cross-pages — only allowlisted combos (data/indexableCityServices.ts).
  // Empty allowlist = none emitted: the rest are pruned (noindex) so must NOT appear here.
  const cityServicePages: MetadataRoute.Sitemap = LOCATIONS.flatMap((loc) =>
    serviceSlugs
      .filter((serviceSlug) => isIndexableCityService(loc.slug, serviceSlug))
      .map((serviceSlug) => ({ url: `${SITE_URL}/locations/${loc.slug}/${serviceSlug}` })),
  );

  // Product detail pages — only substantial products (isProductIndexable gate), so
  // thin/slug-less products stay out of the index just like the pruned location combos.
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const snap = await adminDb.collection('products').get();
    productPages = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Product)
      .filter(isProductIndexable)
      // No lastModified: product docs carry only created_at (edits don't stamp a
      // date), and a creation date would under-report every later edit.
      .map((p) => ({ url: `${SITE_URL}/products/${p.slug}` }));
  } catch (err) {
    console.error('[sitemap] Failed to fetch product pages:', err);
  }

  return [
    ...staticPages,
    ...servicePages,
    ...locationPages,
    ...cityServicePages,
    ...productPages,
  ];
}
