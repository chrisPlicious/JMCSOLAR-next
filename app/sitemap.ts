import type { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase/admin';
import { SITE_URL } from '@/lib/seo/site';
import { LOCATIONS } from '@/data/locations';
import { isIndexableCityService } from '@/data/indexableCityServices';
import { isProductIndexable } from '@/lib/seo/product';
import { isServiceIndexable } from '@/lib/seo/service';
import { getServices } from '@/lib/data/getServices';
import type { DbServiceDetail } from '@/lib/firebase/types';
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
  let servicePages: MetadataRoute.Sitemap = [];
  let serviceSlugs: string[] = [];
  try {
    const [services, detailsSnap] = await Promise.all([
      getServices(),
      adminDb.collection('serviceDetails').get(),
    ]);
    const detailByService = new Map(
      detailsSnap.docs.map((d) => {
        const detail = d.data() as DbServiceDetail;
        return [detail.service_id, detail] as const;
      }),
    );
    serviceSlugs = services.map((s) => s.slug);
    servicePages = services.flatMap((s) => {
      const detail = detailByService.get(s.id) ?? null;
      if (!isServiceIndexable(detail)) return [];
      // The page renders both docs, so it changed whenever either one did.
      const times = [s.updated_at || s.created_at, detail?.updated_at]
        .map((t) => (t ? Date.parse(t) : NaN))
        .filter(Number.isFinite);
      return [
        {
          url: `${SITE_URL}/services/${s.slug}`,
          ...(times.length > 0 && { lastModified: new Date(Math.max(...times)) }),
        },
      ];
    });
  } catch (err) {
    console.error('[sitemap] Failed to fetch service pages:', err);
  }

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
